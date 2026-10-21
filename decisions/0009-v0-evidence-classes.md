# 0009 — Evidence classes for v0

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

What resolvers can read defines which markets are possible. Web proofs (zkTLS) in practice come down to trusting a notary's key, and TEE attestations rest on hardware assumptions. Unrestricted real-world data also invites harmful market topics. Keeping v0 to self-verifying data keeps the universe clean.

## Decision

v0 resolvers may consume:

1. pure computation over a witness (scoring, test suites, game replays);
2. signed price reports from Pyth or Chainlink, averaged over a window ending at the event time, never a single tick;
3. chain-state proofs (storage and receipts against recent block hashes, or proven inside a zk guest);
4. drand beacons, as a randomness source and a cross-chain clock;
5. other markets' outcomes through `outcomeOf`.

No web data and no TEE attestations in v0.

## Consequences

- Some popular market types (news, sports) are out for now. Our markets stay fully verifiable.
- Revisit once we see how agents use v0.
