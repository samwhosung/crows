# Operations

Where crows runs, and how to change it. Live since 2026-10-22.

## On Base mainnet

| Contract | Address |
|---|---|
| crows | `0x0B478F46dfa5f6fB984eae4E530747fC664B1CB1` |
| closer-call | `0xdC10f40032a33aEF573456eab56EA9bbde4417AF` |
| up-down | `0x87c8B7DCaA8CEdDf9bF1740df5D58f551425D24a` |
| price-line | `0x46cd02a4f5aCCB57E26793D4ee19c271Da72808F` |
| The Compact (Uniswap) | `0x00000000000000171ede64904551eeDF3C6C9788` |

- All four crows contracts are verified on Sourcify.
- An earlier crows deployment, `0xd3c151843A8A45B3A2c3273633F411B2fE637844`, was replaced before any duel was played. Nothing is held there.

## Wallets

Keys live in `~/.crows/keys/` on the Mac. They are never in the repo.

| Wallet | Address | Role |
|---|---|---|
| treasury | `0xa0762bef1bA649fA1434C524b9e4cc57c3480079` | Deploys and refills the bots. Sam funds it. |
| house | `0xAFf79C79655EB72b1CEa818c21Dc70F7C6217e64` | The house bot. Its key is also on the server. |
| opus | `0xF6363bFD6B65Edd27cA96c3566707A93F10319e2` | The Claude Opus bot. |

Refill a bot from the treasury:

```sh
CROWS_NETWORK=base cli/bin/crows send --as treasury --to <address> --usdc 5 --eth 0.002
```

## The server (`ssh vpn`)

The house bot and the public scoreboard run on the DigitalOcean droplet "VPN", `188.166.209.89`. It's the only server. It also runs WireGuard and Khmer Daily, so never disrupt those.

- `ops/server.sh install | update | status | logs`
- Service: `crows-house`, running as user `crows`, capped at 200 MB. The code is in `/opt/crows/cli`, the data and keys in `/var/lib/crows`.
- Scoreboard: https://crows.188-166-209-89.sslip.io/. Caddy site file `/etc/caddy/sites.d/crows.caddy`. The house writes `board.json` there about once a minute.
- The house is also the keeper: every loop it settles, expires or cancels whatever is due, anyone's.

After changing the CLI or the page, run `ops/server.sh update`.

## The Mac

- The Opus bot runs as the LaunchAgent `com.crows.opus`, managed by `ops/mac.sh install | uninstall | status | logs`. Its log is `~/.crows/logs/opus.log`.
- It needs the Claude Code login, which is why it isn't on the server. It plays only while the Mac is awake.

## Changing the contracts

1. Change the code and tests, then run `forge test`.
2. Run `ops/deploy-base.sh`. Unchanged contracts keep their addresses.
3. Set the bots' names on the new contract (`crows name ...`).
4. Run `ops/server.sh update`, then `ops/mac.sh install`.
5. Update this file.
