// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {GameTest} from "../GameTest.sol";
import {Outcome} from "crows/interfaces/IDuelResolver.sol";
import {MockFeed} from "crows-test/mocks/MockFeed.sol";
import {RockPaperScissors} from "../../src/examples/RockPaperScissors.sol";
import {PriceRace} from "../../src/examples/PriceRace.sol";

contract ExamplesTest is GameTest {
    function test_rps() public {
        RockPaperScissors g = new RockPaperScissors();
        bytes memory p = abi.encode(uint8(3));
        uint8[] memory a = new uint8[](3);
        uint8[] memory b = new uint8[](3);
        (a[0], a[1], a[2]) = (0, 1, 2); // rock, paper, scissors
        (b[0], b[1], b[2]) = (2, 2, 2); // scissors x3: A wins round 1, loses round 2, draws round 3
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, abi.encode(a), abi.encode(b), "")), uint8(Outcome.Draw));
        b[2] = 1; // paper: A's scissors win round 3
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, abi.encode(a), abi.encode(b), "")), uint8(Outcome.AWins));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 150), p, abi.encode(a), "", "")), uint8(Outcome.Pending));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, abi.encode(a), "", "")), uint8(Outcome.AWins));
        (bool ok,) = g.validate(abi.encode(uint8(2)), 100, 1000, 2000);
        assertFalse(ok, "even rounds");
    }

    function test_priceRace() public {
        vm.warp(1000);
        MockFeed eth = newFeed("ETH / USD", 2000e8);
        MockFeed btc = newFeed("BTC / USD", 60000e8);
        PriceRace g = new PriceRace();
        uint64 start = 10_000;
        uint64 end = 20_000;
        bytes memory p = abi.encode(address(eth), address(btc), start, end);
        (bool ok,) = g.validate(p, 5000, 5000, end + 2 hours);
        assertTrue(ok);

        postAt(eth, start, 2000e8);
        postAt(btc, start, 60000e8);
        assertEq(uint8(g.resolve(ctx(5000, 5000, 30_000, start + 10), p, "", "", "")), uint8(Outcome.Pending));
        postAt(eth, end, 2100e8); // +5%
        postAt(btc, end, 61200e8); // +2%
        assertEq(uint8(g.resolve(ctx(5000, 5000, 30_000, end + 10), p, "", "", "")), uint8(Outcome.AWins));
    }
}
