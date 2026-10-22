# 0015 — Agents against agents: four models invent games and judge each other's, the house becomes the keeper, and work runs in cycles with checkpoints

date: 2026-10-22
status: accepted
model: claude-fable-5-1

## Context

0012 launched "take the house's money": a house bot with no view posting both sides of ETH up-or-down at even money, one Claude bot taking it. Sam's reaction on seeing it live: "the most boring thing ever". He was right. The plan agreed before building (recorded in 0011) was bot against named bot, with the Polymarket mix of luck and outsmarting an opponent. The house replaced the opponent with a vending machine. It happened because the build was run as one long unsupervised session: the launch post was written first, the house was built to make the post true, and nothing ever re-read the plan.

The pieces underneath are sound and stay: crows on The Compact, pinned resolver code, sealed moves, on-chain notes, the CLI and skill, Base mainnet.

## Decision

1. **The paragraph at the top of `docs/vision.md` is the law.** Before any step that changes what's visible, it is re-read, and the step has to serve it in one line. A step that can't is not taken.
2. **Agents against agents.** The house no longer posts or takes bets. The `crows-house` service becomes the keeper: it settles, expires and cancels everyone's duels and writes the board. The players are four Claude models, Haiku, Sonnet, Opus and Fable, each with its own wallet and name, each able to play the price games, judge games others invented (reading the verified source first), invent games of its own, and bet on other duels. Every experiment runs on all four at once.
3. **Games anyone can write.** `games/` is a Foundry kit with the rules a game must follow, two examples and offline test helpers. `crows game init | deploy | show` and `crows challenge <address>` let any agent publish a game and dare others; deploying verifies the source on Sourcify so takers can read it. `DuelBet` is a reference game for bets on other duels.
4. **Work runs in cycles.** One experiment, one question, a few hours to a day. The fast loop is a local fork of Base with the clock fast-forwarded; the real loop is Base mainnet with stakes of a dollar or two. At each boundary Sam gets five lines (tried, happened, next) and says go or no. Nothing between boundaries needs him except money.
5. **Experiments come from four sources**: what the table shows, formats stolen from fields that already found what's fun, what people say on the internet, and many candidates with a hard filter. Not from asking a model to be creative cold.
6. **Outsiders are tracked.** Any address that isn't ours, any game we didn't deploy, any bet on our duels. The first outsider action is a same-day checkpoint. This replaces 0012's "used" test as the measure.
7. **Nothing gets built to fit a pitch.** Writing about crows reports what the agents did, in their words, with the money to prove it.

## Consequences

- 0012 is superseded. `UpDown`, `CloserCall` and `PriceLine` stay as games anyone may play; the house's hourly posting stops.
- The scoreboard shows games, pitches and the model-against-model record, and marks outsiders.
- Four bots on the Mac need the Claude Code login and about 10 USDC each. Sam funds the treasury when asked at a boundary.
- The repo stays public. Keys stay in `~/.crows/keys/`.
