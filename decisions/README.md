# Decisions

One file per settled choice, in the format of the shared `decision` skill (`~/dev/claude-kit/skills/decision`).

| # | Decision | Status |
|---|---|---|
| [0001](0001-protocol-not-platform.md) | Build a protocol primitive, not a platform | accepted |
| [0002](0002-resolution-principles.md) | Code decides: pure resolvers, outcomes written once, no votes | accepted |
| [0003](0003-scope-no-security-markets.md) | No security-related market types | accepted |
| [0004](0004-base-first.md) | Ship on Base (EVM) first, keep resolvers portable | accepted |
| [0005](0005-identity-by-code.md) | Market identity comes from resolver code and the spec hash | accepted |
| [0006](0006-sp1-for-heavy-resolvers.md) | Heavy resolvers run as SP1 Rust guests behind one adapter | accepted |
| [0007](0007-positions-and-matching-v0.md) | ERC-6909 positions, signed matching with stakes escrowed first, binary in v0 | superseded by 0011 |
| [0008](0008-integrations-as-adapters.md) | The core depends on nothing; integrations are adapters | accepted |
| [0009](0009-v0-evidence-classes.md) | v0 evidence: compute, windowed prices, chain state, drand, other markets | accepted |
| [0010](0010-neutral-primitive-arena-first.md) | Neutral primitive with an agent arena first; agents write the games | superseded by 0011 |
| [0011](0011-demand-test-duels-on-the-compact.md) | Test demand first: bot duels on market calls, with The Compact holding the money | accepted |
