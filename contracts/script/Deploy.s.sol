// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Crows} from "../src/Crows.sol";
import {ICompact} from "../src/interfaces/ICompact.sol";
import {CloserCall} from "../src/resolvers/CloserCall.sol";
import {PriceLine} from "../src/resolvers/PriceLine.sol";
import {UpDown} from "../src/resolvers/UpDown.sol";
import {MockFeed} from "../test/mocks/MockFeed.sol";

/// @notice Deploys crows and the three reference games with CREATE2, so addresses are the same on every chain.
/// Contracts already deployed at their address are reused. Writes deployments/<NETWORK>.json.
/// Set MOCK_FEED=true on a local fork to add a hand-driven ETH/USD mirror feed.
contract Deploy is Script {
    ICompact constant COMPACT = ICompact(0x00000000000000171ede64904551eeDF3C6C9788);
    bytes32 constant SALT = keccak256("crows-v0");

    function run() external {
        string memory network = vm.envOr("NETWORK", string("local"));
        bool mock = vm.envOr("MOCK_FEED", false);
        require(address(COMPACT).code.length > 0, "The Compact is not deployed on this chain");

        vm.startBroadcast();
        address crows = _deploy(abi.encodePacked(type(Crows).creationCode, abi.encode(COMPACT)));
        address closer = _deploy(type(CloserCall).creationCode);
        address line = _deploy(type(PriceLine).creationCode);
        address upDown = _deploy(type(UpDown).creationCode);
        address feed;
        if (mock) {
            (, int256 answer,,,) = MockFeed(0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70).latestRoundData();
            feed = address(new MockFeed(8, "ETH / USD (mirror)", answer));
        }
        vm.stopBroadcast();

        string memory o = "deployment";
        vm.serializeUint(o, "chainId", block.chainid);
        vm.serializeUint(o, "startBlock", block.number);
        vm.serializeAddress(o, "compact", address(COMPACT));
        vm.serializeAddress(o, "closerCall", closer);
        vm.serializeAddress(o, "priceLine", line);
        vm.serializeAddress(o, "upDown", upDown);
        if (mock) vm.serializeAddress(o, "mockFeed", feed);
        string memory json = vm.serializeAddress(o, "crows", crows);
        vm.writeJson(json, string.concat("deployments/", network, ".json"));
        console.log("crows", crows);
        console.log("closerCall", closer);
        console.log("priceLine", line);
        console.log("upDown", upDown);
        if (mock) console.log("mockFeed", feed);
    }

    function _deploy(bytes memory initCode) internal returns (address a) {
        a = vm.computeCreate2Address(SALT, keccak256(initCode), CREATE2_FACTORY);
        if (a.code.length > 0) return a;
        (bool ok,) = CREATE2_FACTORY.call(abi.encodePacked(SALT, initCode));
        require(ok && a.code.length > 0, "create2 deploy failed");
    }
}
