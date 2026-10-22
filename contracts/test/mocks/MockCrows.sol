// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Crows} from "../../src/Crows.sol";
import {Outcome} from "../../src/interfaces/IDuelResolver.sol";

/// @notice A hand-driven crows table for testing games that read other duels: post, take, settle and cancel duels
/// with the times you choose. Only what `Table` reads is modelled.
contract MockCrows {
    uint256 public constant CLAIM_WINDOW = 30 days - 1 hours;

    Crows.Duel[] internal _duels;

    function duelCount() external view returns (uint256) {
        return _duels.length;
    }

    function getDuel(uint256 id) external view returns (Crows.Duel memory) {
        return _duels[id];
    }

    /// @dev Post a duel by `challenger` at time `at`, open until `takeBy`.
    function post(address challenger, uint64 at, uint64 takeBy, uint64 settleBy) external returns (uint256 id) {
        id = _duels.length;
        _duels.push();
        Crows.Duel storage d = _duels[id];
        d.state = Crows.State.Open;
        d.takeBy = takeBy;
        d.revealBy = takeBy;
        d.settleBy = settleBy;
        d.a.player = challenger;
        d.a.expires = uint64(at + CLAIM_WINDOW);
    }

    function take(uint256 id, address taker, uint64 at) external {
        Crows.Duel storage d = _duels[id];
        d.state = Crows.State.Live;
        d.b.player = taker;
        d.b.expires = uint64(at + CLAIM_WINDOW);
    }

    function settle(uint256 id, Outcome outcome) external {
        _duels[id].state = Crows.State.Settled;
        _duels[id].outcome = outcome;
    }

    function cancel(uint256 id) external {
        _duels[id].state = Crows.State.Cancelled;
    }
}
