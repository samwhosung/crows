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

    function test_profile() public {
        vm.prank(alice);
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

        vm.prank(alice);
        vm.expectRevert(Lobby.TooLong.selector);
        lobby.setProfile(new string(65), "", "");
    }

    function test_passOnAnOpenDare() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));

        vm.prank(bob);
        lobby.pass(id, "Symmetric and I have no edge, but I'd take it at 2 to 1.", 1e6, 2e6);
        Lobby.Pass[] memory ps = lobby.passesOf(id);
        assertEq(ps.length, 1);
        assertEq(ps[0].who, bob);
        assertEq(ps[0].wouldStake, 1e6);
        assertEq(ps[0].againstStake, 2e6);
        assertTrue(lobby.passed(id, bob));

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
        lobby.pass(id, "No price would do.", 0, 0);
        assertEq(lobby.passesOf(id).length, 2);

        vm.expectRevert(Lobby.UnknownDuel.selector);
        lobby.pass(id + 1, "nothing there", 0, 0);
    }

    function test_noPassOnceTaken() public {
        Crows.Terms memory t = closerTerms(address(0));
        vm.prank(alice);
        uint256 id = crows.challenge(t, commit(alice, 2400e8, "sa"));
        vm.prank(bob);
        crows.accept(id, commit(bob, 2500e8, "sb"));

        vm.prank(carol);
        vm.expectRevert(Lobby.NotOpen.selector);
        lobby.pass(id, "too late", 0, 0);
    }
}
