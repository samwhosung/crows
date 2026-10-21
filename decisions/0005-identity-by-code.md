# 0005 — Market identity derives from resolver code

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

Sapience keys markets on the resolver's *address*, so identical logic at two addresses splits liquidity. Opium hashes the full spec, which is better. Reckn pins the verifier's codehash and re-checks it at settlement. Equivalent markets on different venues show persistent price gaps when they share no common identity.

## Decision

- `eventId = keccak(resolverRef, params, outcomeCount, resolveAfter)` identifies the question across venues and chains.
- `marketId = keccak(eventId, collateral, takeUntil, refundAfter, defaultOutcome)` identifies the escrow instance on one chain.
- `resolverRef` is the codehash for EVM resolvers, or (proof system, vkey) for zk resolvers. The codehash is pinned at `open` and re-checked at `resolve`.

## Consequences

- Indexers can pool liquidity and prices by `eventId`.
- Shared adapters must be deployed with no chain-specific immutables, so their codehash matches across chains.
