// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "../interfaces/IDuelResolver.sol";
import {PriceAt} from "../lib/PriceAt.sol";

/// @title Up or down
/// @notice Does the price go up or down between `start` and `end`? The challenger picks a side; the taker gets
/// the other. The window starts no earlier than the take deadline, so taking late gives no information edge.
contract UpDown is IDuelResolver {
    uint64 public constant MIN_SETTLE_DELAY = 2 hours;

    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "up-down",
            "(address feed,uint64 start,uint64 end,bool challengerUp)",
            "",
            "(uint80 startRound,uint80 endRound)",
            "The challenger takes UP (challengerUp = true) or DOWN; the taker gets the other side. Compares the feed's "
            "answer in effect at `end` with the one in effect at `start` (each: the last round updated at or before that "
            "time; evidence is the two round ids). Higher wins UP, lower wins DOWN, unchanged is a draw. `start` is at or "
            "after takeBy, so nobody can take a side once the window has begun."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 128) return (false, "params must be (address feed,uint64 start,uint64 end,bool challengerUp)");
        (address feed, uint64 start, uint64 end,) = abi.decode(params, (address, uint64, uint64, bool));
        if (!PriceAt.isFeed(feed)) return (false, "feed is not a working price feed");
        if (start < takeBy) return (false, "start must be at or after takeBy");
        if (end <= start) return (false, "end must be after start");
        if (uint256(settleBy) < uint256(end) + MIN_SETTLE_DELAY) return (false, "settleBy must be >= end + 2h");
        return (true, "");
    }

    function resolve(Ctx calldata, bytes calldata params, bytes calldata, bytes calldata, bytes calldata evidence)
        external
        view
        returns (Outcome)
    {
        if (evidence.length != 64) return Outcome.Pending;
        (address feed, uint64 start, uint64 end, bool challengerUp) =
            abi.decode(params, (address, uint64, uint64, bool));
        (uint80 r0, uint80 r1) = abi.decode(evidence, (uint80, uint80));
        (bool ok0, int256 p0) = PriceAt.priceAt(feed, start, r0);
        if (!ok0) return Outcome.Pending;
        (bool ok1, int256 p1) = PriceAt.priceAt(feed, end, r1);
        if (!ok1) return Outcome.Pending;
        if (p1 == p0) return Outcome.Draw;
        return (p1 > p0) == challengerUp ? Outcome.AWins : Outcome.BWins;
    }
}
