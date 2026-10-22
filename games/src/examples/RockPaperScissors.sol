// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";

/// @title Rock, paper, scissors
/// @notice A pure strategy game with sealed moves: both hands are committed before either is shown.
contract RockPaperScissors is IDuelResolver {
    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "rock-paper-scissors",
            "(uint8 rounds)",
            "(uint8[] hands)",
            "",
            "Each side seals a list of `rounds` hands (0 rock, 1 paper, 2 scissors). Round i pits hand i against hand "
            "i: rock beats scissors, scissors beats paper, paper beats rock. Whoever wins more rounds wins; equal is a "
            "draw. A side that doesn't reveal, or reveals the wrong number of hands or a hand above 2, loses (both: draw)."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64 revealBy, uint64)
        external
        pure
        returns (bool, string memory)
    {
        if (params.length != 32) return (false, "params must be (uint8 rounds)");
        uint256 rounds = abi.decode(params, (uint256));
        if (rounds == 0 || rounds > 25 || rounds % 2 == 0) return (false, "rounds must be odd, 1 to 25");
        if (revealBy < takeBy + 10 minutes) return (false, "allow at least 10 minutes to reveal");
        return (true, "");
    }

    function resolve(Ctx calldata ctx, bytes calldata params, bytes calldata moveA, bytes calldata moveB, bytes calldata)
        external
        pure
        returns (Outcome)
    {
        uint256 rounds = abi.decode(params, (uint256));
        (bool okA, uint8[] memory a) = _hands(moveA, rounds);
        (bool okB, uint8[] memory b) = _hands(moveB, rounds);
        // Wait for both reveals until the reveal deadline; after it, a missing or bad move loses.
        if ((!okA || !okB) && ctx.now_ <= ctx.revealBy) return Outcome.Pending;
        if (!okA && !okB) return Outcome.Draw;
        if (!okA) return Outcome.BWins;
        if (!okB) return Outcome.AWins;
        int256 score;
        for (uint256 i; i < rounds; i++) {
            if (a[i] == b[i]) continue;
            score += (a[i] + 3 - b[i]) % 3 == 1 ? int256(1) : -1;
        }
        return score > 0 ? Outcome.AWins : score < 0 ? Outcome.BWins : Outcome.Draw;
    }

    function _hands(bytes calldata move, uint256 rounds) internal pure returns (bool, uint8[] memory h) {
        if (move.length == 0) return (false, h);
        h = abi.decode(move, (uint8[]));
        if (h.length != rounds) return (false, h);
        for (uint256 i; i < rounds; i++) {
            if (h[i] > 2) return (false, h);
        }
        return (true, h);
    }
}
