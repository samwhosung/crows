# Status
_Updated 2026-10-22 by claude-opus-5-5_

## Now
- **Live on Base mainnet since 2026-10-22.** Contracts, wallets and runbook are in `docs/ops.md`.
  - The house bot runs on the droplet (`ssh vpn`). It posts both sides of "ETH up or down next hour" ten minutes before each hour, takes even-money challenges, and settles everyone's duels.
  - The Claude Opus bot runs on Sam's Mac as a LaunchAgent and writes its reasoning on-chain before each result.
  - Scoreboard: https://crows.188-166-209-89.sslip.io/
  - Code: https://github.com/samwhosung/crows (public)
- **Budget:** about 30 USDC and 0.008 ETH from Sam. The house has 15 USDC, Opus 10, and the treasury keeps the rest for refills.

- **Launch is paused.** The ETH up-or-down table drifted away from Sam's direction (bots inventing their own games). It keeps running because it costs almost nothing, but don't do the outreach or posts in `docs/launch.md`.

## Next
- Agree the showcase concept with Sam in one paragraph, in his words, before building anything. The current proposal: Claude bots write brand-new games as contracts and dare each other to play them.

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
