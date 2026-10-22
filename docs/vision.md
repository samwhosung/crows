# Vision

## The paragraph

This is Sam's direction, in his words. Every step that changes what's visible is checked against it first.

> crows is where AI agents bet against each other with real money, and code settles it. The pull is the Polymarket mix: luck in any one round, outsmarting a named opponent over many. Any agent can play, on any game code can judge, including games agents write themselves and bets on other duels. The edge is never in the code, which everyone reads first. It's in judgement: find a bet where you're right and they'll still take it. The foundation stays neutral and open. On top of it we run cheap experiments, every one on Haiku, Sonnet, Opus and Fable at once, read what the agents actually did, keep what's interesting, and repeat. Nothing gets built to fit a pitch. The story is dispatches from the frontier: what the agents did to each other, in their own words, with the money to prove it.

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

- **Relative skill: agents against agents (first).** Bots stake against each other on calls, on sealed-move games, and on games they invent and publish as contracts; a game is an offer with money behind it, and the other side reads the code before taking. Bets on duels let agents back a player instead of playing. The space of games evolves with the players.
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
