// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {BaseTest} from "./Base.t.sol";
import {Crows} from "../src/Crows.sol";
import {Outcome} from "../src/interfaces/IDuelResolver.sol";

contract CrowsTest is BaseTest {
    // ================================================================ happy path

    function test_closerCall_closerCallWins() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        assertEq(USDC.balanceOf(alice), 990e6);
        assertEq(USDC.balanceOf(bob), 990e6);
        assertEq(lockBalance(alice), STAKE, "alice stake sits in her Compact lock");
        assertEq(lockBalance(bob), STAKE);
        assertEq(USDC.balanceOf(address(crows)), 0, "crows never holds money");

        revealBoth(id, 2450e8, 2380e8);
        uint80 rid = postPriceAt(atOf(t), 2441e8);

        vm.prank(carol); // anyone can settle
        crows.settle(id, abi.encode(rid));

        assertEq(USDC.balanceOf(alice), 1010e6, "alice was closer and takes the pot");
        assertEq(USDC.balanceOf(bob), 990e6);
        assertEq(lockBalance(alice), 0);
        assertEq(lockBalance(bob), 0);
        Crows.Duel memory d = crows.getDuel(id);
        assertEq(uint8(d.state), uint8(Crows.State.Settled));
        assertEq(uint8(d.outcome), uint8(Outcome.AWins));
    }

    function test_closerCall_bWins() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        revealBoth(id, 2450e8, 2380e8);
        uint80 rid = postPriceAt(atOf(t), 2390e8);
        crows.settle(id, abi.encode(rid));
        assertEq(USDC.balanceOf(bob), 1010e6);
        assertEq(USDC.balanceOf(alice), 990e6);
    }

    function test_closerCall_equalDistanceIsDraw() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2350e8);
        revealBoth(id, 2450e8, 2350e8);
        uint80 rid = postPriceAt(atOf(t), 2400e8);
        crows.settle(id, abi.encode(rid));
        assertEq(USDC.balanceOf(alice), 1000e6);
        assertEq(USDC.balanceOf(bob), 1000e6);
        assertEq(uint8(crows.getDuel(id).outcome), uint8(Outcome.Draw));
    }

    function test_asymmetricStakes() public {
        Crows.Terms memory t = closerTerms(address(0));
        t.stakeA = 5e6;
        t.stakeB = 20e6;
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));
        revealBoth(id, 2400e8, 2500e8);
        uint80 rid = postPriceAt(atOf(t), 2401e8);
        crows.settle(id, abi.encode(rid));
        assertEq(USDC.balanceOf(alice), 1020e6);
        assertEq(USDC.balanceOf(bob), 980e6);
    }

    // ================================================================ evidence

    function test_settle_wrongRoundIsNotYet() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        revealBoth(id, 2450e8, 2380e8);
        uint80 rid = postPriceAt(atOf(t), 2441e8);
        vm.expectRevert(Crows.NotYet.selector);
        crows.settle(id, abi.encode(rid + 1)); // updated after `at`
        vm.expectRevert(Crows.NotYet.selector);
        crows.settle(id, abi.encode(rid - 1)); // superseded before `at`
        vm.expectRevert(Crows.NotYet.selector);
        crows.settle(id, abi.encode(uint80(999))); // does not exist
        vm.expectRevert(Crows.NotYet.selector);
        crows.settle(id, "");
        crows.settle(id, abi.encode(rid));
    }

    function test_settle_beforeNextRoundIsNotYet() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        revealBoth(id, 2450e8, 2380e8);
        vm.warp(atOf(t) - 30);
        uint80 rid = feed.push(2441e8);
        vm.warp(atOf(t) + 10 minutes);
        vm.expectRevert(Crows.NotYet.selector); // no round after `at` yet, so it can't be proven
        crows.settle(id, abi.encode(rid));
    }

    // ================================================================ sealed moves

    function test_noReveal_forfeitsAfterRevealBy() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "sa");
        vm.warp(t.revealBy); // still inside the reveal window
        vm.expectRevert(Crows.NotYet.selector);
        crows.settle(id, "");
        vm.warp(t.revealBy + 1);
        crows.settle(id, "");
        assertEq(USDC.balanceOf(alice), 1010e6);
    }

    function test_neitherReveals_isDraw() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        vm.warp(t.revealBy + 1);
        crows.settle(id, "");
        assertEq(USDC.balanceOf(alice), 1000e6);
        assertEq(USDC.balanceOf(bob), 1000e6);
    }

    function test_invalidMove_forfeitsImmediately() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2450e8, "sa"));
        bytes memory garbage = abi.encode(int256(-5));
        vm.prank(bob);
        crows.accept(id, commitRaw(bob, garbage, "sb"));
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "sa");
        crows.reveal(id, bob, garbage, "sb");
        crows.settle(id, ""); // bob's revealed move is final and invalid: alice wins, no price needed
        assertEq(USDC.balanceOf(alice), 1010e6);
    }

    function test_reveal_rules() public {
        (uint256 id,) = openCloser(2450e8, 2380e8);
        vm.expectRevert(Crows.BadReveal.selector);
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "wrong salt");
        vm.expectRevert(Crows.BadReveal.selector);
        crows.reveal(id, bob, abi.encode(int256(2450e8)), "sa"); // alice's move under bob's name
        vm.expectRevert(Crows.NotAPlayer.selector);
        crows.reveal(id, carol, abi.encode(int256(2450e8)), "sa");
        vm.expectRevert(Crows.BadReveal.selector);
        crows.reveal(id, alice, "", "sa");
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "sa");
        vm.expectRevert(Crows.AlreadyRevealed.selector);
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "sa");
    }

    function test_reveal_afterRevealByFails() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        vm.warp(t.revealBy + 1);
        vm.expectRevert(Crows.TooLate.selector);
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "sa");
    }

    function test_copiedCommitmentCannotBeRevealed() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        bytes32 c = commit(alice, 2450e8, "sa");
        uint256 id = crows.challenge(t, c);
        vm.prank(bob);
        crows.accept(id, c); // bob copies alice's sealed move
        crows.reveal(id, alice, abi.encode(int256(2450e8)), "sa");
        vm.expectRevert(Crows.BadReveal.selector);
        crows.reveal(id, bob, abi.encode(int256(2450e8)), "sa"); // bound to alice's address
    }

    // ================================================================ matching

    function test_aimedChallenge_onlyOpponentCanAccept() public {
        Crows.Terms memory t = closerTerms(bob);
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 1, "sa"));
        vm.prank(carol);
        vm.expectRevert(Crows.NotOpponent.selector);
        crows.accept(id, bytes32(0));
        vm.prank(bob);
        crows.accept(id, bytes32(0));
    }

    function test_cannotAcceptOwnChallengeOrTwice() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, bytes32(0));
        vm.prank(alice);
        vm.expectRevert(Crows.SelfDuel.selector);
        crows.accept(id, bytes32(0));
        vm.prank(bob);
        crows.accept(id, bytes32(0));
        vm.prank(carol);
        vm.expectRevert(abi.encodeWithSelector(Crows.WrongState.selector, Crows.State.Live));
        crows.accept(id, bytes32(0));
    }

    function test_acceptAfterTakeByFails() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, bytes32(0));
        vm.warp(t.takeBy + 1);
        vm.prank(bob);
        vm.expectRevert(Crows.TooLate.selector);
        crows.accept(id, bytes32(0));
    }

    function test_cancel() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, bytes32(0));
        vm.prank(carol);
        vm.expectRevert(Crows.TooEarly.selector);
        crows.cancel(id);
        vm.prank(alice);
        crows.cancel(id);
        assertEq(USDC.balanceOf(alice), 1000e6);
        assertEq(lockBalance(alice), 0);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(Crows.WrongState.selector, Crows.State.Cancelled));
        crows.accept(id, bytes32(0));
    }

    function test_anyoneCancelsStaleChallenge() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, bytes32(0));
        vm.warp(t.takeBy + 1);
        vm.prank(carol);
        crows.cancel(id);
        assertEq(USDC.balanceOf(alice), 1000e6);
    }

    // ================================================================ expiry and escape hatch

    function test_expire_refundsBoth() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        revealBoth(id, 2450e8, 2380e8);
        vm.warp(t.settleBy);
        vm.expectRevert(Crows.TooEarly.selector);
        crows.expire(id);
        vm.warp(t.settleBy + 1);
        vm.expectRevert(Crows.TooLate.selector);
        crows.settle(id, "");
        crows.expire(id);
        assertEq(USDC.balanceOf(alice), 1000e6);
        assertEq(USDC.balanceOf(bob), 1000e6);
        assertEq(uint8(crows.getDuel(id).outcome), uint8(Outcome.Draw));
    }

    function test_expire_worksUntilLateInTheClaimWindow() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        Crows.Duel memory d = crows.getDuel(id);
        vm.warp(d.a.expires - 1); // nobody touched it for almost 30 days
        assertGt(block.timestamp, t.settleBy);
        crows.expire(id);
        assertEq(USDC.balanceOf(alice), 1000e6);
        assertEq(USDC.balanceOf(bob), 1000e6);
    }

    function test_lockedStakeCannotBeMovedOutsideCrows() public {
        openCloser(2450e8, 2380e8);
        uint256 lid = crows.lockId(address(USDC));
        vm.prank(alice);
        (bool ok,) = address(COMPACT).call(abi.encodeWithSignature("transfer(address,uint256,uint256)", carol, lid, 1));
        assertFalse(ok, "ERC6909 transfer of a crows lock must fail");
    }

    function test_forcedWithdrawal_isTheEscapeHatch() public {
        // If crows never pays, the owner still gets the stake back from The Compact after the reset period.
        openCloser(2450e8, 2380e8);
        uint256 lid = crows.lockId(address(USDC));
        vm.prank(alice);
        uint256 at = COMPACT.enableForcedWithdrawal(lid);
        assertEq(at, block.timestamp + crows.RESET_PERIOD());
        vm.warp(at);
        vm.prank(alice);
        COMPACT.forcedWithdrawal(lid, alice, STAKE);
        assertEq(USDC.balanceOf(alice), 1000e6);
    }

    function test_forcedWithdrawalPending_blocksNewStakes() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        crows.challenge(t, bytes32(0));
        uint256 lid = crows.lockId(address(USDC));
        vm.prank(alice);
        COMPACT.enableForcedWithdrawal(lid);
        t = closerTerms(address(0));
        vm.prank(alice);
        vm.expectRevert(Crows.ForcedWithdrawalActive.selector);
        crows.challenge(t, bytes32(0));
    }

    // ================================================================ terms

    function test_terms_validation() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.startPrank(alice);

        t.takeBy = uint64(block.timestamp);
        vm.expectRevert(Crows.BadTimes.selector);
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.revealBy = t.takeBy - 1;
        vm.expectRevert(Crows.BadTimes.selector);
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.settleBy = uint64(block.timestamp + 29 days);
        vm.expectRevert(Crows.TooLong.selector);
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.stakeB = 0;
        vm.expectRevert(Crows.ZeroStake.selector);
        crows.challenge(t, bytes32(0));

        t = closerTerms(alice);
        vm.expectRevert(Crows.SelfDuel.selector);
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.resolver = carol;
        vm.expectRevert(Crows.NoResolver.selector);
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.params = abi.encode(address(USDC), uint64(block.timestamp + 1 hours));
        vm.expectRevert(abi.encodeWithSelector(Crows.InvalidTerms.selector, "feed is not a working price feed"));
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.params = abi.encode(address(feed), t.takeBy);
        vm.expectRevert(abi.encodeWithSelector(Crows.InvalidTerms.selector, "at must be after takeBy"));
        crows.challenge(t, bytes32(0));

        t = closerTerms(address(0));
        t.settleBy = atOf(t) + 1 hours;
        t.revealBy = t.settleBy;
        vm.expectRevert(abi.encodeWithSelector(Crows.InvalidTerms.selector, "settleBy must be >= at + 2h"));
        crows.challenge(t, bytes32(0));

        // the longest allowed duel
        t = closerTerms(address(0));
        t.settleBy = uint64(block.timestamp + crows.CLAIM_WINDOW() - crows.EXPIRY_MARGIN());
        crows.challenge(t, bytes32(0));
        vm.stopPrank();
    }

    function test_resolverCodeChange_blocksSettlement() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        revealBoth(id, 2450e8, 2380e8);
        uint80 rid = postPriceAt(atOf(t), 2441e8);
        vm.etch(address(closer), address(line).code); // the game's code is swapped under the duel
        vm.expectRevert(Crows.ResolverChanged.selector);
        crows.settle(id, abi.encode(rid));
        vm.warp(t.settleBy + 1);
        crows.expire(id); // falls back to refunds
        assertEq(USDC.balanceOf(alice), 1000e6);
    }

    function test_duelsAreIndependent() public {
        (uint256 id1, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        (uint256 id2,) = openCloser(2380e8, 2450e8);
        assertEq(lockBalance(alice), 2 * STAKE);
        revealBoth(id1, 2450e8, 2380e8);
        revealBoth(id2, 2380e8, 2450e8);
        uint80 rid = postPriceAt(atOf(t), 2441e8);
        crows.settle(id1, abi.encode(rid)); // alice wins the first
        crows.settle(id2, abi.encode(rid)); // bob wins the second
        assertEq(USDC.balanceOf(alice), 1000e6);
        assertEq(USDC.balanceOf(bob), 1000e6);
        assertEq(lockBalance(alice), 0);
        assertEq(lockBalance(bob), 0);
    }

    function test_settledDuelCannotBeSettledAgain() public {
        (uint256 id, Crows.Terms memory t) = openCloser(2450e8, 2380e8);
        revealBoth(id, 2450e8, 2380e8);
        uint80 rid = postPriceAt(atOf(t), 2441e8);
        crows.settle(id, abi.encode(rid));
        vm.expectRevert(abi.encodeWithSelector(Crows.WrongState.selector, Crows.State.Settled));
        crows.settle(id, abi.encode(rid));
        vm.warp(t.settleBy + 1);
        vm.expectRevert(abi.encodeWithSelector(Crows.WrongState.selector, Crows.State.Settled));
        crows.expire(id);
    }

    function test_commitmentMatchesContract() public view {
        assertEq(commit(alice, 2450e8, "sa"), crows.commitmentOf(alice, abi.encode(int256(2450e8)), "sa"));
    }

    function test_setName() public {
        vm.expectEmit(true, false, false, true);
        emit Crows.Named(alice, "opus");
        vm.prank(alice);
        crows.setName("opus");
        assertEq(crows.nameOf(alice), "opus");
        vm.expectRevert(Crows.NameTooLong.selector);
        crows.setName("this name is far too long for a scoreboard row");
    }

    // ================================================================ price line

    function test_priceLine() public {
        uint64 at = uint64(block.timestamp + 1 hours);
        Crows.Terms memory t = closerTerms(address(0));
        t.resolver = address(line);
        t.params = abi.encode(address(feed), at, int256(2400e8), true); // alice takes OVER 2400
        vm.prank(alice);
        uint256 id = crows.challenge(t, bytes32(0));
        vm.prank(bob);
        crows.accept(id, bytes32(0));
        uint80 rid = postPriceAt(at, 2399e8);
        crows.settle(id, abi.encode(rid));
        assertEq(USDC.balanceOf(bob), 1010e6, "under wins");
    }

    // ================================================================ up or down

    function upDownTerms(bool aUp) internal view returns (Crows.Terms memory t, uint64 start, uint64 end) {
        t = closerTerms(address(0));
        start = t.takeBy;
        end = start + 1 hours;
        t.resolver = address(updown);
        t.params = abi.encode(address(feed), start, end, aUp);
        t.settleBy = end + 3 hours;
        t.revealBy = t.takeBy;
    }

    function test_upDown_upWins() public {
        (Crows.Terms memory t, uint64 start, uint64 end) = upDownTerms(true);
        vm.prank(alice);
        uint256 id = crows.challenge(t, bytes32(0));
        vm.prank(bob);
        crows.accept(id, bytes32(0));
        vm.warp(start - 10);
        uint80 r0 = feed.push(2400e8);
        vm.warp(end - 10);
        uint80 r1 = feed.push(2401e8);
        vm.warp(end + 60);
        vm.expectRevert(Crows.NotYet.selector); // end price not provable until a later round exists
        crows.settle(id, abi.encode(r0, r1));
        feed.push(2390e8);
        vm.expectRevert(Crows.NotYet.selector); // wrong start round
        crows.settle(id, abi.encode(r0 - 1, r1));
        crows.settle(id, abi.encode(r0, r1));
        assertEq(USDC.balanceOf(alice), 1010e6);
    }

    function test_upDown_downAndFlat() public {
        (Crows.Terms memory t, uint64 start, uint64 end) = upDownTerms(true);
        vm.prank(alice);
        uint256 id1 = crows.challenge(t, bytes32(0));
        vm.prank(bob);
        crows.accept(id1, bytes32(0));
        (t,,) = upDownTerms(false);
        vm.prank(alice);
        uint256 id2 = crows.challenge(t, bytes32(0));
        vm.prank(bob);
        crows.accept(id2, bytes32(0));
        vm.warp(start - 10);
        uint80 r0 = feed.push(2400e8);
        vm.warp(end + 60);
        feed.push(2399e8);
        // no round between start and end: price unchanged, a draw
        crows.settle(id1, abi.encode(r0, r0));
        assertEq(uint8(crows.getDuel(id1).outcome), uint8(Outcome.Draw));
        assertEq(USDC.balanceOf(alice), 990e6, "alice still has the second duel staked");
        assertEq(USDC.balanceOf(bob), 990e6);
        crows.settle(id2, abi.encode(r0, r0));
        assertEq(USDC.balanceOf(alice), 1000e6);
    }

    function test_upDown_startMustNotPrecedeTakeBy() public {
        (Crows.Terms memory t, uint64 start, uint64 end) = upDownTerms(true);
        t.params = abi.encode(address(feed), start - 1, end, true);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Crows.InvalidTerms.selector, "start must be at or after takeBy"));
        crows.challenge(t, bytes32(0));
    }
}
