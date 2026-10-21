# 0008 — The core depends on nothing; integrations are adapters

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

During 2026 several things people composed with went away or were paused: Redstone, Kailua, Truebit, Stylus activations, Chainlink Functions. The ERC-8004 registries are upgradeable by a single key.

## Decision

The kernel depends only on the collateral token and on verifier contracts called through resolvers. Everything else is an adapter:

- **Outward:**
  - `IConditionResolver` (Sapience), so our markets can be picks in their parlays;
  - Gnosis CTF `reportPayouts`;
  - ERC-8183 evaluator;
  - later, ERC-7683 orders, x402 discovery and an MCP server.
- **Inward:** wrappers around external oracles, tagged as "imported trust" and never counted as code-resolved.

## Consequences

- If an ecosystem dependency dies, only an adapter breaks, never settlement.
- A little more code to maintain, in exchange for a kernel that can be frozen.
