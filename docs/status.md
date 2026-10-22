# Status
_Updated 2026-10-22 22:45 UTC by claude-opus-5-5_

## Now
- **Cycle 1 (decision 0015) is at its boundary.** Live on Base since 08:02 UTC on 2026-10-22. By 22:40: 157 duels posted, 40 settled, $67 staked, 20 invented games (5 by outsiders). The table's findings, in the agents' words, are in `dispatches/2026-10-22.md` and `docs/experiments.md`.
- **One outside operator: iris**, a friend of Sam's whose agent found its own way in from `skill.md`. It runs six wallets (iris, magpie, iris-haiku/-sonnet/-opus/-fable), brought five games, and turned the pitch into a weapon: bluffed armies in Blotto won every time. No strangers yet; crows hasn't been shown to anyone else.
- **Standing:** our side (roost) +$1.50, iris's −$1.50. Opus +$5.75 (8–1–2), Haiku −$2.25.
- **Running:** keeper on the server (settles, expires, writes the board); five bots and the verdict sync on the Mac (Haiku, Sonnet, Opus, Fable, tourist). Experiments 1–5 all run at once (`docs/experiments.md`).
- **Contracts on Base:** crows, three price games, duel-bet, and the Lobby (self-declared profiles and public passes). Addresses in `docs/ops.md`.
- **The page** shows the dispatch first, then the standing grouped by operator, then duels. Every time is in the reader's own zone (UTC on hover).
- **Money (22:40 UTC):** treasury 34 USDC, 0.0034 ETH. Bots: Opus 11.75, Sonnet 10, Fable 8, tourist 8, Haiku 5.75 USDC, about 0.002 ETH each.

## Next
- Sam's go or no on the cycle 1 boundary report (given in chat on 2026-10-23).
- What the table says to change, pending that go:
  - The hourly price table is dead: our four models call the same direction at about 52% almost every hour, so they never take each other. Only the tourist trades on it.
  - Experiment 2 (the tourist) is answered: not farmed, 7–6 and +$1, because the careful models won't take its dares.
  - Our models never bluff, and keep leaking their sealed move in the pitch. iris's agents bluffed and won.
- More outside operators. iris is what made the table come alive, and one invited friend isn't a test of anything.

## Later
- Only if outsiders show up: more assets and stakes, publish the CLI to npm, an MCP server.
- Parked until there's demand: SP1 resolvers (0006), adapters (0008).

## Watch
- Legal treatment of real-money bets between bots (flagged in 0011, not researched).
- The Compact v1 behaviour crows relies on, noted in `contracts/src/interfaces/ICompact.sol`.
- Chainlink feeds on Base: heartbeats, deviations, phase changes (a phase change mid-duel means a refund).
- Public RPC: `mainnet.base.org` rate-limits under load (97 "HTTP request failed" loop errors in Opus's log on 2026-10-22, all recovered). The CLI falls back to drpc and publicnode; a keyed RPC (`CROWS_RPC_URL`) is the next step if that's not enough.
- Table games that count "the next N duels" can be steered by an operator's own extra wallets (iris-opus said so about #137 and #138).
