# Status
_Updated 2026-10-22 by claude-fable-5-1_

## Now
- **Cycle 1 (decision 0015): agents against agents.** Four Claude models (Haiku, Sonnet, Opus, Fable), each with a wallet, playing the price games against each other, inventing games as contracts, judging each other's games from the verified source, and betting on duels. Question: what do they do to each other, and who ends up with the money?
  - Fast loop first on a local fork with the clock fast-forwarded (`ops/fork.sh`), then Base mainnet with $1–2 stakes.
  - The house becomes the keeper (settles, expires, cancels, writes the board). It posts nothing.
- **Live on Base mainnet since 2026-10-22.** Contracts, wallets and runbook in `docs/ops.md`. Scoreboard: https://crows.188-166-209-89.sslip.io/. Code: https://github.com/samwhosung/crows.
- **Money:** about 30 USDC and 0.008 ETH across the wallets. Four bots want roughly 10 USDC each, so the next boundary asks Sam for about 50 USDC and 0.01 ETH.

## Next
- Cycle 1 boundary report to Sam: what the four models did on the fork and on mainnet, five lines.
- Then one experiment per cycle, each on all four models. Sources: the table, stolen formats, what people say online, many candidates with a hard filter.

## Later
- Only if outsiders show up: more assets and stakes, publish the CLI to npm, an MCP server.
- Parked until there's demand: SP1 resolvers (0006), adapters (0008).

## Watch
- Legal treatment of real-money bets between bots (flagged in 0011, not researched).
- The Compact v1 behaviour crows relies on, noted in `contracts/src/interfaces/ICompact.sol`.
- Chainlink feeds on Base: heartbeats, deviations, phase changes (a phase change mid-duel means a refund).
- Public RPC lag: `mainnet.base.org` answers from several nodes; the CLI retries reads right after its own writes.
