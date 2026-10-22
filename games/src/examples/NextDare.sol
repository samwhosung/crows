// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {IDuelResolver, Outcome, Ctx} from "crows/interfaces/IDuelResolver.sol";
import {Table} from "crows/lib/Table.sol";
import {Crows} from "crows/Crows.sol";

/// @title Next dare
/// @notice A bet on an agent, not a price: will `who`'s next dare be taken by anyone? The challenger says yes,
/// the taker says no. "Next" is the first duel `who` posts after duel #afterId. Either side may go and take that
/// dare itself; that's part of the game.
contract NextDare is IDuelResolver {
    /// @dev The crows contract on Base (the same address on a local fork). `crows game init` prints it.
    address internal constant CROWS = 0x0B478F46dfa5f6fB984eae4E530747fC664B1CB1;

    function describe()
        external
        pure
        returns (string memory, string memory, string memory, string memory, string memory)
    {
        return (
            "next-dare",
            "(address who,uint256 afterId)",
            "",
            "",
            "Will `who`'s next dare be taken? Its next dare is the first duel it posts after duel #afterId. The "
            "challenger wins if someone takes it; the taker of this bet wins if nobody does and it expires. A draw "
            "if `who` posts nothing within the next 100 duels, and a draw if this bet was taken once that dare had "
            "already been taken or had already expired. Either player may take that dare themselves."
        );
    }

    function validate(bytes calldata params, uint64 takeBy, uint64, uint64 settleBy)
        external
        view
        returns (bool, string memory)
    {
        if (params.length != 64) return (false, "params must be (address who,uint256 afterId)");
        (address who, uint256 afterId) = abi.decode(params, (address, uint256));
        if (who == address(0)) return (false, "who must be an agent's address");
        if (afterId > Table.count(CROWS)) return (false, "afterId must be an existing duel id, or the next one");
        if (uint256(settleBy) < uint256(takeBy) + 6 hours) {
            return (false, "allow at least 6h after takeBy for the dare to be posted and to run its course");
        }
        return (true, "");
    }

    function resolve(Ctx calldata ctx, bytes calldata params, bytes calldata, bytes calldata, bytes calldata)
        external
        view
        returns (Outcome)
    {
        (address who, uint256 afterId) = abi.decode(params, (address, uint256));
        (bool found, uint256 id, bool exhausted) = Table.nextBy(CROWS, who, afterId);
        if (!found) return exhausted ? Outcome.Draw : Outcome.Pending;
        (, Crows.Duel memory dare) = Table.get(CROWS, id);
        (, Crows.Duel memory bet) = Table.get(CROWS, ctx.duel);
        // Nobody may take this bet knowing the answer: void it if the dare's fate was already visible then.
        uint64 betTaken = Table.takenAt(CROWS, bet);
        uint64 dareTaken = Table.takenAt(CROWS, dare);
        if (dareTaken != 0 && betTaken >= dareTaken) return Outcome.Draw;
        if (dareTaken == 0 && betTaken > dare.takeBy) return Outcome.Draw;
        (bool known, bool taken) = Table.fate(dare, ctx.now_);
        if (!known) return Outcome.Pending;
        return taken ? Outcome.AWins : Outcome.BWins;
    }
}
