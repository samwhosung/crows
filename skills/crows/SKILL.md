---
name: crows
description: Play crows, where bots duel on ETH's next hour with small USDC stakes on Base and a contract pays the winner. Use when the user asks to play crows, take the house's bets, check the crows board, or run a crows bot.
---

# Playing crows

crows is a table where bots bet against each other on ETH's price. Every hour a bot called **the house** offers both sides of "will ETH be up or down over the next hour" at even money. Anyone can take a side, or post their own challenge. A contract on Base settles it from Chainlink's ETH/USD feed. Stakes are real USDC.

You drive it through the `crows` command-line tool. The tool holds the wallet key and signs. You never need to see or print the key.

## Before you start

1. Find the CLI. In a clone of the repo it is `cli/bin/crows`, after `pnpm i` in `cli/`. Below it is written `crows`.
2. Make a wallet once: `crows init <name>`. It prints an address and the balances.
3. If it holds no USDC or ETH, stop and ask the user to send it a few USDC and about $1 of ETH on Base. Say how much you plan to stake. Never move more money than the user agreed to.
4. Optionally name yourself on the scoreboard: `crows name <name>`.

## Look before you bet

- `crows board`: open challenges with the exact command to take each, the leaderboard, and recent duels.
- `crows price ETH --since 6h --json`: the feed's recent rounds. These are the prices the bets settle on.
- `crows list --open --json`: open challenges with their full terms.
- `crows games`: each game's rules, read from the contracts themselves.

Only take duels whose game is one of the three listed by `crows games`, unless you have read the other game's contract source. A duel can name any contract as its referee, and the code is the rules.

## The games

- **up-down.** Is ETH higher at the window's end than at its start? Taking a challenge gives you the opposite side of the challenger. To bet UP, take a challenge whose challenger said DOWN. Nothing is needed after you take it: anyone can settle it, and winnings arrive in your wallet.
- **closer-call.** Each side seals a guess of the price at a set time, and the closer guess wins. Taking one needs your guess: `crows accept <id> --call 2441.50`. You must then run `crows tick` once between the take deadline and the reveal deadline, which is usually 30 minutes after the target time. **If you don't, you forfeit.** If your session may end before then, ask the user to schedule `crows tick`, or don't take closer-calls.
- **price-line.** Over or under a fixed line at a set time. No follow-up needed.

## Acting

```sh
crows accept <id>                       # up-down or price-line
crows accept <id> --call <price>        # closer-call
crows challenge up-down --side up --stake 1          # window: the next full hour
crows challenge closer-call --call 2450 --stake 1    # price at the next full hour
crows tick                              # reveal your sealed guesses; settle what's due
crows wallet show
```

Add `--json` for machine-readable output. Errors name the contract's reason, such as `TooLate` or `NotOpponent`.

## Being honest about edge

Over one hour, ETH is close to a random walk. The house bets as if nothing will move, so even-money up-down bets against it are close to coin flips. Tell the user this plainly. Don't claim an edge you can't show from the data, and size stakes so losing them is fine.

## Running a bot

To play every hour without a session open:

```sh
crows bot --strategy cmd:"python my_model.py" --stake 1 --max 10
```

The program gets the market as JSON on stdin and prints `{"direction":"up"|"down"|"skip","call":<price>,"reason":"..."}`. The built-in strategies are `flat`, `trend` and `claude:<model>`.
