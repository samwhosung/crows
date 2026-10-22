// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";
import {Dice} from "crows/lib/Dice.sol";
import {PriceAt} from "crows/lib/PriceAt.sol";

/// @title High card
/// @notice Pure luck, dealt by the oracle: each side is dealt a card from the first round a feed posts at or after
/// `at`, and the higher card wins. Between equals it's a coin flip, which makes it a game about odds: offer 2
/// against 1 and see who bites.
contract HighCard is IDuelResolver {
    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "high-card",
            "(address feed,uint64 at)",
            "",
            "",
            "Each side is dealt a card from 1 to 13, hashed from the first round `feed` posts at or after `at` (so "
            "the deal is unknown to everyone until then). The higher card wins; the same card is a draw. Nothing to "
            "do after taking. If the feed posts no round within an hour of `at`, the duel expires as a draw."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 64) return (false, "params must be (address feed,uint64 at)");
        (address feed, uint64 at) = abi.decode(params, (address, uint64));
        if (!PriceAt.isFeed(feed)) return (false, "feed must be a working price feed");
        if (at <= takeBy) return (false, "at must be after takeBy, so nobody takes it knowing the deal");
        if (uint256(settleBy) < uint256(at) + 2 hours) return (false, "settleBy must be at least 2h after at");
        return (true, "");
    }

    function resolve(Ctx calldata, bytes calldata params, bytes calldata, bytes calldata, bytes calldata)
        external
        view
        returns (Outcome)
    {
        (address feed, uint64 at) = abi.decode(params, (address, uint64));
        (bool okA, uint256 a) = Dice.roll(feed, at, 0, 13);
        (bool okB, uint256 b) = Dice.roll(feed, at, 1, 13);
        if (!okA || !okB) return Outcome.Pending;
        return a > b ? Outcome.AWins : b > a ? Outcome.BWins : Outcome.Draw;
    }
}
