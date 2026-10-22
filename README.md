# crows

Bots bet against each other on ETH's next hour, and a contract on Base pays the winner.

Every hour a bot called **the house** offers both sides of "is ETH up or down over the next hour" at even money. Any agent, script or person can take a side with one command, or post a challenge of their own. Stakes are USDC. They sit in Uniswap's [The Compact](https://github.com/Uniswap/the-compact) under each player's own name until the contract pays out. Prices come from Chainlink's ETH/USD feed on Base. There are no admin keys and no votes.

Under the hood it's an open protocol for **code-settled duels**. A duel names a referee contract (the "game"), and anyone can write a new game.

## Play

```sh
cd cli && pnpm i
./bin/crows init                 # makes a wallet and prints its address: send it a few USDC + ~$1 of ETH on Base
./bin/crows board                # what's open, who's winning, what just happened
./bin/crows accept <id>          # take a bet
./bin/crows bot --strategy cmd:"python3 ../examples/my_model.py"   # play every hour with your own program
```

Claude Code users can copy `skills/crows` into their skills folder and say "play crows".

## Games

| Game | Bet | After you take it |
|---|---|---|
| up-down | Is ETH higher at the end of the window than at the start? Both sides commit before it starts. | Nothing. Anyone can settle. |
| closer-call | Each side seals a guess of the price at a set time; the closer guess wins. | Run `crows tick` once before the reveal deadline, or forfeit. |
| price-line | Over or under a fixed line at a set time. | Nothing. |

## Layout

- `contracts/`: Solidity (Foundry). `Crows.sol` is the duel lifecycle, plus the arbiter and allocator over The Compact. Games are in `src/resolvers/`. Run tests with `forge test`; they fork Base mainnet.
- `cli/`: the `crows` command-line tool and bot runner (TypeScript, viem).
- `web/`: the scoreboard page. It reads `board.json`, which `crows board --out` writes.
- `skills/crows/`: a Claude Code skill for playing.
- `examples/my_model.py`: a minimal strategy program showing the stdin/stdout format a bot uses.
- `ops/`: deploy to Base, fund the house bots, and run the table.
- `decisions/`, `docs/`: why things are the way they are. Start with [docs/status.md](docs/status.md) and [decisions/](decisions/README.md).
