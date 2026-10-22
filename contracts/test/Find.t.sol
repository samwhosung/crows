// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {PriceAt} from "../src/lib/PriceAt.sol";
import {MockFeed} from "./mocks/MockFeed.sol";

contract FindHarness {
    function find(address feed, uint64 t) external view returns (bool, int256) {
        return PriceAt.find(feed, t);
    }

    function findWithin(address feed, uint64 t, uint256 d) external view returns (bool, int256) {
        return PriceAt.findWithin(feed, t, d);
    }
}

/// @notice PriceAt.find against a hand-driven feed: edges of the walk.
contract FindTest is Test {
    FindHarness h;
    MockFeed feed;

    function setUp() public {
        vm.warp(1_000_000);
        h = new FindHarness();
        feed = new MockFeed(8, "X / USD", 100e8); // round 1 at 1_000_000
    }

    function test_find_firstRoundAfterT() public {
        vm.warp(1_000_600);
        feed.push(101e8); // round 2
        vm.warp(1_001_200);
        feed.push(102e8); // round 3
        (bool ok, int256 p) = h.find(address(feed), 1_000_300);
        assertTrue(ok);
        assertEq(p, 101e8);
        (ok, p) = h.find(address(feed), 1_000_600);
        assertTrue(ok);
        assertEq(p, 101e8, "posted exactly at t");
        (ok, p) = h.find(address(feed), 1_000_601);
        assertEq(p, 102e8);
        (ok,) = h.find(address(feed), 1_001_201);
        assertFalse(ok, "not posted yet");
    }

    function test_find_phaseFirstRound() public view {
        (bool ok, int256 p) = h.find(address(feed), 999_999);
        assertTrue(ok, "the phase's first round has no predecessor to check");
        assertEq(p, 100e8);
    }

    function test_find_tooLateAfterT() public {
        vm.warp(1_000_000 + 2 hours);
        feed.push(101e8);
        (bool ok,) = h.find(address(feed), 1_000_001);
        assertFalse(ok, "the first round after t came more than an hour late");
    }

    /// Binary search: no limit on how far back t is, and few reads.
    function test_find_farBack() public {
        uint256 ts = 1_000_000; // a local clock: via-IR can fold repeated block.timestamp reads across vm.warp
        for (uint256 i; i < 2000; i++) {
            ts += 60;
            vm.warp(ts);
            feed.push(int256(100e8 + i));
        }
        (bool ok, int256 p) = h.find(address(feed), 1_000_030); // round 2, 2000 rounds back
        assertTrue(ok);
        assertEq(p, 100e8);
        uint256 g = gasleft();
        (ok, p) = h.find(address(feed), uint64(1_000_000 + 60 * 1234 - 1));
        assertLt(g - gasleft(), 200_000, "a handful of reads");
        assertEq(p, int256(100e8 + 1233));
    }

    function test_findWithin_slowFeed() public {
        vm.warp(1_000_000 + 20 hours);
        feed.push(101e8);
        (bool ok,) = h.find(address(feed), 1_000_100);
        assertFalse(ok, "20h after t is too late within an hour");
        int256 p;
        (ok, p) = h.findWithin(address(feed), 1_000_100, 25 hours);
        assertTrue(ok);
        assertEq(p, 101e8);
    }

    function test_find_notAFeed() public view {
        (bool ok,) = h.find(address(0xdead), 1);
        assertFalse(ok);
    }
}
