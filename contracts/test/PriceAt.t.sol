// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {PriceAt, IAggregatorV3} from "../src/lib/PriceAt.sol";
import {CloserCall} from "../src/resolvers/CloserCall.sol";
import {Outcome, Ctx} from "../src/interfaces/IDuelResolver.sol";

contract PriceAtHarness {
    function priceAt(address feed, uint64 at, uint80 rid) external view returns (bool, int256) {
        return PriceAt.priceAt(feed, at, rid);
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

    function test_realFeed_onlyTheRightRoundProvesThePrice() public view {
        (uint80 latest,,,,) = IAggregatorV3(ETH_USD).latestRoundData();
        uint80 r = latest - 5;
        (, int256 answer,, uint256 t1,) = IAggregatorV3(ETH_USD).getRoundData(r);
        (,,, uint256 t2,) = IAggregatorV3(ETH_USD).getRoundData(r + 1);
        uint64 at = uint64((t1 + t2) / 2);

        (bool ok, int256 p) = h.priceAt(ETH_USD, at, r);
        assertTrue(ok);
        assertEq(p, answer);

        (ok,) = h.priceAt(ETH_USD, at, r - 1);
        assertFalse(ok, "older round is superseded before `at`");
        (ok,) = h.priceAt(ETH_USD, at, r + 1);
        assertFalse(ok, "newer round was posted after `at`");
        (ok,) = h.priceAt(ETH_USD, uint64(t1), r);
        assertTrue(ok, "a round counts from the second it was posted");
        (ok,) = h.priceAt(ETH_USD, uint64(t2), r);
        assertFalse(ok, "and stops counting when the next one is posted");
        (ok,) = h.priceAt(ETH_USD, at, latest);
        assertFalse(ok, "the latest round can't be proven final yet");
    }

    /// @dev The closer call always goes to the smaller distance, and the result is symmetric in the sides.
    function testFuzz_closerCall_symmetry(int128 a, int128 b, int128 price) public {
        vm.assume(a > 0 && b > 0 && price > 0);
        CloserCall c = new CloserCall();
        Ctx memory ctx = Ctx(0, address(1), address(2), 0, 0, 0, 1);
        // Use a no-price path: the resolver needs evidence, so test the comparison via a tiny feed instead.
        MiniFeed f = new MiniFeed(price);
        bytes memory params = abi.encode(address(f), uint64(100));
        Outcome o1 = c.resolve(ctx, params, abi.encode(int256(a)), abi.encode(int256(b)), abi.encode(uint80(1)));
        Outcome o2 = c.resolve(ctx, params, abi.encode(int256(b)), abi.encode(int256(a)), abi.encode(uint80(1)));
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

/// @dev Round 1 answers `price` at t=50; round 2 exists at t=200, so the price at t=100 is round 1.
contract MiniFeed {
    int256 immutable price;

    constructor(int256 p) {
        price = p;
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        return (2, price, 200, 200, 2);
    }

    function getRoundData(uint80 id) external view returns (uint80, int256, uint256, uint256, uint80) {
        if (id == 1) return (1, price, 50, 50, 1);
        if (id == 2) return (2, price, 200, 200, 2);
        revert("No data present.");
    }
}
