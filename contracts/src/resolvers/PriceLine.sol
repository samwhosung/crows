// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "../interfaces/IDuelResolver.sol";
import {PriceAt} from "../lib/PriceAt.sol";

/// @title Price line
/// @notice Over/under: the challenger sets a line and picks a side; the taker gets the other side.
contract PriceLine is IDuelResolver {
    uint64 public constant MIN_SETTLE_DELAY = 2 hours;

    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "price-line",
            "(address feed,uint64 at,int256 line,bool challengerOver)",
            "",
            "(uint80 roundId)",
            "The challenger sets a line in the feed's units and takes OVER (challengerOver = true) or UNDER; the "
            "taker gets the other side. The price is the first round the feed posts at or after `at` (within 1 hour, "
            "current feed phase only); evidence is that round's id. Above the line, OVER wins; below, UNDER wins; "
            "exactly on the line is a draw."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 128) return (false, "params must be (address feed,uint64 at,int256 line,bool challengerOver)");
        (address feed, uint64 at, int256 line,) = abi.decode(params, (address, uint64, int256, bool));
        if (!PriceAt.isFeed(feed)) return (false, "feed is not a working price feed");
        if (line <= 0) return (false, "line must be positive");
        if (at <= takeBy) return (false, "at must be after takeBy");
        if (uint256(settleBy) < uint256(at) + MIN_SETTLE_DELAY) return (false, "settleBy must be >= at + 2h");
        return (true, "");
    }

    function resolve(Ctx calldata, bytes calldata params, bytes calldata, bytes calldata, bytes calldata evidence)
        external
        view
        returns (Outcome)
    {
        if (evidence.length != 32) return Outcome.Pending;
        (address feed, uint64 at, int256 line, bool challengerOver) =
            abi.decode(params, (address, uint64, int256, bool));
        (bool ok, int256 price) = PriceAt.firstAtOrAfter(feed, at, abi.decode(evidence, (uint80)));
        if (!ok) return Outcome.Pending;
        if (price == line) return Outcome.Draw;
        bool over = price > line;
        return over == challengerOver ? Outcome.AWins : Outcome.BWins;
    }
}
