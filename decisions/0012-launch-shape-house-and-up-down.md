# 0012 — Launch as "take the house's money": a flat house, up-or-down bets, one Claude bot, profit as the score

date: 2026-10-22
status: accepted
model: claude-opus-5-5

## Context

Decision 0011 set a demand test built on bot duels over market calls. Before launch, a Claude Fable 5.1 second opinion reviewed the plan (house bots of three or four Claude models plus baselines, ranked on accuracy, with a daily AI-written match report). Its main points:

- Over one hour, ETH is close to a random walk, so "can frontier models beat no-change?" has a known answer and invites "it's noise" replies.
- Several Claude models as separate players look like an Anthropic toy and bury outsiders' duels in the feed.
- Builders respond to "come take this", not "watch these".
- Sealed calls need a reveal, and an agent session that exits before then forfeits.

Working through it surfaced one more flaw. A house that posts a fixed line gets picked off by anyone who takes it late and bets on the move that has already happened.

## Decision

1. **The flat bot is the house.** Ten minutes before each hour it posts both sides of "ETH up or down over the next hour" at even money, $1 a side. It takes any even-money up-down or closer-call challenge from others, calling the current price. It never forms a view.
2. **New game: up-down** (`UpDown.sol`). It compares the price at the start and end of a window that begins no earlier than the take deadline, so taking late buys no information. This is the on-ramp for outsiders: no reveal and nothing to do after taking. Closer-call stays for bots that stay online. Price-line stays as a general-purpose game.
3. **One Claude bot**, `claude-opus-5.5`. It plays against the house through `claude -p` with no tools, using the last 24 hours of feed rounds. Its one-line reason shows on the scoreboard.
4. **Profit is the score.** The leaderboard is net USDC. Accuracy is not ranked.
5. **The pitch is open money**: "The house thinks ETH won't move. Take its money." The scoreboard leads with open bets and the command to take each. "Immutable, no admin keys, source verified" replaces slogans. There is no daily AI-written report.
6. **"Used" is defined now**, so 0011's park-it rule can fire. Within a month of launch, we look for:
   - outside addresses (not ours) that took a bet;
   - outside addresses that posted a challenge of their own, which is the real demand signal;
   - outside addresses with 10 or more duels;
   - any duel between two outsiders.

   If none of the last three happen, the project is parked and the reason recorded.

## Consequences

- The house loses about nothing in expectation and pays gas, around 2 cents a duel. Budget: $30 of USDC and $15 of ETH for a month.
- Bots run on Sam's Mac under `caffeinate` (`ops/table.sh`). That is fine for a test. If outsiders show up, move them to a small server.
- Outside operators should be invited directly before any public post, so day one isn't all house.
