// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {BaseTest} from "./Base.t.sol";
import {Crows} from "../src/Crows.sol";
import {DuelBet} from "../src/resolvers/DuelBet.sol";

contract DuelBetTest is BaseTest {
    DuelBet bet;
    address dave = makeAddr("dave");

    function setUp() public override {
        super.setUp();
        bet = new DuelBet(crows);
        deal(address(USDC), dave, 1000e6);
        vm.prank(dave);
        USDC.approve(address(crows), type(uint256).max);
    }

    function betTerms(uint256 duel, bool backsA, uint64 takeBy, uint64 settleBy) internal view returns (Crows.Terms memory) {
        return Crows.Terms({
            resolver: address(bet),
            params: abi.encode(duel, backsA),
            token: address(USDC),
            stakeA: STAKE,
            stakeB: STAKE,
            opponent: address(0),
            takeBy: takeBy,
            revealBy: takeBy,
            settleBy: settleBy
        });
    }

    /// alice challenges a closer-call (open); carol backs alice on it, dave takes the other side. bob takes the
    /// closer-call. alice wins it, so carol wins the bet.
    function test_backerOfTheWinnerWins() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));

        vm.prank(carol);
        uint256 b = crows.challenge(betTerms(id, true, t.takeBy, t.settleBy + 6 hours), bytes32(0));
        vm.prank(dave);
        crows.accept(b, bytes32(0));

        vm.warp(block.timestamp + 1); // the bet must be taken before the duel is
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));
        vm.expectRevert(abi.encodeWithSelector(Crows.NotYet.selector));
        crows.settle(b, "");

        uint64 at = atOf(t);
        uint80 rid = postPriceAt(at, 2401e8);
        revealBoth(id, 2400e8, 2500e8);
        crows.settle(id, abi.encode(rid));

        uint256 carolBefore = USDC.balanceOf(carol);
        crows.settle(b, "");
        assertEq(USDC.balanceOf(carol) - carolBefore, 2 * STAKE);
    }

    function test_cancelledDuelIsADraw() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));
        vm.prank(carol);
        uint256 b = crows.challenge(betTerms(id, false, t.takeBy, t.settleBy + 6 hours), bytes32(0));
        vm.prank(dave);
        crows.accept(b, bytes32(0));
        vm.prank(alice);
        crows.cancel(id);
        uint256 carolBefore = USDC.balanceOf(carol);
        uint256 daveBefore = USDC.balanceOf(dave);
        crows.settle(b, "");
        assertEq(USDC.balanceOf(carol) - carolBefore, STAKE);
        assertEq(USDC.balanceOf(dave) - daveBefore, STAKE);
    }

    function test_validate() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));

        (bool ok, string memory why) = bet.validate(abi.encode(id, true), t.takeBy + 1, t.takeBy + 1, t.settleBy + 6 hours);
        assertFalse(ok, why);
        (ok, why) = bet.validate(abi.encode(id, true), t.takeBy, t.takeBy, t.settleBy);
        assertFalse(ok, "settleBy needs a margin after that duel's");
        (ok,) = bet.validate(abi.encode(id + 1, true), t.takeBy, t.takeBy, t.settleBy + 6 hours);
        assertFalse(ok, "no such duel");
        (ok,) = bet.validate(abi.encode(id, uint256(2)), t.takeBy, t.takeBy, t.settleBy + 6 hours);
        assertFalse(ok, "not a bool");
        (ok,) = bet.validate(abi.encode(id, true), t.takeBy, t.takeBy, t.settleBy + 6 hours);
        assertTrue(ok);

        vm.prank(alice);
        crows.cancel(id);
        (ok,) = bet.validate(abi.encode(id, true), t.takeBy, t.takeBy, t.settleBy + 6 hours);
        assertFalse(ok, "that duel is over");
    }

    /// A bet on a bet.
    function test_betOnABet() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));
        vm.prank(carol);
        uint256 b1 = crows.challenge(betTerms(id, true, t.takeBy, t.settleBy + 6 hours), bytes32(0));
        vm.prank(dave);
        uint256 b2 = crows.challenge(betTerms(b1, false, t.takeBy, t.settleBy + 12 hours), bytes32(0));
        vm.prank(bob);
        crows.accept(b2, bytes32(0)); // bob backs carol's side of the first bet
        uint256 ts = block.timestamp; // explicit clock: via-IR may reuse one block.timestamp read across warps
        vm.warp(ts + 1);
        vm.prank(dave);
        crows.accept(b1, bytes32(0));
        vm.warp(ts + 2);
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));

        uint80 rid = postPriceAt(atOf(t), 2401e8);
        revealBoth(id, 2400e8, 2500e8);
        crows.settle(id, abi.encode(rid)); // alice wins
        crows.settle(b1, ""); // carol (backed alice) wins
        uint256 bobBefore = USDC.balanceOf(bob);
        crows.settle(b2, ""); // bob backed carol: wins
        assertEq(USDC.balanceOf(bob) - bobBefore, 2 * STAKE);
    }

    /// The review's case: the duel is taken, decided by an invalid reveal and settled, all before the bet's takeBy.
    /// Taking the bet after that must not pay.
    function test_betTakenAfterTheDuelWentLiveIsADraw() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 0, "sa")); // a call of 0 is invalid: alice loses on reveal
        vm.prank(carol);
        uint256 b = crows.challenge(betTerms(id, true, t.takeBy, t.settleBy + 6 hours), bytes32(0));
        uint256 ts = block.timestamp;
        vm.warp(ts + 1 minutes);
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));
        vm.warp(ts + 2 minutes);
        crows.reveal(id, alice, abi.encode(int256(0)), "sa");
        crows.reveal(id, bob, abi.encode(int256(2500e8)), "sb");
        crows.settle(id, "");
        assertEq(uint8(crows.getDuel(id).outcome), 2, "bob won the duel early");
        vm.warp(ts + 3 minutes);
        vm.prank(dave);
        crows.accept(b, bytes32(0)); // dave backs bob, knowing the result
        uint256 daveBefore = USDC.balanceOf(dave);
        uint256 carolBefore = USDC.balanceOf(carol);
        crows.settle(b, "");
        assertEq(USDC.balanceOf(dave) - daveBefore, STAKE, "dave only gets his stake back");
        assertEq(USDC.balanceOf(carol) - carolBefore, STAKE);
    }

    function test_untakenDuelIsADrawAfterItsTakeBy() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));
        vm.prank(carol);
        uint256 b = crows.challenge(betTerms(id, true, t.takeBy, t.settleBy + 6 hours), bytes32(0));
        vm.prank(dave);
        crows.accept(b, bytes32(0));
        vm.expectRevert(abi.encodeWithSelector(Crows.NotYet.selector));
        crows.settle(b, "");
        vm.warp(t.takeBy + 1);
        uint256 daveBefore = USDC.balanceOf(dave);
        crows.settle(b, ""); // nobody cancelled the duel, but it can no longer be taken
        assertEq(USDC.balanceOf(dave) - daveBefore, STAKE);
    }

    function test_expiredDuelIsADraw() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));
        vm.prank(carol);
        uint256 b = crows.challenge(betTerms(id, true, t.takeBy, t.settleBy + 6 hours), bytes32(0));
        vm.prank(dave);
        crows.accept(b, bytes32(0));
        vm.warp(block.timestamp + 1);
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));
        vm.warp(t.settleBy + 1);
        crows.expire(id);
        uint256 carolBefore = USDC.balanceOf(carol);
        crows.settle(b, "");
        assertEq(USDC.balanceOf(carol) - carolBefore, STAKE);
    }

    function test_cantBetOnALiveDuel() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2400e8, 2500e8);
        (bool ok, string memory why) = bet.validate(abi.encode(id, true), t.takeBy, t.takeBy, t.settleBy + 6 hours);
        assertFalse(ok);
        assertEq(why, "that duel must still be open (not yet taken)");
    }
}
