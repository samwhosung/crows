// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Crows} from "../Crows.sol";
import {Outcome} from "../interfaces/IDuelResolver.sol";

/// @notice The crows table, for games about other duels and the agents playing them: will X's next dare be taken,
/// who wins #N, does Y take three in a row. Everything here is read from the crows contract.
///
/// What stays the same once written (safe to decide on): a duel that is Settled or Cancelled, the moment a duel
/// was posted or taken, and "the first duel after #K by X" once it exists. What keeps changing: an Open or Live
/// duel. Return Pending until what you decide on is final.
///
/// Nobody may take a duel knowing the answer: if the thing you bet on can become known before your `takeBy`
/// (another duel being taken, or expiring), void the bet when it was taken after that moment. `takenAt` gives
/// both times; see NextDare in the kit's examples for the pattern.
library Table {
    uint256 internal constant MAX_SCAN = 100; // duels one call will read; keep settle gas bounded

    /// @notice A duel by id, if it exists.
    function get(address crows, uint256 id) internal view returns (bool exists, Crows.Duel memory d) {
        if (id >= Crows(crows).duelCount()) return (false, d);
        return (true, Crows(crows).getDuel(id));
    }

    function count(address crows) internal view returns (uint256) {
        return Crows(crows).duelCount();
    }

    /// @notice When the duel was posted (its challenger's stake locked).
    function postedAt(address crows, Crows.Duel memory d) internal view returns (uint64) {
        return uint64(uint256(d.a.expires) - Crows(crows).CLAIM_WINDOW());
    }

    /// @notice When the duel was taken, or 0 if it hasn't been.
    function takenAt(address crows, Crows.Duel memory d) internal view returns (uint64) {
        if (d.b.player == address(0)) return 0;
        return uint64(uint256(d.b.expires) - Crows(crows).CLAIM_WINDOW());
    }

    /// @notice Settled or cancelled: nothing about it changes any more.
    function isFinal(Crows.Duel memory d) internal pure returns (bool) {
        return d.state == Crows.State.Settled || d.state == Crows.State.Cancelled;
    }

    /// @notice Whether the duel was taken, once that's known: it was (Live or Settled), or it wasn't (Cancelled,
    /// or still Open past its takeBy, which only cancellation can follow).
    function fate(Crows.Duel memory d, uint64 now_) internal pure returns (bool known, bool taken) {
        if (d.state == Crows.State.Live || d.state == Crows.State.Settled) return (true, true);
        if (d.state == Crows.State.Cancelled) return (true, false);
        if (d.state == Crows.State.Open && now_ > d.takeBy) return (true, false);
        return (false, false);
    }

    /// @notice The winner of a settled duel; address(0) for a draw, an expiry, or anything not settled.
    function winner(Crows.Duel memory d) internal pure returns (address) {
        if (d.state != Crows.State.Settled) return address(0);
        if (d.outcome == Outcome.AWins) return d.a.player;
        if (d.outcome == Outcome.BWins) return d.b.player;
        return address(0);
    }

    function involves(Crows.Duel memory d, address who) internal pure returns (bool) {
        return d.a.player == who || d.b.player == who;
    }

    /// @notice The first duel after #afterId posted by `who`, looking at most MAX_SCAN ids ahead. `exhausted` means
    /// those ids all exist and none is theirs; otherwise a miss means "not yet": more duels may still be posted.
    function nextBy(address crows, address who, uint256 afterId)
        internal
        view
        returns (bool found, uint256 id, bool exhausted)
    {
        uint256 n = Crows(crows).duelCount();
        uint256 last = afterId + MAX_SCAN;
        for (id = afterId + 1; id <= last && id < n; id++) {
            if (Crows(crows).getDuel(id).a.player == who) return (true, id, false);
        }
        return (false, 0, last < n);
    }

    /// @notice The first duel after #afterId that `who` posted or took, looking at most MAX_SCAN ids ahead. A duel
    /// counts once `who` is in it, so an Open duel nobody has taken yet is not "theirs" as a taker.
    function nextInvolving(address crows, address who, uint256 afterId)
        internal
        view
        returns (bool found, uint256 id, bool exhausted)
    {
        uint256 n = Crows(crows).duelCount();
        uint256 last = afterId + MAX_SCAN;
        for (id = afterId + 1; id <= last && id < n; id++) {
            if (involves(Crows(crows).getDuel(id), who)) return (true, id, false);
        }
        return (false, 0, last < n);
    }
}
