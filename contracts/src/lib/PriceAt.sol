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

/// @notice "The price in effect at time T" from a Chainlink-style feed, proven by a round id.
/// Round r is the answer at T if r was updated at or before T and round r+1 was updated after T.
/// Past rounds never change, so the answer is deterministic once round r+1 exists. If the feed switched
/// phase right after r (r+1 does not exist), the price can't be proven and the duel will expire as a draw.
library PriceAt {
    function priceAt(address feed, uint64 at, uint80 roundId) internal view returns (bool ok, int256 answer) {
        (bool ok1, int256 a1, uint256 t1) = _round(feed, roundId);
        if (!ok1 || t1 == 0 || t1 > at || a1 <= 0) return (false, 0);
        (bool ok2,, uint256 t2) = _round(feed, roundId + 1);
        if (!ok2 || t2 <= at) return (false, 0);
        return (true, a1);
    }

    function isFeed(address feed) internal view returns (bool) {
        if (feed.code.length == 0) return false;
        try IAggregatorV3(feed).latestRoundData() returns (uint80, int256 answer, uint256, uint256 updatedAt, uint80) {
            return answer > 0 && updatedAt > 0;
        } catch {
            return false;
        }
    }

    function _round(address feed, uint80 roundId) private view returns (bool ok, int256 answer, uint256 updatedAt) {
        try IAggregatorV3(feed).getRoundData(roundId) returns (
            uint80 rid, int256 a, uint256, uint256 u, uint80
        ) {
            return (rid == roundId, a, u);
        } catch {
            return (false, 0, 0);
        }
    }
}
