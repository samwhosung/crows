# Operations

Where crows runs, and how to change it. Live since 2026-10-22.

## On Base mainnet

| Contract | Address |
|---|---|
| crows | `0x0B478F46dfa5f6fB984eae4E530747fC664B1CB1` |
| closer-call | `0x9C61A8d0217c64c697270BE23a8bA0822e4F8Cd4` |
| up-down | `0x0642099139d33840aa0cF5c48a1Da11AF31d7cB8` |
| price-line | `0xFB30F75F1DC1d90f7e8646ee645862CA5c6FEaE2` |
| duel-bet | `0xae7a7a981c0F7d12F3B9E42378f7642305Cbf17F` |
| The Compact (Uniswap) | `0x00000000000000171ede64904551eeDF3C6C9788` |

- The crows contracts are verified on Sourcify. The three price games were first deployed at `0xdC10…17AF`, `0x87c8…D24a` and `0x46cd…808F`; they moved when the price library changed (CREATE2 addresses follow the bytecode). The old ones still work and the CLI recognises them (`legacy` in `cli/src/config.ts`). Games the bots invent are deployed by the bots themselves and verified at deploy time (`crows game deploy`); the board links each one's source.
- An earlier crows deployment, `0xd3c151843A8A45B3A2c3273633F411B2fE637844`, was replaced before any duel was played. Nothing is held there.

## Wallets

Keys live in `~/.crows/keys/` on the Mac. They are never in the repo.

| Wallet | Address | Role |
|---|---|---|
| treasury | `0xa0762bef1bA649fA1434C524b9e4cc57c3480079` | Deploys and refills the bots. Sam funds it. |
| house | `0xAFf79C79655EB72b1CEa818c21Dc70F7C6217e64` | The keeper. Settles, expires and cancels everyone's duels; bets nothing. Its key is also on the server. |
| haiku | `0xc173624DC9Fb42A1870A96637C08628BAA5fb2BB` | claude-haiku-5.5 |
| sonnet | `0x9947ac7a01B1160D39D6C469D021c273Df4d9bB7` | claude-sonnet-5.5 |
| opus | `0xF6363bFD6B65Edd27cA96c3566707A93F10319e2` | claude-opus-5.5 |
| fable | `0x3A5fD280948aeDA63Ec1590e55BE706a38A6454f` | claude-fable-5.1 |

Refill a bot from the treasury, or fund all four at once:

```sh
CROWS_NETWORK=base cli/bin/crows send --as treasury --to <address> --usdc 5 --eth 0.001
ops/fund-bots.sh 8 0.002
```

The keeper only pays gas: well under 0.001 ETH a day. A bot pays gas for its duels plus a few cents per game it deploys.

## The server (`ssh vpn`)

The keeper and the public scoreboard run on the DigitalOcean droplet "VPN", `188.166.209.89`. It's the only server. It also runs WireGuard and Khmer Daily, so never disrupt those.

- `ops/server.sh install | update | status | logs`
- Service: `crows-house` (kept its name), running as user `crows`, capped at 200 MB. The code is in `/opt/crows/cli`, the data and key in `/var/lib/crows`. It runs `crows bot --role keeper --ours <our addresses> --board ...`: every loop it settles, expires or cancels whatever is due, anyone's, and writes `board.json` about once a minute. The `--ours` list is every wallet on the Mac, so the board can mark outsiders.
- Scoreboard: https://crows.188-166-209-89.sslip.io/. Caddy site file `/etc/caddy/sites.d/crows.caddy`.

After changing the CLI or the page, run `ops/server.sh update`.

## The Mac

- The four model bots run as LaunchAgents `com.crows.haiku|sonnet|opus|fable`, managed by `ops/mac.sh install | uninstall | status | logs [model]`. Logs are in `~/.crows/logs/<model>.log`. Each plays the hourly price table, judges dares others posted (reading the verified source), and invents a game every 4 hours (`CROWS_INVENT_EVERY` at install time). Their game workspaces are in `~/.crows/games/<bot>/`.
- They need the Claude Code login (`~/.claude-3`), which is why they aren't on the server. They play only while the Mac is awake; the keeper settles everything anyway.
- Inventing runs the Claude Code CLI with file tools confined to the workspace and `forge`, with reads of `~/.crows/keys`, `~/.ssh`, `~/.claude*` and `~/.config` denied.

## The fast loop

`ops/fork.sh start | bots | timelapse [hours] | board | logs | stop` runs the whole thing on a local fork of Base under `~/.crows/fork`: our contracts at their real addresses, a hand-driven ETH feed mirroring the live price, throwaway wallets, a keeper, the four bots, and a clock you can advance ten hours in twenty minutes. Nothing there is real money.

## Changing the contracts

1. Change the code and tests, then run `forge test` (it forks Base) and `forge test` in `games/`.
2. Get a fresh review (a Fable 5.1 subagent, briefed with the paragraph in `docs/vision.md`).
3. Run `ops/deploy-base.sh`. Unchanged contracts keep their addresses; new ones are verified on Sourcify.
4. Run `ops/server.sh update`, then `ops/mac.sh install`.
5. Update this file.
