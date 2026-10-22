// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "../interfaces/IDuelResolver.sol";
import {PriceAt} from "../lib/PriceAt.sol";

/// @title Closer call
/// @notice Both sides secretly call a feed's price at time `at`. The closer call wins the pot.
contract CloserCall is IDuelResolver {
    /// @notice Calls must be positive and below this bound (keeps distances exact).
    int256 public constant MAX_CALL = int256(1) << 127;
    /// @notice settleBy must be at least this long after `at`, so the feed has time to post the price.
    uint64 public constant MIN_SETTLE_DELAY = 2 hours;
    /// @notice A taker who accepts at takeBy still has this long to reveal.
    uint64 public constant MIN_REVEAL_WINDOW = 10 minutes;
    /// @notice Between the reveal deadline and the settle deadline, so a forfeit can always be collected.
    uint64 public constant MIN_FORFEIT_WINDOW = 1 hours;

    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "closer-call",
            "(address feed,uint64 at)",
            "(int256 call)",
            "(uint80 roundId)",
            "Each side commits a sealed call of the feed's price at time `at`, in the feed's own units "
            "(answer as returned by the feed, e.g. 8 decimals for USD feeds). The price is the first round the feed "
            "posts at or after `at` (within 1 hour, current feed phase only); evidence is that round's id. Closer call "
            "wins; equal distance is a draw. "
            "A call must be > 0 and < 2^127, or it counts as no call. A side with no valid call by revealBy loses; "
            "if neither has one, it is a draw."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64 revealBy, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 64) return (false, "params must be (address feed,uint64 at)");
        (address feed, uint64 at) = abi.decode(params, (address, uint64));
        if (!PriceAt.isFeed(feed)) return (false, "feed is not a working price feed");
        if (at <= takeBy) return (false, "at must be after takeBy");
        if (uint256(settleBy) < uint256(at) + MIN_SETTLE_DELAY) return (false, "settleBy must be >= at + 2h");
        if (uint256(revealBy) < uint256(takeBy) + MIN_REVEAL_WINDOW) return (false, "revealBy must be >= takeBy + 10m");
        if (uint256(settleBy) < uint256(revealBy) + MIN_FORFEIT_WINDOW) return (false, "settleBy must be >= revealBy + 1h");
        return (true, "");
    }

    function resolve(
        Ctx calldata ctx,
        bytes calldata params,
        bytes calldata moveA,
        bytes calldata moveB,
        bytes calldata evidence
    ) external view returns (Outcome) {
        (bool validA, int256 callA) = _call(moveA);
        (bool validB, int256 callB) = _call(moveB);

        if (!validA || !validB) {
            // A revealed move is final; an unrevealed one becomes final at revealBy.
            bool finalA = moveA.length != 0 || ctx.now_ > ctx.revealBy;
            bool finalB = moveB.length != 0 || ctx.now_ > ctx.revealBy;
            if (validA && finalB) return Outcome.AWins;
            if (validB && finalA) return Outcome.BWins;
            if (!validA && !validB && finalA && finalB) return Outcome.Draw;
            return Outcome.Pending;
        }

        if (evidence.length != 32) return Outcome.Pending;
        (address feed, uint64 at) = abi.decode(params, (address, uint64));
        uint80 roundId = abi.decode(evidence, (uint80));
        (bool ok, int256 price) = PriceAt.firstAtOrAfter(feed, at, roundId);
        if (!ok) return Outcome.Pending;

        uint256 dA = _dist(callA, price);
        uint256 dB = _dist(callB, price);
        if (dA < dB) return Outcome.AWins;
        if (dB < dA) return Outcome.BWins;
        return Outcome.Draw;
    }

    function _call(bytes calldata move) private pure returns (bool, int256) {
        if (move.length != 32) return (false, 0);
        int256 c = abi.decode(move, (int256));
        if (c <= 0 || c >= MAX_CALL) return (false, 0);
        return (true, c);
    }

    function _dist(int256 x, int256 y) private pure returns (uint256) {
        return x >= y ? uint256(x - y) : uint256(y - x);
    }
}
