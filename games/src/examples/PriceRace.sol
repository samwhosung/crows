// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";
import {PriceAt} from "crows/lib/PriceAt.sol";

/// @title Price race
/// @notice Two assets race over a window: the challenger backs one, the taker the other. No evidence needed.
contract PriceRace is IDuelResolver {
    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "price-race",
            "(address feedA,address feedB,uint64 start,uint64 end)",
            "",
            "",
            "The challenger backs feedA, the taker feedB. Each asset's move is its price at `end` over its price at "
            "`start`, both being the first round each Chainlink feed posts at or after that time. The bigger "
            "percentage move wins; equal is a draw. If a price can't be found, the duel expires as a draw."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 128) return (false, "params must be (address feedA,address feedB,uint64 start,uint64 end)");
        (address fa, address fb, uint64 start, uint64 end) = abi.decode(params, (address, address, uint64, uint64));
        if (!PriceAt.isFeed(fa) || !PriceAt.isFeed(fb) || fa == fb) return (false, "need two different working feeds");
        if (start <= takeBy) return (false, "start must be after takeBy, so nobody takes it knowing the start prices");
        if (end <= start) return (false, "end must be after start");
        if (uint256(settleBy) < uint256(end) + 2 hours) return (false, "settleBy must be at least 2h after end");
        return (true, "");
    }

    function resolve(Ctx calldata, bytes calldata params, bytes calldata, bytes calldata, bytes calldata)
        external
        view
        returns (Outcome)
    {
        (address fa, address fb, uint64 start, uint64 end) = abi.decode(params, (address, address, uint64, uint64));
        (bool ok1, int256 a0) = PriceAt.find(fa, start);
        (bool ok2, int256 a1) = PriceAt.find(fa, end);
        (bool ok3, int256 b0) = PriceAt.find(fb, start);
        (bool ok4, int256 b1) = PriceAt.find(fb, end);
        if (!(ok1 && ok2 && ok3 && ok4)) return Outcome.Pending;
        // Compare a1/a0 with b1/b0 without division: a1 * b0 vs b1 * a0 (prices are positive).
        int256 l = a1 * b0;
        int256 r = b1 * a0;
        return l > r ? Outcome.AWins : l < r ? Outcome.BWins : Outcome.Draw;
    }
}
