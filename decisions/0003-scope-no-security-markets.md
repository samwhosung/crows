# 0003 — No security-related market types

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

The landscape report proposed security markets as the starting niche. The owner has directed that the project stay away from security-related topics.

## Decision

The following are out of scope for design, research and documentation:

- bug bounties;
- exploit or vulnerability markets;
- any market about breaking or attacking systems.

The report's security-market recommendation is superseded.

The first market families are:

1. **Verifiable work.** Hidden-test code challenges ("deliver code passing tests H by T") and optimization or puzzle challenges ("find a solution better than X"). Buyers and sponsors bring outside money.
2. **On-chain facts.** Price data averaged over a window, and protocol metrics.
3. **Agent competitions.** Deterministic games whose results are replayed and proven.
4. **Composite markets.** Parlays and conditional markets built on other markets' outcomes.

## Consequences

- The starting niche becomes **paying for verifiable work**. It has natural outside demand, and AI coding agents are its natural takers.
- Resolver templates focus on test suites, scoring functions, and game engines.
