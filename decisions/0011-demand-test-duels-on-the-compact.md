# 0011 — Test demand first: bot duels on market calls, with The Compact holding the money

date: 2026-10-22
status: accepted
model: claude-fable-5-1

## Context

A new model re-checked decisions 0001–0010 against the research (`reports/Onchain primitives for agent markets.md`). The report's own finding is that the mechanism has been built several times (Opium, Ante, Sapience) and sat unused: the open resolver slot failed on cost and trust, not on design. Writing and auditing a resolver was expensive human work, and reading a stranger's resolver before accepting a bet was more expensive still. Both costs are now close to zero because agents do the work. That is the only thing that changed, and it is the bet.

Meanwhile the plan had grown into a full kernel (escrow, positions, matching) plus an arena of invented games. The arena of invented games is the use with the least outside money (bot owners against bot owners is zero-sum) and the most prior art: Dark Forest and Lattice's MUD and Redstone (shut down May 2026), 0xMonaco, AI Arena. Sam's point, which the research supports: the pull that brings agents with money is the Polymarket mix of luck and outsmarting an opponent. Without it nobody shows up.

## Decision

1. **No kernel of our own.** Escrow is Uniswap's The Compact (ownerless, ERC-6909, on Base at `0x00000000000000171ede64904551eeDF3C6C9788`). crows is the **arbiter**: a contract that runs a pinned code resolver and releases each side's lock to the winner. Adapters for Gnosis CTF, ERC-8183 and Sapience come only when someone asks.
2. **First use: bot-versus-bot duels on market calls.** "My bot calls the next hour closer than yours." "My return beats yours this week." The market is the game. Invented games stay possible but are not the on-ramp. Third-party bets on a duel use the same primitive (a market on a market).
3. **A visible surface is part of the test.** A scoreboard and a feed of open challenges. It only reads events and gates nothing.
4. **The protocol stays neutral.** A bot is any address that signs: a Claude Code session, an Olas agent, a script, a human. The duel template is parameters (feed, window, scoring, stake, open or aimed at one address). A new resolver is one step away for anyone who wants a different game.
5. **Demand test before anything else.** Two to three weeks of build, then small real money on Base mainnet and a mixed cohort of about ten operators (Claude Code users, trading-bot operators, scripts, a human) with one ready-made challenge and no further instructions. If nothing is used within a month, the project is parked and the reason recorded.

## Consequences

- Supersedes 0007 (positions and matching now live in The Compact) and 0010 (arena of invented games as the showcase). 0001–0006, 0008 and 0009 stand. 0006 (SP1 for heavy resolvers) is deferred until something is in use.
- `docs/design/resolver-interface.md` §3.4 (our kernel) is obsolete; the resolver interface in §3.1 is kept and trimmed.
- Legal: real-money bets with variance count as gambling in most places. crows stays neutral infrastructure, in the way Uniswap and Polymarket's contracts are. Flagged to Sam as exposure to weigh; not researched here.
