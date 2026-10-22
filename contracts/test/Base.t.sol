// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";
import {Crows} from "../src/Crows.sol";
import {ICompact} from "../src/interfaces/ICompact.sol";
import {Outcome} from "../src/interfaces/IDuelResolver.sol";
import {CloserCall} from "../src/resolvers/CloserCall.sol";
import {PriceLine} from "../src/resolvers/PriceLine.sol";
import {UpDown} from "../src/resolvers/UpDown.sol";
import {MockFeed} from "./mocks/MockFeed.sol";

/// @notice Shared setup: a fork of Base mainnet with the real Compact and USDC, crows deployed on top.
abstract contract BaseTest is Test {
    ICompact constant COMPACT = ICompact(0x00000000000000171ede64904551eeDF3C6C9788);
    IERC20 constant USDC = IERC20(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    address constant ETH_USD = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    uint256 constant FORK_BLOCK = 52924775;

    Crows crows;
    CloserCall closer;
    PriceLine line;
    UpDown updown;
    MockFeed feed;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    uint128 constant STAKE = 10e6; // 10 USDC

    function setUp() public virtual {
        vm.createSelectFork(vm.envOr("BASE_RPC_URL", string("https://mainnet.base.org")), FORK_BLOCK);
        crows = new Crows(COMPACT);
        closer = new CloserCall();
        line = new PriceLine();
        updown = new UpDown();
        feed = new MockFeed(8, "ETH / USD (mock)", 2400e8);
        for (uint256 i; i < 3; i++) {
            address p = [alice, bob, carol][i];
            deal(address(USDC), p, 1000e6);
            vm.prank(p);
            USDC.approve(address(crows), type(uint256).max);
        }
    }

    // ---------------------------------------------------------------- helpers

    /// @dev Computed locally (an external call here would consume a pending vm.prank).
    function commit(address player, int256 call_, bytes32 salt) internal view returns (bytes32) {
        return commitRaw(player, abi.encode(call_), salt);
    }

    function commitRaw(address player, bytes memory move, bytes32 salt) internal view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(crows), player, move, salt));
    }

    /// @dev Closer-call terms: take within 10 min, price at +1h, reveal by +1h30, settle by +3h.
    function closerTerms(address opponent) internal view returns (Crows.Terms memory t) {
        uint64 now_ = uint64(block.timestamp);
        t = Crows.Terms({
            resolver: address(closer),
            params: abi.encode(address(feed), now_ + 1 hours),
            token: address(USDC),
            stakeA: STAKE,
            stakeB: STAKE,
            opponent: opponent,
            takeBy: now_ + 10 minutes,
            revealBy: now_ + 90 minutes,
            settleBy: now_ + 3 hours
        });
    }

    function openCloser(int256 callA, int256 callB) internal returns (uint256 id, Crows.Terms memory t) {
        t = closerTerms(address(0));
        vm.prank(alice);
        id = crows.challenge(t, commit(alice, callA, "sa"));
        vm.prank(bob);
        crows.accept(id, commit(bob, callB, "sb"));
    }

    function revealBoth(uint256 id, int256 callA, int256 callB) internal {
        crows.reveal(id, alice, abi.encode(callA), "sa");
        crows.reveal(id, bob, abi.encode(callB), "sb");
    }

    function atOf(Crows.Terms memory t) internal pure returns (uint64 at) {
        (, at) = abi.decode(t.params, (address, uint64));
    }

    /// @dev Make `price` the first round posted at or after `at` (with a different round just before `at` and one
    /// after). Returns the round id.
    function postPriceAt(uint64 at, int256 price) internal returns (uint80 rid) {
        vm.warp(at - 30);
        feed.push(price - 5e8);
        vm.warp(at + 30);
        rid = feed.push(price);
        vm.warp(at + 90);
        feed.push(price + 1e8);
    }

    function lockBalance(address who) internal view returns (uint256) {
        return COMPACT.balanceOf(who, crows.lockId(address(USDC)));
    }
}
