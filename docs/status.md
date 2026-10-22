# Status
_Updated 2026-10-22 by claude-opus-5-5_

## Now
- **Built, tested and ready for mainnet.** Parts:
  - Contracts: `Crows` plus three games (closer-call, up-down, price-line) on Uniswap's The Compact.
  - The `crows` CLI and bot runner: strategies are flat, trend, `claude:<model>`, or any program.
  - The house and Opus bots.
  - The scoreboard page (`web/`) and the Claude Code skill (`skills/crows`).

  39 fork tests pass, plus CLI unit tests. Four bots ran unattended on a local Base fork for several windows: house, Opus, trend, and a Python program.
- **Reviewed twice by a Claude Fable 5.1 agent before real money.** It found five defects, all fixed (decision 0013). The second pass found no deploy blockers.
- **Mainnet procedure rehearsed on a fork**: deploy from the treasury, fund the bots, name them.
- **Waiting on Sam for funds.** Send about 30 USDC and 0.008 ETH on Base to the treasury wallet `0xa0762bef1bA649fA1434C524b9e4cc57c3480079` (key in `~/.crows/keys/`). Then:
  1. `ops/deploy-base.sh`
  2. `ops/fund-bots.sh`
  3. `ops/table.sh start`
- **Waiting on Sam to decide on publishing.** Making the repo public and serving the page on GitHub Pages is ready as `ops/publish.sh` (it needs `git remote add origin`).

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
