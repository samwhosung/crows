// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IAggregatorV3 {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
    function getRoundData(uint80 roundId)
        external
        view
        returns (uint80 roundId_, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @notice "The first price a Chainlink-style feed posts at or after time T", proven by a round id.
///
/// Round r is that price if it was updated at or after T, no later than T + MAX_DELAY, and the round before it
/// (r - 1) was updated before T. Why the first round *after* T rather than the last one before it: the last round
/// before T is usually already public when bets close, which hands a late taker information. The first round at
/// or after T is unknown to everyone until it is posted.
///
/// Only rounds of the feed's current phase count. When Chainlink upgrades a feed, the old and new aggregators can
/// both keep posting for days, so two different "first prices" could otherwise be proven for the same instant. If
/// a price can't be proven in the current phase, the duel expires as a draw.
library PriceAt {
    uint256 internal constant MAX_DELAY = 1 hours;
    uint256 private constant PHASE_SHIFT = 64;

    function firstAtOrAfter(address feed, uint64 t, uint80 roundId) internal view returns (bool ok, int256 answer) {
        return _first(feed, t, roundId, MAX_DELAY);
    }

    /// @notice The same price as `firstAtOrAfter`, found on-chain, so a game needs no evidence and any keeper can
    /// settle it. ok = false until that round is posted, or if it came more than an hour after t.
    function find(address feed, uint64 t) internal view returns (bool ok, int256 answer) {
        return findWithin(feed, t, MAX_DELAY);
    }

    /// @notice The first round at or after t, if it was posted no later than t + maxDelay. For slow feeds that
    /// only post on a 0.5% move or once a day, pass up to 25 hours and give the duel time to settle after that.
    /// Rounds of one phase are posted in time order, so this is a binary search over the feed's current phase:
    /// about 20 reads however far back t is.
    function findWithin(address feed, uint64 t, uint256 maxDelay) internal view returns (bool ok, int256 answer) {
        if (feed.code.length == 0) return (false, 0); // a call to no code can't be caught below
        uint80 latest;
        try IAggregatorV3(feed).latestRoundData() returns (uint80 rid, int256, uint256, uint256, uint80) {
            latest = rid;
        } catch {
            return (false, 0);
        }
        uint80 phase = uint80((uint256(latest) >> PHASE_SHIFT) << PHASE_SHIFT);
        uint64 lo = 1;
        uint64 hi = uint64(latest);
        if (hi == 0) return (false, 0);
        (bool okH,, uint256 th) = _round(feed, phase + hi);
        if (!okH || th < t) return (false, 0); // not posted yet
        while (lo < hi) {
            uint64 mid = lo + (hi - lo) / 2;
            (bool okM,, uint256 tm) = _round(feed, phase + mid);
            if (!okM) return (false, 0);
            if (tm >= t) hi = mid;
            else lo = mid + 1;
        }
        // Re-check with the proof rules: current phase, predecessor before t, within the delay, positive price.
        return _first(feed, t, phase + lo, maxDelay);
    }

    function _first(address feed, uint64 t, uint80 roundId, uint256 maxDelay) private view returns (bool, int256) {
        if (!_currentPhase(feed, roundId)) return (false, 0);
        (bool ok1, int256 a1, uint256 t1) = _round(feed, roundId);
        if (!ok1 || t1 < t || t1 > uint256(t) + maxDelay || a1 <= 0) return (false, 0);
        if (uint64(roundId) > 1) {
            // Not the phase's first round: its predecessor must predate t, or r isn't the first at/after t.
            (bool ok0,, uint256 t0) = _round(feed, roundId - 1);
            if (!ok0 || t0 >= t) return (false, 0);
        }
        return (true, a1);
    }

    function isFeed(address feed) internal view returns (bool) {
        if (feed.code.length == 0) return false;
        try IAggregatorV3(feed).latestRoundData() returns (uint80, int256 answer, uint256, uint256 u, uint80) {
            return answer > 0 && u > 0;
        } catch {
            return false;
        }
    }

    function _currentPhase(address feed, uint80 roundId) private view returns (bool) {
        try IAggregatorV3(feed).latestRoundData() returns (uint80 latest, int256, uint256, uint256, uint80) {
            return (uint256(latest) >> PHASE_SHIFT) == (uint256(roundId) >> PHASE_SHIFT) && roundId <= latest;
        } catch {
            return false;
        }
    }

    function _round(address feed, uint80 roundId) private view returns (bool ok, int256 answer, uint256 u) {
        try IAggregatorV3(feed).getRoundData(roundId) returns (uint80 rid, int256 a, uint256, uint256 upd, uint80) {
            return (rid == roundId && upd > 0, a, upd);
        } catch {
            return (false, 0, 0);
        }
    }
}
