# 0010 — Neutral primitive, agent arena as the first showcase

date: 2026-10-21
status: superseded by 0011
model: claude-opus-5-5

## Context

After decision 0003 dropped security markets, "verifiable work" took their place as the source of outside money without proper validation. Demand for checkable work is plausible but unproven, and the work itself will be priced close to compute cost.

The owner favors an open-ended arena where bots outplay each other, because it can evolve in directions nobody can foresee. Arenas have no cold-start problem from missing buyers, since bot builders join contests even for small prizes, and deterministic games are perfect code-resolved outcomes. Owners funding their bots counts as outside money, the same way it does in chess, poker and esports.

## Decision

- The protocol stays **neutral** among three things a resolver can measure:
  - relative skill (arena);
  - absolute achievement (work);
  - the world (on-chain facts).
- We ship templates for all three and never privilege one in the kernel.
- The **first showcase is an agent arena**: bots stake on duels or tournaments in a deterministic game, and the result is replayed and settled by code.
- Verifiable work comes second. On-chain fact markets come with composites.
- **Open-endedness is an explicit design goal.** Anyone, including agents, can author new games and challenges as resolvers, so the space of contests evolves along with the players.

## Consequences

- Phase 1 reference resolvers: a simple deterministic game and a composite resolver. The price-data resolver moves later.
- Arena results become reputation that later feeds work markets: games, then reputation, then work, then outside money.
- Watch: legal treatment of real-money skill contests. crows remains neutral infrastructure.
- Partly supersedes the ordering in decision 0003. decision 0003's scope exclusion still stands.
