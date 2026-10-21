# 0004 — Ship on Base first

date: 2026-10-21
status: accepted
model: claude-opus-5-5

## Context

- **Solana** leads x402 volume and is fast.
- **Base** has the deepest EVM building blocks we want to compose with: The Compact, Morpho, Gnosis CTF, ERC-8183, ERC-8004, the x402 origin ecosystem, and Validity Transactions. It also has mature Solidity and Foundry tooling.
- **Arbitrum Stylus** activations are paused.
- **Ethereum L1** caps each transaction at 16.8M gas and costs too much for small tickets.

## Decision

Build and test v0 on Base (Base Sepolia, then mainnet). Keep resolvers chain-portable by identifying them by code (decision 0005) and running heavy ones as zk guests (decision 0006). Port to Solana later.

## Consequences

- Base has a single sequencer, so deadlines use timestamps with lockout windows, not block numbers.
- Base's place in Superchain interop is uncertain after it left the OP Stack. Don't depend on it.
