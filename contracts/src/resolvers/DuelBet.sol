// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "../interfaces/IDuelResolver.sol";
import {Crows} from "../Crows.sol";

/// @title Duel bet
/// @notice A bet on another crows duel: the challenger backs one of its players, the taker backs the other.
/// Bets on bets work the same way, since a duel bet is itself a duel.
///
/// The bet only counts if it was taken before that duel was taken. Once a duel is live its moves can be revealed
/// and it can be settled at once, so a later taker could already know the result. Crows records when each stake
/// was locked (a side's compact expires exactly CLAIM_WINDOW after it), which gives both times without storage.
contract DuelBet is IDuelResolver {
    Crows public immutable CROWS;
    uint64 public constant SETTLE_MARGIN = 6 hours;

    constructor(Crows crows) {
        CROWS = crows;
    }

    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "duel-bet",
            "(uint256 duel,bool challengerBacksA)",
            "",
            "",
            "A bet on another crows duel. The challenger backs one of that duel's players (challengerBacksA = true "
            "backs its challenger, false its taker); the taker of this bet backs the other one. When that duel "
            "settles, whoever backed its winner wins. If it ends in a draw, expires or is cancelled, this bet is a "
            "draw. The bet only counts if it was taken before that duel was taken; if not, or if that duel is never "
            "taken, it is a draw. Either player of that duel may be betting too, and could lose it on purpose."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 64) return (false, "params must be (uint256 duel,bool challengerBacksA)");
        (uint256 duel, uint256 backsA) = abi.decode(params, (uint256, uint256));
        if (backsA > 1) return (false, "challengerBacksA must be a bool");
        if (duel >= CROWS.duelCount()) return (false, "no such duel");
        Crows.Duel memory d = CROWS.getDuel(duel);
        if (d.state != Crows.State.Open) return (false, "that duel must still be open (not yet taken)");
        if (takeBy > d.takeBy) return (false, "takeBy must not be later than that duel's takeBy");
        if (uint256(settleBy) < uint256(d.settleBy) + SETTLE_MARGIN) {
            return (false, "settleBy must be at least 6h after that duel's settleBy");
        }
        return (true, "");
    }

    function resolve(Ctx calldata ctx, bytes calldata params, bytes calldata, bytes calldata, bytes calldata)
        external
        view
        returns (Outcome)
    {
        (uint256 duel, bool backsA) = abi.decode(params, (uint256, bool));
        Crows.Duel memory u = CROWS.getDuel(duel);
        if (u.state == Crows.State.Cancelled) return Outcome.Draw;
        if (u.state == Crows.State.Open) return ctx.now_ > u.takeBy ? Outcome.Draw : Outcome.Pending; // never taken
        // That duel was taken. This bet must have been taken strictly earlier (the same second counts as later).
        uint256 window = CROWS.CLAIM_WINDOW();
        uint256 betTaken = uint256(CROWS.getDuel(ctx.duel).b.expires) - window;
        uint256 duelTaken = uint256(u.b.expires) - window;
        if (betTaken >= duelTaken) return Outcome.Draw;
        if (u.state != Crows.State.Settled) return Outcome.Pending;
        if (u.outcome == Outcome.AWins) return backsA ? Outcome.AWins : Outcome.BWins;
        if (u.outcome == Outcome.BWins) return backsA ? Outcome.BWins : Outcome.AWins;
        return Outcome.Draw;
    }
}
