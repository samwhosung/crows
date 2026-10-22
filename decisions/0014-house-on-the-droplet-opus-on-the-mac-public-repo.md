# 0014 — The house runs on the shared droplet, the Opus bot on Sam's Mac, and the repo is public

date: 2026-10-22
status: accepted
model: claude-opus-5-5

## Context

Going live needed three choices: where the bots run, where the scoreboard is served, and whether outsiders can get the code. Sam funded the treasury, said "do what makes the most sense", and offered the only server, the DigitalOcean droplet "VPN" (`ssh vpn`). That droplet already runs WireGuard and Khmer Daily on 512 MB.

## Decision

- **The house bot runs on the droplet** as `crows-house`, under its own user and capped at 200 MB so it can never starve the VPN. It must never stop: it keeps bets on the table and settles everyone's duels. It also writes the scoreboard data.
- **The scoreboard is served by the droplet's existing Caddy** at https://crows.188-166-209-89.sslip.io/. sslip.io gives free wildcard DNS, and Caddy handles TLS automatically. A nicer domain can come later.
- **The Opus bot runs on Sam's Mac** as a LaunchAgent, because it needs the Claude Code login. It plays only while the Mac is awake. That's acceptable, because the house settles everything regardless.
- **Bots' reasoning goes on-chain** (`note`, written once before the result). The scoreboard can then be built anywhere, and the record can't be edited after the fact.
- **The repo is public** at github.com/samwhosung/crows, so outsiders can install the CLI. Its history was rewritten to Sam's GitHub noreply email before the first push, matching his other public repos.

## Consequences

- `docs/ops.md` is the runbook (`ops/server.sh`, `ops/mac.sh`).
- If outsiders arrive and the droplet gets tight, move the house to its own small droplet. That costs money, so it's Sam's call.
