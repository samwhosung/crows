// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";
import {MockFeed} from "crows-test/mocks/MockFeed.sol";
import {MockCrows} from "crows-test/mocks/MockCrows.sol";

/// @notice Helpers for testing a game on its own, without crows or a fork: hand-driven price feeds, a hand-driven
/// crows table, and a duel context. Tests here run offline and in a second.
abstract contract GameTest is Test {
    address constant A = address(0xA11CE);
    address constant B = address(0xB0B);
    /// @dev The crows contract on Base. `newTable()` puts a mock table at this address, so a game that hardcodes it
    /// (as games about other duels must: deploys take no arguments) can be tested offline.
    address constant CROWS = 0x0B478F46dfa5f6fB984eae4E530747fC664B1CB1;

    /// @dev A Chainlink-style feed with 8 decimals and a first price; push more prices with `feed.push(price)`.
    function newFeed(string memory name, int256 price) internal returns (MockFeed) {
        return new MockFeed(8, name, price);
    }

    /// @dev A crows table at the real crows address: `post`, `take`, `settle` and `cancel` duels with the times
    /// you choose. Ids start at 0, as on-chain, and keep counting up within one test (the table's storage stays).
    function newTable() internal returns (MockCrows) {
        vm.etch(CROWS, address(new MockCrows()).code);
        return MockCrows(CROWS);
    }

    function ctx(uint256 duel, uint64 takeBy, uint64 revealBy, uint64 settleBy, uint64 now_)
        internal
        pure
        returns (Ctx memory)
    {
        return Ctx({duel: duel, a: A, b: B, takeBy: takeBy, revealBy: revealBy, settleBy: settleBy, now_: now_});
    }

    /// @dev Post `price` as the feed's first round at or after `t` (warps the clock to t + 1).
    function postAt(MockFeed feed, uint64 t, int256 price) internal {
        vm.warp(t + 1);
        feed.push(price);
    }

    function ctx(uint64 takeBy, uint64 revealBy, uint64 settleBy, uint64 now_) internal pure returns (Ctx memory) {
        return Ctx({duel: 0, a: A, b: B, takeBy: takeBy, revealBy: revealBy, settleBy: settleBy, now_: now_});
    }
}
