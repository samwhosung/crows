// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {PriceAt} from "./PriceAt.sol";

/// @notice Dice rolled by a price oracle. The die for a moment `t` is hashed from the first round a Chainlink feed
/// posts at or after `t`, so it is unknown to everyone until that round lands and the same forever after. Games of
/// luck should put `t` after `takeBy`, so nobody takes the duel knowing the roll. Pure chance between equals is a
/// coin flip; such games get interesting at odds (`--their-stake`).
library Dice {
    /// @notice A roll in [1, sides] for moment `t`, with a `salt` so one round can roll several dice (a side, a
    /// pace, a card index). ok is false until the feed's round for `t` is in (or if it came over an hour late).
    function roll(address feed, uint64 t, uint256 salt, uint256 sides) internal view returns (bool ok, uint256 value) {
        (bool found, int256 answer) = PriceAt.find(feed, t);
        if (!found || sides == 0) return (false, 0);
        return (true, uint256(keccak256(abi.encode(answer, t, salt))) % sides + 1);
    }

    /// @notice Several rolls from one moment: `count` dice of `sides` sides, salted by `salt` and the index.
    function rolls(address feed, uint64 t, uint256 salt, uint256 sides, uint256 count)
        internal
        view
        returns (bool ok, uint256[] memory values)
    {
        (bool found, int256 answer) = PriceAt.find(feed, t);
        if (!found || sides == 0) return (false, values);
        values = new uint256[](count);
        for (uint256 i; i < count; i++) {
            values[i] = uint256(keccak256(abi.encode(answer, t, salt, i))) % sides + 1;
        }
        return (true, values);
    }
}
