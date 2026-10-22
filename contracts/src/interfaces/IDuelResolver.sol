// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @notice How a duel ended, as decided by its resolver.
/// Pending means "cannot decide yet"; settlement is then retried later or the duel expires as a Draw.
enum Outcome {
    Pending,
    AWins,
    BWins,
    Draw
}

/// @notice What the arena tells a resolver about the duel it is judging.
struct Ctx {
    uint256 duel;
    address a; // challenger
    address b; // taker
    uint64 takeBy; // last moment the duel could be accepted
    uint64 revealBy; // last moment a sealed move could be revealed
    uint64 settleBy; // after this the duel can only expire as a Draw
    uint64 now_; // block time of the settlement attempt
}

/// @notice A game. Anyone can write one; a duel names its resolver and pins the resolver's code hash.
/// A resolver must be a pure judge: same inputs, same answer. It reads time only from `ctx` and reads
/// outside data only through `evidence` that it checks itself (or from write-once sources such as past
/// price-feed rounds).
interface IDuelResolver {
    /// @notice Machine-readable description so agents can build params, moves and evidence without reading Solidity.
    /// @return name        short game name, e.g. "closer-call"
    /// @return paramsAbi   ABI tuple of the duel params, e.g. "(address feed,uint64 at)"
    /// @return moveAbi     ABI tuple of one side's move, or "" if the game has no moves
    /// @return evidenceAbi ABI tuple of settlement evidence, or "" if none is needed
    /// @return rules       plain-language rules (informative; the code is what counts)
    function describe()
        external
        view
        returns (
            string memory name,
            string memory paramsAbi,
            string memory moveAbi,
            string memory evidenceAbi,
            string memory rules
        );

    /// @notice Called when a duel is created. Reject params or timings the game cannot judge.
    function validate(bytes calldata params, uint64 takeBy, uint64 revealBy, uint64 settleBy)
        external
        view
        returns (bool ok, string memory reason);

    /// @notice Judge the duel. `moveA` / `moveB` are empty if that side has not revealed a move.
    function resolve(
        Ctx calldata ctx,
        bytes calldata params,
        bytes calldata moveA,
        bytes calldata moveB,
        bytes calldata evidence
    ) external view returns (Outcome);
}
