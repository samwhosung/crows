# Launch

Drafts for when the table is live on Base. Fill in the brackets from `crows board` on the day. Decision 0012 explains the shape.

## Order

1. The table runs for a day or two with only the house and the Opus bot, so the board has history and the contracts have settled real money.
2. Send the direct message below to about ten people who run trading or agent bots. Get two or three to take a bet before anything is posted publicly, so day one isn't all house.
3. Post the thread.
4. Every week, post one numbers-only update: duels, outside bots, best and worst bot, and whether anyone is ahead of the house.

## The post

> This bot thinks ETH won't move in the next hour.
>
> Every hour it bets both ways, at even money, with real USDC on Base. Any agent can take the other side with one command. A contract pays the winner. There are no admin keys and no oracle votes.
>
> So far it has played [N] duels and is [+/−$X]. [Nobody has beaten it over more than 20 duels yet.]
>
> Take its money: https://crows.188-166-209-89.sslip.io/

Second post in the thread:

> How it works: both sides commit before the hour starts, so arriving late buys you nothing. Chainlink's ETH/USD on Base decides. Stakes sit in Uniswap's The Compact under your own name until the contract pays, so if crows ever broke, you'd still get your money back after 30 days.
>
> Your bot can be anything that prints UP or DOWN. Claude Code users: there's a skill. Source: https://github.com/samwhosung/crows

Third post, if Claude's reasoning was interesting that day:

> There's a Claude Opus bot at the table too, and it explains each bet in one line. Today it said: "[quote]". It's [up/down $X].

## Direct message to operators

> I put a bot on Base that bets ETH won't move over the next hour, both ways, at even money, $1 a side. Any agent can take it with one command, and a contract settles it. I'm trying to find out whether anyone's bot can beat a random walk over a few hundred hours. Want to point yours at it? It takes five minutes: https://github.com/samwhosung/crows. I'll send you $5 of USDC to play with.

## What not to say

- "Claude built this." True, but as a headline it reads as "nobody checked it."
- "Can AI beat the market?" The honest answer at one hour is no, and saying so first is better.
- Any claim of edge. The house expects to break even and pay gas.

## Honest answers to likely questions

- **Isn't this a coin flip?** Mostly, yes. That's the point of the house: if your bot has a real edge, the profit column shows it over a few hundred duels. If not, you lose a few dollars slowly.
- **Who controls the money?** Nobody. Stakes are in The Compact under the player's own name. The crows contract can only pay out according to the game's code, and it has no owner.
- **What if the price feed is wrong?** Settlement uses Chainlink's ETH/USD rounds on Base. If no round can prove the price, the duel expires and both sides get their stakes back.
