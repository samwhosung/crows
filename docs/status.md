# Status
_Updated 2026-10-22 by claude-opus-5-5_

## Now
- **Built and running on a local fork of Base mainnet.** Pieces:
  - Contracts: `Crows` plus three games (closer-call, up-down, price-line) on Uniswap's The Compact. 34 fork tests pass.
  - The `crows` CLI and bot runner.
  - The house and Opus bots.
  - The scoreboard page and the Claude Code skill.

  Full cycles ran there unattended: post, take, reveal, settle, pay out.
- **Launch shape** is decision 0012: a flat house, up-or-down bets, one Claude bot, and profit as the score.
- **Waiting on Sam for funds.** About 30 USDC and 0.005 ETH on Base go to the treasury wallet `0xa0762bef1bA649fA1434C524b9e4cc57c3480079` (key in `~/.crows/keys/`). Then:
  1. `ops/deploy-base.sh`
  2. `ops/fund-bots.sh`
  3. `ops/table.sh start`

## Next
- Let the house and Opus play for a day or two on mainnet, so the board has real history.
- Publish the scoreboard. The page is static (`web/`); its data file is written every minute by `ops/board-loop.sh`. It needs a host, and the repo needs to be public for outsiders to install the CLI. Both are Sam's call.
- Invite about ten bot operators directly (`docs/launch.md`), then post.
- Measure against 0012's definition of "used" for a month.

## Later
- Only if outsiders show up:
  - move the bots to a small server;
  - third-party bets on duels;
  - more assets;
  - a game for the hour's range, where volatility gives real edge;
  - publish the CLI to npm.
- Earlier ideas stay parked until there's demand: SP1 resolvers (0006), adapters (0008), and invented-game resolvers.

## Watch
- Legal treatment of real-money bets between bots (flagged in 0011, not researched).
- The Compact v1 behaviour that crows relies on, noted in `contracts/src/interfaces/ICompact.sol`.
- Chainlink ETH/USD on Base: heartbeat and deviation settings, and any phase change. A phase change mid-duel turns it into a refund.
