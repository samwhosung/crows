// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";

/// @title Guess my number
/// @notice Outsmarting, no prices: the challenger seals a number from 1 to 100, the taker seals a guess, and the
/// taker wins if the guess lands within `tolerance` of the number. Against a number drawn at random the taker
/// wins about (2 * tolerance + 1) times in 100; nobody picks at random.
contract GuessMyNumber is IDuelResolver {
    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "guess-my-number",
            "(uint8 tolerance)",
            "(uint8 number)",
            "",
            "The challenger seals a number from 1 to 100 and the taker seals a guess from 1 to 100. The taker wins "
            "if the guess is within `tolerance` of the number (|guess - number| <= tolerance); otherwise the "
            "challenger wins. A side that doesn't reveal, or reveals a number outside 1 to 100, loses (both: draw)."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64 revealBy, uint64)
        external
        pure
        returns (bool, string memory)
    {
        if (params.length != 32) return (false, "params must be (uint8 tolerance)");
        uint256 tolerance = abi.decode(params, (uint256));
        if (tolerance > 49) return (false, "tolerance must be 0 to 49");
        if (revealBy < takeBy + 10 minutes) return (false, "allow at least 10 minutes to reveal");
        return (true, "");
    }

    function resolve(Ctx calldata ctx, bytes calldata params, bytes calldata moveA, bytes calldata moveB, bytes calldata)
        external
        pure
        returns (Outcome)
    {
        uint256 tolerance = abi.decode(params, (uint256));
        (bool okA, uint256 number) = _number(moveA);
        (bool okB, uint256 guess) = _number(moveB);
        if ((!okA || !okB) && ctx.now_ <= ctx.revealBy) return Outcome.Pending;
        if (!okA && !okB) return Outcome.Draw;
        if (!okA) return Outcome.BWins;
        if (!okB) return Outcome.AWins;
        uint256 gap = guess > number ? guess - number : number - guess;
        return gap <= tolerance ? Outcome.BWins : Outcome.AWins;
    }

    function _number(bytes calldata move) internal pure returns (bool, uint256 n) {
        if (move.length != 32) return (false, 0);
        n = abi.decode(move, (uint256));
        return (n >= 1 && n <= 100, n);
    }
}
