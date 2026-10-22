// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {PriceAt, IAggregatorV3} from "../src/lib/PriceAt.sol";
import {CloserCall} from "../src/resolvers/CloserCall.sol";
import {Outcome, Ctx} from "../src/interfaces/IDuelResolver.sol";

contract PriceAtHarness {
    function firstAtOrAfter(address feed, uint64 t, uint80 rid) external view returns (bool, int256) {
        return PriceAt.firstAtOrAfter(feed, t, rid);
    }

    function find(address feed, uint64 t) external view returns (bool, int256) {
        return PriceAt.find(feed, t);
    }
}

/// @notice Against the real Chainlink ETH/USD feed on Base, at a pinned block.
contract PriceAtTest is Test {
    address constant ETH_USD = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    PriceAtHarness h;

    function setUp() public {
        vm.createSelectFork(vm.envOr("BASE_RPC_URL", string("https://mainnet.base.org")), 52924775);
        h = new PriceAtHarness();
    }

    function _t(uint80 r) internal view returns (uint256 u) {
        (,,, u,) = IAggregatorV3(ETH_USD).getRoundData(r);
    }

    function test_find_agreesWithTheProvenRound_onTheRealFeed() public view {
        (uint80 latest,,,,) = IAggregatorV3(ETH_USD).latestRoundData();
        for (uint80 back = 1; back < 40; back += 7) {
            uint80 r = latest - back;
            (, int256 answer,,,) = IAggregatorV3(ETH_USD).getRoundData(r);
            uint64 t = uint64((_t(r - 1) + _t(r)) / 2);
            (bool ok, int256 p) = h.find(ETH_USD, t);
            assertTrue(ok);
            assertEq(p, answer);
            (ok, p) = h.find(ETH_USD, uint64(_t(r)));
            assertTrue(ok, "a round posted exactly at t counts");
            assertEq(p, answer);
        }
        (bool ok2,) = h.find(ETH_USD, uint64(_t(latest)) + 1);
        assertFalse(ok2, "not posted yet");
    }

    function test_realFeed_onlyTheFirstRoundAtOrAfterTCounts() public view {
        (uint80 latest,,,,) = IAggregatorV3(ETH_USD).latestRoundData();
        uint80 r = latest - 5;
        (, int256 answer,,,) = IAggregatorV3(ETH_USD).getRoundData(r);
        uint64 t = uint64((_t(r - 1) + _t(r)) / 2);

        (bool ok, int256 p) = h.firstAtOrAfter(ETH_USD, t, r);
        assertTrue(ok);
        assertEq(p, answer);
        (ok,) = h.firstAtOrAfter(ETH_USD, t, r - 1);
        assertFalse(ok, "a round before t is not the price");
        (ok,) = h.firstAtOrAfter(ETH_USD, t, r + 1);
        assertFalse(ok, "a later round is not the first after t");
        (ok,) = h.firstAtOrAfter(ETH_USD, uint64(_t(r)), r);
        assertTrue(ok, "a round posted exactly at t counts");
        (ok,) = h.firstAtOrAfter(ETH_USD, uint64(_t(r)) + 1, r + 1);
        assertTrue(ok, "one second later, the next round is the price");
        (ok,) = h.firstAtOrAfter(ETH_USD, uint64(_t(r) - 2 hours), r);
        assertFalse(ok, "more than an hour after t is too late to count");
    }

    /// @dev The review found Base's ETH/USD old aggregator kept posting after the phase switch, so an old-phase
    /// round could prove a different price for the same instant. Only the current phase may count.
    function test_realFeed_oldPhaseRoundsNeverCount() public view {
        (uint80 latest,,,,) = IAggregatorV3(ETH_USD).latestRoundData();
        uint256 phase = uint256(latest) >> 64;
        uint80 first = uint80((phase << 64) | 1);
        uint64 t = uint64(_t(first)) + 1; // just after the current phase began
        // Find the old phase's first round at or after t, if the old aggregator was still posting then.
        uint80 lo = uint80(((phase - 1) << 64) | 1);
        uint80 hi = lo;
        while (_tOrZero(hi + 1000) != 0) hi += 1000;
        while (_tOrZero(hi + 1) != 0) hi += 1;
        if (_t(hi) < t) return; // no overlap at this block: nothing to prove
        while (hi - lo > 1) {
            uint80 mid = lo + (hi - lo) / 2;
            if (_t(mid) >= t) hi = mid;
            else lo = mid;
        }
        (bool okOld,) = h.firstAtOrAfter(ETH_USD, t, hi);
        assertFalse(okOld, "old-phase round must be rejected");
    }

    function _tOrZero(uint80 r) internal view returns (uint256) {
        try IAggregatorV3(ETH_USD).getRoundData(r) returns (uint80, int256, uint256, uint256 u, uint80) {
            return u;
        } catch {
            return 0;
        }
    }

    /// @dev The closer call always goes to the smaller distance, and the result is symmetric in the sides.
    function testFuzz_closerCall_symmetry(int128 a, int128 b, int128 price) public {
        vm.assume(a > 0 && b > 0 && price > 0);
        CloserCall c = new CloserCall();
        Ctx memory ctx = Ctx(0, address(1), address(2), 0, 0, 0, 1);
        MiniFeed f = new MiniFeed(price);
        bytes memory params = abi.encode(address(f), uint64(100));
        Outcome o1 = c.resolve(ctx, params, abi.encode(int256(a)), abi.encode(int256(b)), abi.encode(uint80(2)));
        Outcome o2 = c.resolve(ctx, params, abi.encode(int256(b)), abi.encode(int256(a)), abi.encode(uint80(2)));
        uint256 da = a >= price ? uint256(int256(a) - price) : uint256(int256(price) - a);
        uint256 db = b >= price ? uint256(int256(b) - price) : uint256(int256(price) - b);
        if (da < db) {
            assertEq(uint8(o1), uint8(Outcome.AWins));
            assertEq(uint8(o2), uint8(Outcome.BWins));
        } else if (db < da) {
            assertEq(uint8(o1), uint8(Outcome.BWins));
            assertEq(uint8(o2), uint8(Outcome.AWins));
        } else {
            assertEq(uint8(o1), uint8(Outcome.Draw));
            assertEq(uint8(o2), uint8(Outcome.Draw));
        }
    }
}

/// @dev Round 1 at t=50, round 2 answers `price` at t=200: the first price at or after t=100 is round 2.
contract MiniFeed {
    int256 immutable price;

    constructor(int256 p) {
        price = p;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (2, price, 200, 200, 2);
    }

    function getRoundData(uint80 id) external view returns (uint80, int256, uint256, uint256, uint80) {
        if (id == 1) return (1, 1, 50, 50, 1);
        if (id == 2) return (2, price, 200, 200, 2);
        revert("No data present.");
    }
}
