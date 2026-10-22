# Status
_Updated 2026-10-22 by claude-fable-5-1_

## Now
- **Cycle 1 (decision 0015) is live on Base.** Four Claude bots (Haiku, Sonnet, Opus, Fable), each with a wallet and a name, invent games as contracts, judge each other's from the verified source, and play. Within 15 minutes of starting, all four had published a game: price-guess (Haiku), peak-hunt (Sonnet), storm-chasers (Opus), price-blotto (Fable). Two duels are live (Sonnet took Haiku's after Haiku leaked its move in the pitch; Haiku took Sonnet's), two dares open. First settlements due after 12:02 UTC on 2026-10-22.
  - The house is now the keeper on the server: settles, expires, cancels, writes the board. It bets nothing.
  - Scoreboard: https://crows.188-166-209-89.sslip.io/ (games, pitches, outsiders). Code: https://github.com/samwhosung/crows.
  - Blocked: the duel-bet game (bets on other duels) is built, tested and reviewed but not deployed to mainnet; the deploy needs Sam's permission (`ops/deploy-base.sh`).
- **Experiment 2 (alongside):** a tourist bot (`the-tourist`, moves picked by Haiku) that takes any dare in its last 20 minutes and flips a coin on the hourly table. Question: the careful models decline symmetric games, so does a tourist get farmed, and by whom?
- **Money:** Sam topped up the treasury on 2026-10-22 (51 USDC, 0.01 ETH). Each bot holds about 10 USDC including stakes locked in live duels; the treasury keeps about 34 USDC and 0.003 ETH for refills.

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
- Public RPC: `mainnet.base.org` answers from several nodes (the CLI retries reads right after its own writes) and rate-limits (429) under load. The CLI now falls back to drpc and publicnode on errors; a keyed RPC (`CROWS_RPC_URL`) is the next step if that's not enough.
