// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ICompact, IAllocator, Claim, Component, ForcedWithdrawalStatus} from "./interfaces/ICompact.sol";
import {IDuelResolver, Outcome, Ctx} from "./interfaces/IDuelResolver.sol";

/// @title crows
/// @notice Two players stake on a game whose rules are a contract (the resolver). Code decides who is paid.
///
/// Money never sits in this contract. Each stake is deposited into Uniswap's The Compact as a resource lock
/// owned by the player, and committed (registered) to a compact whose arbiter is this contract. This contract
/// is also the lock's allocator, and it allows exactly one thing: its own claims. So a stake can only leave the
/// lock in two ways:
///   1. this contract pays it to the winner, or back to its owner (draw, cancel, expiry); or
///   2. the owner forces a withdrawal through The Compact, which takes RESET_PERIOD. Every compact expires
///      before that, and a duel must end well before its compacts expire.
///
/// Lifecycle: challenge -> (accept | cancel) -> reveal moves (optional) -> settle | expire.
/// Moves are sealed: each side commits keccak256(abi.encode(chainid, crows, player, move, salt)) and reveals once
/// the duel is live.
contract Crows is IAllocator {
    // ------------------------------------------------------------------ constants

    ICompact public immutable COMPACT;
    uint96 public immutable ALLOCATOR_ID;
    /// @dev scope = chain-specific, reset period = 30 days, allocator = this.
    bytes12 public immutable LOCK_TAG;

    uint256 public constant RESET_PERIOD = 30 days;
    /// @notice Compacts expire this long after the stake is locked, before any forced withdrawal could complete.
    uint256 public constant CLAIM_WINDOW = RESET_PERIOD - 1 hours;
    /// @notice A duel's settleBy must leave at least this much time before its compacts expire, for refunds.
    uint256 public constant EXPIRY_MARGIN = 1 days;

    string public constant WITNESS_TYPESTRING = "uint256 duel";
    bytes32 public constant MANDATE_TYPEHASH = keccak256("Mandate(uint256 duel)");
    bytes32 public constant COMPACT_TYPEHASH = keccak256(
        "Compact(address arbiter,address sponsor,uint256 nonce,uint256 expires,bytes12 lockTag,address token,uint256 amount,Mandate mandate)Mandate(uint256 duel)"
    );

    // ------------------------------------------------------------------ types

    enum State {
        None,
        Open, // posted, waiting for a taker
        Live, // both stakes locked
        Settled, // paid out (including draws and expiries)
        Cancelled // never taken; challenger refunded
    }

    /// @notice What a challenger proposes.
    struct Terms {
        address resolver; // the game
        bytes params; // game parameters, see resolver.describe()
        address token; // stake token (both sides)
        uint128 stakeA; // challenger's stake
        uint128 stakeB; // taker's stake (may differ: that's the odds)
        address opponent; // address(0) = anyone may take it
        uint64 takeBy;
        uint64 revealBy;
        uint64 settleBy;
    }

    struct Side {
        address player;
        uint128 stake; // amount actually locked
        uint64 expires; // compact expiry
        uint256 nonce; // allocator nonce of the compact
        bytes32 commitment; // sealed move, or 0 if none
        bytes move; // revealed move, empty until revealed
    }

    struct Duel {
        address resolver;
        bytes32 resolverCodehash;
        address token;
        address opponent;
        uint128 stakeB;
        uint64 takeBy;
        uint64 revealBy;
        uint64 settleBy;
        State state;
        Outcome outcome;
        bytes params;
        Side a;
        Side b;
    }

    // ------------------------------------------------------------------ storage

    Duel[] internal _duels;
    /// @notice Display names for scoreboards. Anyone can name their own address.
    mapping(address => string) public nameOf;
    /// @notice A player's one-line reasoning for a duel, written once and only before the duel is decided, so it
    /// can't be edited after the result is known.
    struct Note {
        string text;
        uint64 at;
    }

    mapping(uint256 => mapping(address => Note)) internal _notes;
    uint256 public nextNonce = 1;
    uint256 private _locked = 1;

    // ------------------------------------------------------------------ events

    event Named(address indexed player, string name);
    event Challenged(
        uint256 indexed duel,
        address indexed a,
        address indexed opponent,
        address resolver,
        address token,
        uint256 stakeA,
        uint256 stakeB,
        uint64 takeBy,
        uint64 revealBy,
        uint64 settleBy,
        bytes params,
        bytes32 commitment
    );
    event Accepted(uint256 indexed duel, address indexed b, uint256 stake, bytes32 commitment);
    event Revealed(uint256 indexed duel, address indexed player, bytes move);
    event Settled(uint256 indexed duel, Outcome outcome, address indexed winner, uint256 pot, address settler);
    event Noted(uint256 indexed duel, address indexed player, string text);
    event Expired(uint256 indexed duel);
    /// @notice A side's compact had already expired, so its stake stays in the player's own Compact lock, where the
    /// player can withdraw it through The Compact's forced withdrawal. Only happens if nobody settled for over a day.
    event PayoutSkipped(uint256 indexed duel, address indexed player, uint256 amount);
    event Cancelled(uint256 indexed duel);

    // ------------------------------------------------------------------ errors

    error BadTimes();
    error TooLong();
    error ZeroStake();
    error NoResolver();
    error InvalidTerms(string reason);
    error SelfDuel();
    error WrongState(State state);
    error TooLate();
    error TooEarly();
    error NotOpponent();
    error NotAPlayer();
    error AlreadyRevealed();
    error BadReveal();
    error ResolverChanged();
    error NotYet();
    error ForcedWithdrawalActive();
    error TransferFailed();
    error NothingDeposited();
    error Reentrancy();
    error OnlyCompact();
    error UnknownDuel();
    error NameTooLong();
    error NoteTooLong();
    error AlreadyNoted();

    modifier nonReentrant() {
        if (_locked != 1) revert Reentrancy();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(ICompact compact) {
        COMPACT = compact;
        uint96 allocatorId = compact.__registerAllocator(address(this), "");
        ALLOCATOR_ID = allocatorId;
        // scope ChainSpecific (1) at bit 255, reset period ThirtyDays (7) at bits 252-254, allocator id at bits 160+.
        LOCK_TAG = bytes12(bytes32((uint256(1) << 255) | (uint256(7) << 252) | (uint256(allocatorId) << 160)));
    }

    // ================================================================== players

    /// @notice Optional display name for scoreboards. It carries no authority; names are not unique.
    function setName(string calldata name) external {
        if (bytes(name).length > 32) revert NameTooLong();
        nameOf[msg.sender] = name;
        emit Named(msg.sender, name);
    }

    /// @notice Record your reasoning for a duel you're in. Once only, at most 280 bytes, and only while the duel is
    /// open or live: the scoreboard can then show what a bot thought before anyone knew the result.
    function note(uint256 id, string calldata text) external {
        Duel storage d = _duel(id);
        if (d.state != State.Open && d.state != State.Live) revert WrongState(d.state);
        _sideOf(d, msg.sender); // reverts NotAPlayer
        if (bytes(text).length > 280) revert NoteTooLong();
        Note storage n = _notes[id][msg.sender];
        if (n.at != 0) revert AlreadyNoted();
        n.text = text;
        n.at = uint64(block.timestamp);
        emit Noted(id, msg.sender, text);
    }

    /// @notice Post a challenge and lock the challenger's stake. The caller must have approved `t.stakeA` of
    /// `t.token` to this contract.
    /// @param commitment sealed move (see commitmentOf), or 0 if the game has no moves.
    function challenge(Terms calldata t, bytes32 commitment) external nonReentrant returns (uint256 id) {
        if (!(block.timestamp < t.takeBy && t.takeBy <= t.revealBy && t.revealBy <= t.settleBy)) revert BadTimes();
        if (uint256(t.settleBy) + EXPIRY_MARGIN > block.timestamp + CLAIM_WINDOW) revert TooLong();
        if (t.stakeA == 0 || t.stakeB == 0) revert ZeroStake();
        if (t.opponent == msg.sender) revert SelfDuel();
        if (t.resolver.code.length == 0) revert NoResolver();
        (bool ok, string memory reason) = IDuelResolver(t.resolver).validate(t.params, t.takeBy, t.revealBy, t.settleBy);
        if (!ok) revert InvalidTerms(reason);

        id = _duels.length;
        Duel storage d = _duels.push();
        d.resolver = t.resolver;
        d.resolverCodehash = t.resolver.codehash;
        d.token = t.token;
        d.opponent = t.opponent;
        d.stakeB = t.stakeB;
        d.takeBy = t.takeBy;
        d.revealBy = t.revealBy;
        d.settleBy = t.settleBy;
        d.params = t.params;
        d.state = State.Open;
        d.a.player = msg.sender;
        d.a.commitment = commitment;
        _lock(id, d.a, t.token, t.stakeA);

        emit Challenged(
            id,
            msg.sender,
            t.opponent,
            t.resolver,
            t.token,
            d.a.stake,
            t.stakeB,
            t.takeBy,
            t.revealBy,
            t.settleBy,
            t.params,
            commitment
        );
    }

    /// @notice Take an open challenge and lock the taker's stake (`stakeB` of the duel's token must be approved).
    function accept(uint256 id, bytes32 commitment) external nonReentrant {
        Duel storage d = _duel(id);
        if (d.state != State.Open) revert WrongState(d.state);
        if (block.timestamp > d.takeBy) revert TooLate();
        if (d.opponent != address(0) && msg.sender != d.opponent) revert NotOpponent();
        if (msg.sender == d.a.player) revert SelfDuel();

        d.state = State.Live;
        d.b.player = msg.sender;
        d.b.commitment = commitment;
        _lock(id, d.b, d.token, d.stakeB);

        emit Accepted(id, msg.sender, d.b.stake, commitment);
    }

    /// @notice Reveal a sealed move. Anyone holding the move and salt may call it; it must happen by revealBy.
    function reveal(uint256 id, address player, bytes calldata move, bytes32 salt) external {
        Duel storage d = _duel(id);
        // Only once both sides are committed: an open challenge's move must stay hidden from would-be takers.
        if (d.state != State.Live) revert WrongState(d.state);
        if (block.timestamp > d.revealBy) revert TooLate();
        Side storage s = _sideOf(d, player);
        if (s.move.length != 0) revert AlreadyRevealed();
        if (move.length == 0 || s.commitment != commitmentOf(player, move, salt)) revert BadReveal();
        s.move = move;
        emit Revealed(id, player, move);
    }

    /// @notice Ask the resolver for the result and pay out. Anyone may call it, with whatever evidence the game needs.
    function settle(uint256 id, bytes calldata evidence) external nonReentrant {
        Duel storage d = _duel(id);
        if (d.state != State.Live) revert WrongState(d.state);
        if (block.timestamp > d.settleBy) revert TooLate();
        if (d.resolver.codehash != d.resolverCodehash) revert ResolverChanged();

        Outcome o = IDuelResolver(d.resolver).resolve(ctxOf(id), d.params, d.a.move, d.b.move, evidence);
        if (o == Outcome.Pending) revert NotYet();
        _finish(id, d, o);
    }

    /// @notice A live duel nobody settled by settleBy ends as a Draw: both stakes go back.
    function expire(uint256 id) external nonReentrant {
        Duel storage d = _duel(id);
        if (d.state != State.Live) revert WrongState(d.state);
        if (block.timestamp <= d.settleBy) revert TooEarly();
        emit Expired(id);
        _finish(id, d, Outcome.Draw);
    }

    /// @notice Withdraw an untaken challenge. The challenger may do it any time; anyone may after takeBy.
    function cancel(uint256 id) external nonReentrant {
        Duel storage d = _duel(id);
        if (d.state != State.Open) revert WrongState(d.state);
        if (msg.sender != d.a.player && block.timestamp <= d.takeBy) revert TooEarly();
        d.state = State.Cancelled;
        emit Cancelled(id);
        _pay(id, d.token, d.a, d.a.player);
    }

    // ================================================================== views

    /// @notice Bound to this contract, this chain and the player, so a commitment can't be copied or replayed
    /// elsewhere. Use a fresh salt for every duel.
    function commitmentOf(address player, bytes calldata move, bytes32 salt) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(this), player, move, salt));
    }

    function noteOf(uint256 id, address player) external view returns (string memory text, uint64 at) {
        Note storage n = _notes[id][player];
        return (n.text, n.at);
    }

    function duelCount() external view returns (uint256) {
        return _duels.length;
    }

    function getDuel(uint256 id) external view returns (Duel memory) {
        return _duel(id);
    }

    function ctxOf(uint256 id) public view returns (Ctx memory) {
        Duel storage d = _duel(id);
        return Ctx({
            duel: id,
            a: d.a.player,
            b: d.b.player,
            takeBy: d.takeBy,
            revealBy: d.revealBy,
            settleBy: d.settleBy,
            now_: uint64(block.timestamp)
        });
    }

    /// @notice The Compact resource-lock id that holds stakes of `token` for crows duels.
    function lockId(address token) public view returns (uint256) {
        return (uint256(uint96(LOCK_TAG)) << 160) | uint256(uint160(token));
    }

    function witnessOf(uint256 id) public pure returns (bytes32) {
        return keccak256(abi.encode(MANDATE_TYPEHASH, id));
    }

    // ================================================================== allocator (called by The Compact)

    /// @dev Crows-locked stakes can't be transferred; they only move through crows' own claims.
    function attest(address, address, address, uint256, uint256) external pure returns (bytes4) {
        revert OnlyCompact();
    }

    function authorizeClaim(bytes32, address arbiter, address, uint256, uint256, uint256[2][] calldata, bytes calldata)
        external
        view
        returns (bytes4)
    {
        if (msg.sender != address(COMPACT) || arbiter != address(this)) revert OnlyCompact();
        return IAllocator.authorizeClaim.selector;
    }

    function isClaimAuthorized(bytes32, address arbiter, address, uint256, uint256, uint256[2][] calldata, bytes calldata)
        external
        view
        returns (bool)
    {
        return arbiter == address(this);
    }

    // ================================================================== internals

    function _duel(uint256 id) internal view returns (Duel storage) {
        if (id >= _duels.length) revert UnknownDuel();
        return _duels[id];
    }

    function _sideOf(Duel storage d, address player) internal view returns (Side storage) {
        if (player == d.a.player) return d.a;
        if (player != address(0) && player == d.b.player) return d.b;
        revert NotAPlayer();
    }

    /// @dev Pull `amount` from the player, deposit it into The Compact as the player's lock, and register a
    /// compact that only this contract can claim.
    function _lock(uint256 id, Side storage s, address token, uint256 amount) internal {
        address player = s.player;
        uint256 lid = lockId(token);
        (ForcedWithdrawalStatus status,) = COMPACT.getForcedWithdrawalStatus(player, lid);
        if (status != ForcedWithdrawalStatus.Disabled) revert ForcedWithdrawalActive();

        uint256 before = _balanceOf(token, address(this));
        _call(token, abi.encodeWithSelector(0x23b872dd, player, address(this), amount)); // transferFrom
        uint256 received = _balanceOf(token, address(this)) - before;
        if (received == 0) revert NothingDeposited();
        _approve(token, address(COMPACT), received);

        uint256 nonce = nextNonce++;
        uint256 expires = block.timestamp + CLAIM_WINDOW;
        (,, uint256 registered) = COMPACT.depositERC20AndRegisterFor(
            player, token, LOCK_TAG, received, address(this), nonce, expires, COMPACT_TYPEHASH, witnessOf(id)
        );
        if (registered == 0) revert NothingDeposited();
        s.stake = uint128(registered);
        s.nonce = nonce;
        s.expires = uint64(expires);
    }

    function _finish(uint256 id, Duel storage d, Outcome o) internal {
        d.state = State.Settled;
        d.outcome = o;
        address winner = o == Outcome.AWins ? d.a.player : o == Outcome.BWins ? d.b.player : address(0);
        uint256 pot = uint256(d.a.stake) + d.b.stake;
        emit Settled(id, o, winner, pot, msg.sender);
        _pay(id, d.token, d.a, winner == address(0) ? d.a.player : winner);
        _pay(id, d.token, d.b, winner == address(0) ? d.b.player : winner);
    }

    /// @dev Claim one side's compact and withdraw it as the underlying token to `to`. If that compact has already
    /// expired, skip it (the stake stays in the player's own lock) so the other side can still be paid.
    function _pay(uint256 id, address token, Side storage s, address to) internal {
        if (block.timestamp >= s.expires) {
            emit PayoutSkipped(id, s.player, s.stake);
            return;
        }
        Component[] memory claimants = new Component[](1);
        claimants[0] = Component({claimant: uint256(uint160(to)), amount: s.stake});
        COMPACT.claim(
            Claim({
                allocatorData: "",
                sponsorSignature: "",
                sponsor: s.player,
                nonce: s.nonce,
                expires: s.expires,
                witness: witnessOf(id),
                witnessTypestring: WITNESS_TYPESTRING,
                id: lockId(token),
                allocatedAmount: s.stake,
                claimants: claimants
            })
        );
    }

    function _balanceOf(address token, address who) internal view returns (uint256) {
        (bool ok, bytes memory ret) = token.staticcall(abi.encodeWithSelector(0x70a08231, who));
        if (!ok || ret.length < 32) revert TransferFailed();
        return abi.decode(ret, (uint256));
    }

    function _approve(address token, address spender, uint256 amount) internal {
        // approve(spender, 0) first for tokens that refuse to change a non-zero allowance.
        (bool ok, bytes memory ret) = token.call(abi.encodeWithSelector(0x095ea7b3, spender, amount));
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) {
            _call(token, abi.encodeWithSelector(0x095ea7b3, spender, 0));
            _call(token, abi.encodeWithSelector(0x095ea7b3, spender, amount));
        }
    }

    function _call(address token, bytes memory data) internal {
        if (token.code.length == 0) revert TransferFailed();
        (bool ok, bytes memory ret) = token.call(data);
        if (!ok || (ret.length != 0 && !abi.decode(ret, (bool)))) revert TransferFailed();
    }
}
