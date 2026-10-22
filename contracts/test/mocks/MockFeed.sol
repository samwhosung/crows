// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IAggregatorV3} from "../../src/lib/PriceAt.sol";

/// @notice A Chainlink-style feed whose rounds are pushed by hand. Used in tests and local runs.
contract MockFeed is IAggregatorV3 {
    struct Round {
        int256 answer;
        uint256 updatedAt;
    }

    uint8 public immutable decimals;
    string public description;
    address public immutable owner;
    Round[] internal _rounds; // round id = index + 1

    constructor(uint8 decimals_, string memory description_, int256 initial) {
        decimals = decimals_;
        description = description_;
        owner = msg.sender;
        _rounds.push(Round(initial, block.timestamp));
    }

    function push(int256 answer) external returns (uint80) {
        require(msg.sender == owner, "owner");
        _rounds.push(Round(answer, block.timestamp));
        return uint80(_rounds.length);
    }

    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80) {
        uint80 id = uint80(_rounds.length);
        Round memory r = _rounds[id - 1];
        return (id, r.answer, r.updatedAt, r.updatedAt, id);
    }

    function getRoundData(uint80 id) external view returns (uint80, int256, uint256, uint256, uint80) {
        require(id >= 1 && id <= _rounds.length, "No data present.");
        Round memory r = _rounds[id - 1];
        return (id, r.answer, r.updatedAt, r.updatedAt, id);
    }
}
