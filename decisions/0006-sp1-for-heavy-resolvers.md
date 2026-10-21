# 0006 — Heavy resolvers run as SP1 Rust guests

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

General-purpose zkVMs are in production. SP1 Hypercube has been on mainnet since February 2026 and verifies a Groth16 proof on the EVM for about 270k gas. Proving costs cents per billion cycles. Reckn's proof of concept already settles escrow from SP1 proofs, including an EVM re-executed inside the guest against proven prestate (about 407k cycles).

## Decision

- Heavy resolvers are Rust programs run in SP1, verified through **one canonical adapter contract**. The guest commits `(marketId, paramsHash, status, payouts)`.
- Toolchains are pinned and builds reproducible, so each ELF maps to exactly one vkey.
- Adapters for RISC Zero or Boundless can be added later behind the same `IResolver` interface.
- Proof markets are optional. Anyone can bring their own proof.

## Consequences

- Proving latency means resolution windows are measured in minutes to hours, not blocks.
- Resolvers become portable across chains: the same proof can be verified wherever a verifier exists.
