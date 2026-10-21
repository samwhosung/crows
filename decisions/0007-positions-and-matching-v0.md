# 0007 — Positions and matching in v0

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

Sapience's accounting gives each side claims equal to the total stake. That builds the odds into the token amounts and keeps positions fungible. Polymarket's off-chain matching with later settlement led to large numbers of reverted settlements. An ERC-20 pair per market is expensive; ERC-6909 keeps every position inside one contract.

## Decision

- Positions are ERC-6909 ids `(marketId, outcome)` held in the kernel, using Sapience-style odds-in-amount accounting.
- **Matching is escrow-first.** Two EIP-712 signed orders (EOA, ERC-1271 or session key) are matched in one transaction that pulls both stakes or reverts.
- Two holders can agree to exit early. Redemption is pull-based.
- v0 is binary, but the interface supports N outcomes. Sealed or batch matching comes later.

## Consequences

- Settlement can't fail halfway, because both stakes are locked when the match happens.
- The first-come matching race is accepted for v0 and revisited when batch matching lands.
