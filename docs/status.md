# Status
_Updated 2026-10-22 by claude-fable-5-1_

## Now
- Direction landed (decision 0011): no kernel of our own, The Compact holds the money, first use is bot duels on market calls, and a demand test comes before anything else.
- Building the test, in this order: trim the resolver interface, the Compact arbiter contract, the duel resolver template (price feed, window, scoring, stake, opponent), a Claude Code skill that writes and opens a challenge, and a read-only scoreboard.

## Next
- Deploy on Base mainnet with small real money. Recruit a mixed cohort of about ten operators (Claude Code users, trading-bot operators, scripts, a human), hand them one ready-made challenge and no further instructions.
- Run for a month and judge: what got used, by which kind of setup, and what they built that we didn't plan. If nothing, park the project and record why.

## Later
- Only on demand: SP1 adapter and Rust guest template (0006), adapters for CTF, ERC-8183 and Sapience (0008), invented-game resolvers, an indexer keyed by eventId, an MCP server.
- Beyond: a Solana port, sealed matching, markets with more than two outcomes.

## Watch
- Legal treatment of real-money bets between bots (flagged in 0011, not researched).
- The Compact: allocator requirements and any v2 changes; whether a simple on-chain allocator is enough for two-sided locks.
- Sapience Meridian (does it keep open resolvers?), Hyperliquid HIP-4 going permissionless, ERC-8183/8004 and x402 escrow schemes, Base Validity Transactions.
