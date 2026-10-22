// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {BaseTest} from "./Base.t.sol";
import {Crows} from "../src/Crows.sol";
import {Lobby} from "../src/Lobby.sol";

contract LobbyTest is BaseTest {
    Lobby lobby;

    function setUp() public override {
        super.setUp();
        lobby = new Lobby(crows);
    }

    function openDare(address opponent) internal returns (uint256 id, Crows.Terms memory t) {
        t = closerTerms(opponent);
        vm.prank(alice);
        id = crows.challenge(t, commit(alice, 2400e8, "sa"));
    }

    function test_profile() public {
        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit Lobby.ProfileSet(alice, "claude-opus-5.5", "crows", "https://github.com/samwhosung/crows");
        lobby.setProfile("claude-opus-5.5", "crows", "https://github.com/samwhosung/crows");
        (string memory model, string memory operator, string memory url, uint64 at) = lobby.profileOf(alice);
        assertEq(model, "claude-opus-5.5");
        assertEq(operator, "crows");
        assertEq(url, "https://github.com/samwhosung/crows");
        assertEq(at, uint64(block.timestamp));

        vm.prank(alice);
        lobby.setProfile("", "", "");
        (model,,,) = lobby.profileOf(alice);
        assertEq(model, "");

        // Boundaries: 64, 64 and 160 bytes are fine; one more is not, in any field.
        vm.prank(alice);
        lobby.setProfile(new string(64), new string(64), new string(160));
        vm.prank(alice);
        vm.expectRevert(Lobby.TooLong.selector);
        lobby.setProfile(new string(65), "", "");
        vm.prank(alice);
        vm.expectRevert(Lobby.TooLong.selector);
        lobby.setProfile("", new string(65), "");
        vm.prank(alice);
        vm.expectRevert(Lobby.TooLong.selector);
        lobby.setProfile("", "", new string(161));
    }

    function test_passOnAnOpenDare() public {
        (uint256 id,) = openDare(address(0));

        vm.prank(bob);
        vm.expectEmit(true, true, false, true);
        emit Lobby.Passed(id, bob, "Symmetric and I have no edge, but I'd take it at 2 to 1.", 1e6, 2e6);
        lobby.pass(id, "Symmetric and I have no edge, but I'd take it at 2 to 1.", 1e6, 2e6);
        Lobby.Pass[] memory ps = lobby.passesOf(id, 0, 10);
        assertEq(ps.length, 1);
        assertEq(ps[0].who, bob);
        assertEq(ps[0].at, uint64(block.timestamp));
        assertEq(ps[0].wouldStake, 1e6);
        assertEq(ps[0].againstStake, 2e6);
        assertTrue(lobby.passed(id, bob));
        assertEq(lobby.passCount(id), 1);

        vm.prank(bob);
        vm.expectRevert(Lobby.AlreadyPassed.selector);
        lobby.pass(id, "again", 0, 0);

        vm.prank(alice);
        vm.expectRevert(Lobby.OwnDare.selector);
        lobby.pass(id, "my own", 0, 0);

        vm.prank(carol);
        vm.expectRevert(Lobby.BadPrice.selector);
        lobby.pass(id, "half a price", 1e6, 0);

        vm.prank(carol);
        vm.expectRevert(Lobby.TooLong.selector);
        lobby.pass(id, new string(281), 0, 0);

        vm.prank(carol);
        lobby.pass(id, new string(280), 0, 0); // exactly the limit is fine
        assertEq(lobby.passCount(id), 2);

        vm.expectRevert(Lobby.UnknownDuel.selector);
        lobby.pass(id + 1, "nothing there", 0, 0);
    }

    function test_pagesThroughPasses() public {
        (uint256 id,) = openDare(address(0));
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(address(uint160(0x1000 + i)));
            lobby.pass(id, "pass", 0, 0);
        }
        assertEq(lobby.passCount(id), 5);
        assertEq(lobby.passesOf(id, 0, 2).length, 2);
        Lobby.Pass[] memory tail = lobby.passesOf(id, 3, 10);
        assertEq(tail.length, 2);
        assertEq(tail[0].who, address(uint160(0x1004)));
        assertEq(lobby.passesOf(id, 5, 10).length, 0, "from past the end");
        assertEq(lobby.passesOf(id, 0, 0).length, 0);
        assertEq(lobby.passesOf(id, 1, type(uint256).max).length, 4, "count overflow is clamped");
        assertEq(lobby.passesOf(id + 7, 0, 10).length, 0, "no passes on an unknown duel");
    }

    function test_noPassOnceTakenCancelledOrPastTakeBy() public {
        (uint256 id, Crows.Terms memory t) = openDare(address(0));
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));
        vm.prank(carol);
        vm.expectRevert(Lobby.NotOpen.selector);
        lobby.pass(id, "too late", 0, 0);

        // A dare past its takeBy can't be taken, so it can't be passed on either, even before it's cancelled.
        (uint256 id2,) = openDare(address(0));
        vm.warp(t.takeBy + 1);
        vm.prank(carol);
        vm.expectRevert(Lobby.NotOpen.selector);
        lobby.pass(id2, "nobody can take this now", 0, 0);
        vm.prank(alice);
        crows.cancel(id2);
        vm.prank(carol);
        vm.expectRevert(Lobby.NotOpen.selector);
        lobby.pass(id2, "cancelled", 0, 0);
    }

    function test_anyoneMayPassOnAPrivateDare() public {
        (uint256 id,) = openDare(bob); // only bob may take it
        vm.prank(carol);
        lobby.pass(id, "Open it up and I'd take it at 2 to 1.", 1e6, 2e6);
        assertEq(lobby.passCount(id), 1);
    }
}
