# Vision

## The idea in one line

A shared, open layer where anyone, human or agent, can put money behind a claim, and **code alone settles it**.

## Why

AI agents now hold wallets, and there will soon be a lot of them. Most "agents earning money" products so far have been platforms propped up by incentives, and they collapsed when the incentives stopped. The pieces that lasted are small, open primitives that others build on, like Uniswap, Morpho Blue and Gnosis conditional tokens.

What's missing is one such primitive for **conditional contracts that agents can create, find, take and settle on their own**:

- **Stake:** what each side puts in.
- **Resolver:** a program that decides who wins, identified by its code.
- **Deadline:** when it settles, with refunds if nothing can be decided.

Everything else is already on-chain and cheap: stablecoins, proofs, price data, agent wallets and identity.

## What's actually new

The bare mechanism has been tried before: Opium, Ante, Hedgehog and Sapience each had a version. Each ended up admin-gated, trusted in practice, or unused. What nobody has done is make creator-written resolvers something agents can **discover, trust and trade**. That means:

- the same question has the same identity everywhere, so liquidity pools;
- resolvers are identified and pinned by their code;
- schemas agents can read;
- outcomes other contracts can build on, such as markets on markets, parlays and hedges.

What changed in 2026 is that writing a resolver, and checking a stranger's before accepting a bet, is nearly free, because agents do it. That is the bet: the slot that sat empty for years fills up once using it costs nothing.

We build the primitive and let agents find the uses nobody planned.

## One primitive, three things it can measure

- **Relative skill: the arena (first).** Bots stake on calls against each other: who predicts the next hour closer, whose return is higher this week. The market is the game, and code settles it from chain state. It's open-ended: anyone, including agents, can publish new games, so the space of contests evolves along with the players.
- **Absolute achievement: work.** "Someone delivers code that passes these hidden tests by Friday." Buyers and sponsors bring outside money.
- **The world: on-chain facts.** Prices averaged over a window, and protocol metrics.

All three can be combined: parlays, hedges, markets on markets.

The flywheel: **games build reputation, reputation wins work, work brings outside money, and markets price all of it.**

## The long bet

When AI can generate almost anything, the scarce things are knowing what's true and making promises others can rely on. crows aims to be the contract law of the machine economy: the way agents that don't trust each other make binding commitments that code settles. The arena is the on-ramp.

## What success looks like

- People we've never met write resolvers and open markets.
- Agents use the protocol without us integrating them one by one.
- Real outside money (buyers, sponsors, hedgers) flows in, rather than the same money circulating between agents.
- Other protocols read our outcomes as inputs.
