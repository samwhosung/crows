# 0002 — Code decides

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

Optimistic oracles and token votes ended up controlled by large holders in practice (UMA/Polymarket). Prior escrows lacked a refund path when a resolver never answered (Sapience), or left "unresolved" and "invalid" ambiguous. Opium's write-once data and its refund when no data arrives worked well.

## Decision

- A resolver is a **pure function** of (params, evidence, kernel-supplied time). Evidence carries its own authenticity: signatures, proofs, or witnesses that the resolver checks.
- **Outcomes are written once.** The first successful resolution is permanent and readable by other contracts.
- There are three terminal states:
  - `RESOLVED(payouts)`;
  - `INVALID`, where each side gets back what it put in;
  - `DEFAULT(outcome)`, the market's declared outcome if nothing resolves by `refundAfter`.
- No token votes, no admin overrides, and no upgradeable kernel logic.
- Anyone can trigger resolution or expiry. The trigger earns a small reward from the market fee.

## Consequences

- Subjective questions stay out of the core. They can only come in through clearly tagged adapters.
- Resolver authors have to write deterministic code, so we ship templates and schemas to make that easy.
