// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {GameTest} from "../GameTest.sol";
import {Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";
import {MockFeed} from "crows-test/mocks/MockFeed.sol";
import {MockCrows} from "crows-test/mocks/MockCrows.sol";
import {Dice} from "crows/lib/Dice.sol";
import {RockPaperScissors} from "../../src/examples/RockPaperScissors.sol";
import {PriceRace} from "../../src/examples/PriceRace.sol";
import {HighCard} from "../../src/examples/HighCard.sol";
import {GuessMyNumber} from "../../src/examples/GuessMyNumber.sol";
import {NextDare} from "../../src/examples/NextDare.sol";

contract ExamplesTest is GameTest {
    function test_highCard() public {
        vm.warp(1000);
        MockFeed eth = newFeed("ETH / USD", 2000e8);
        HighCard g = new HighCard();
        uint64 at = 10_000;
        bytes memory p = abi.encode(address(eth), at);
        (bool ok,) = g.validate(p, 5000, 5000, at + 2 hours);
        assertTrue(ok);
        (ok,) = g.validate(p, at, at, at + 2 hours);
        assertFalse(ok, "deal must come after taking closes");

        assertEq(uint8(g.resolve(ctx(5000, 5000, 30_000, at + 10), p, "", "", "")), uint8(Outcome.Pending));
        postAt(eth, at, 2010e8);
        (, uint256 a) = Dice.roll(address(eth), at, 0, 13);
        (, uint256 b) = Dice.roll(address(eth), at, 1, 13);
        assertTrue(a >= 1 && a <= 13 && b >= 1 && b <= 13);
        Outcome want = a > b ? Outcome.AWins : b > a ? Outcome.BWins : Outcome.Draw;
        assertEq(uint8(g.resolve(ctx(5000, 5000, 30_000, at + 10), p, "", "", "")), uint8(want));
        eth.push(2500e8); // later rounds change nothing
        assertEq(uint8(g.resolve(ctx(5000, 5000, 30_000, at + 3600), p, "", "", "")), uint8(want));
    }

    function test_guessMyNumber() public {
        GuessMyNumber g = new GuessMyNumber();
        bytes memory p = abi.encode(uint8(10));
        bytes memory number = abi.encode(uint8(42));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, number, abi.encode(uint8(50)), "")), uint8(Outcome.BWins));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, number, abi.encode(uint8(53)), "")), uint8(Outcome.AWins));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 150), p, number, "", "")), uint8(Outcome.Pending));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, number, "", "")), uint8(Outcome.AWins));
        assertEq(uint8(g.resolve(ctx(100, 200, 300, 250), p, abi.encode(uint8(0)), abi.encode(uint8(50)), "")), uint8(Outcome.BWins));
        (bool ok,) = g.validate(abi.encode(uint8(50)), 100, 1000, 2000);
        assertFalse(ok, "tolerance too wide");
    }

    function test_nextDare() public {
        MockCrows table = newTable();
        address x = makeAddr("x");
        NextDare g = new NextDare();
        table.post(x, 1000, 2000, 9000); // #0: an earlier dare of x's
        bytes memory p = abi.encode(x, uint256(0));
        (bool ok,) = g.validate(p, 2500, 2500, 2500 + 6 hours);
        assertTrue(ok);

        uint256 bet = table.post(A, 1500, 2500, 50_000); // #1: this bet
        table.take(bet, B, 1600);
        Ctx memory c = ctx(bet, 2500, 2500, 50_000, 1700);
        assertEq(uint8(g.resolve(c, p, "", "", "")), uint8(Outcome.Pending), "x hasn't posted yet");

        uint256 dare = table.post(x, 2000, 3000, 9000); // #2: x's next dare
        c.now_ = 2100;
        assertEq(uint8(g.resolve(c, p, "", "", "")), uint8(Outcome.Pending), "still open");
        table.take(dare, makeAddr("y"), 2200);
        c.now_ = 2300;
        assertEq(uint8(g.resolve(c, p, "", "", "")), uint8(Outcome.AWins), "taken: the challenger said yes");

        // Had the bet been taken after the dare was, it would be void.
        table.take(bet, B, 2250);
        assertEq(uint8(g.resolve(c, p, "", "", "")), uint8(Outcome.Draw), "taken knowing the answer");

        // A dare nobody takes: the taker of the bet wins once it's past its takeBy. (Ids keep counting up on the
        // same table, so this bet looks for x's first dare after #3.)
        uint256 bet2 = table.post(A, 4000, 5000, 50_000); // #3
        table.take(bet2, B, 4100);
        table.post(x, 4500, 6000, 9000); // #4: x's next dare
        bytes memory p2 = abi.encode(x, uint256(3));
        Ctx memory c2 = ctx(bet2, 5000, 5000, 50_000, 5900);
        assertEq(uint8(g.resolve(c2, p2, "", "", "")), uint8(Outcome.Pending), "nobody has taken it, but they still can");
        c2.now_ = 6001;
        assertEq(uint8(g.resolve(c2, p2, "", "", "")), uint8(Outcome.BWins), "expired untaken");

        // Nothing posted within the scan window: void.
        bytes memory p3 = abi.encode(makeAddr("nobody"), uint256(0));
        assertEq(uint8(g.resolve(c2, p3, "", "", "")), uint8(Outcome.Pending), "the next 100 duels don't exist yet");
    }

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
