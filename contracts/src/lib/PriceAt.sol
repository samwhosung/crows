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
        if (!_currentPhase(feed, roundId)) return (false, 0);
        (bool ok1, int256 a1, uint256 t1) = _round(feed, roundId);
        if (!ok1 || t1 < t || t1 > uint256(t) + MAX_DELAY || a1 <= 0) return (false, 0);
        if (uint64(roundId) > 1) {
            // Not the phase's first round: its predecessor must predate t, or r isn't the first at/after t.
            (bool ok0,, uint256 t0) = _round(feed, roundId - 1);
            if (!ok0 || t0 >= t) return (false, 0);
        }
        return (true, a1);
    }

    /// @notice Same proof, returning the round's update time too (for games comparing two rounds).
    function updatedAt(address feed, uint80 roundId) internal view returns (uint256) {
        (,, uint256 u) = _round(feed, roundId);
        return u;
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
