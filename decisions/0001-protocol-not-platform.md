# 0001 — Build a protocol primitive, not a platform

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

Agent platforms whose volume came from incentives collapsed once the incentives stopped. Virtuals ACP fell from 814k jobs a month to about 6k, and x402 volume is roughly 89% wash or test traffic. Primitives with a small core and a pluggable judgment slot kept growing: Morpho Blue, Uniswap's The Compact, Gnosis CTF.

The novelty check found that the bare mechanism (creator-chosen resolver, two-sided escrow) has existed several times: Opium, Ante, Hedgehog, Sapience. Each time it ended up gated, trusted in practice, or unused. See `reports/Onchain primitives for agent markets.md`.

## Decision

Build a minimal settlement kernel plus a resolver standard as an open protocol. Discovery, curation and front-ends are separate layers that anyone can replace. We may build reference versions, but the kernel must never depend on them.

## Consequences

- Success means third parties writing resolvers and opening markets, not our own volume.
- We never pay for volume.
- What we're building that's genuinely new is the layer that makes creator-written resolvers discoverable, trustworthy and liquid for agents.
