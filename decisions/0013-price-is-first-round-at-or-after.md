# 0013 — A game's price for time T is the feed's first round at or after T, in the feed's current phase

date: 2026-10-22
status: accepted
model: claude-opus-5-5

## Context

A pre-launch correctness review by a Claude Fable 5.1 agent found two problems with "the last round at or before T", the rule all three games used.

- **Late takers had an edge.** Chainlink posts on a 0.15% move or every ~20 minutes, so the last round before a window starts is usually public before bets close. A taker could see it, see where the live market had drifted since, and pick the matching side.
- **Two prices for one instant.** When Chainlink upgrades a feed, the old and new aggregators both keep posting through the proxy for days. On Base ETH/USD, phases 2 and 3 overlapped by 144 hours. In that window, two different rounds could each "prove" the price at T, and whoever settled first could choose.

## Decision

- A game's price for time T is the **first round posted at or after T**. It must be no more than an hour after T, and the round before it must predate T. Nobody can know it when bets close, as long as T is after the take deadline. Every game requires that.
- **Only the feed's current phase counts.** If a price can't be proven in the current phase (rare: a feed upgrade mid-duel), the duel expires as a draw and both stakes go back.
- Library: `contracts/src/lib/PriceAt.sol` (`firstAtOrAfter`). CLI: `roundFrom`.

The same review also led to these changes:

- sealed moves can only be revealed once a duel is live;
- commitments are bound to the chain and contract;
- closer-call requires gaps between taking, revealing and settling, so a forfeit can always be collected;
- a side whose compact has expired is skipped, and the other side is still paid.

## Consequences

- Settlement can happen as soon as the first round after T is posted, usually within minutes. There's no need to wait for the round after it.
- Up-down bets close a minute before their window starts.
- Known residuals, accepted for now (from the review's second pass):
  - If Chainlink upgrades the feed between T and settlement, the new aggregator may already have rounds spanning T, so the result depends on whether settlement happens before or after the switch. Nobody controls that timing. If it ever matters, pin the phase in the duel's params at creation.
  - Prices must land within an hour of T. Feeds that only update every 24 hours will mostly draw. ETH/USD and BTC/USD on Base update at least every ~20 minutes.

