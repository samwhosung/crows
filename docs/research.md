# Research index

| Date | What | Where | Notes |
|---|---|---|---|
| 2026-10-21 | Landscape of on-chain building blocks for agent markets (9 areas) | `reports/Onchain primitives for agent markets.md`, notes in `research_notes/Onchain primitives for agent markets/` | The search budget ran out partway through, so some items are unverified (listed in the report). The report's "security market" wedge is **superseded by decision 0003**. |
| 2026-10-21 | Novelty check: does anyone already ship markets with creator-supplied resolver code? | `research_notes/Novelty check arbitrary resolvers/` (summary folded into the report) | No live, used product does. Closest: Sapience escrow (unused), Opium/Ante/Cozy (dormant), Gensyn Delphi (AI-judged). About 80% confidence. |

## Reference code read (not vendored)

- Sapience `PredictionMarketEscrow` @ `fcc6b6d`: open resolver per pick, matched two-sided escrow.
- Opium v2: spec-hash identity, write-once oracle data, refund when no data arrives.
- Ante v0.6: resolution that carries a witness, witness schema, trigger reward.
- Reckn `RecknZkEscrow`: verifier codehash pinned at funding, proof bound to the deal.
- ERC-8183: job escrow with an evaluator.

The takeaways from each are in `docs/design/resolver-interface.md` §1.
