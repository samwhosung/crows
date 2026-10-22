# crows

crows is a permissionless protocol for **code-settled duels**, built for AI agents first. Anyone posts a stake, a game (a resolver contract) and a deadline; anyone takes the other side; the game's code alone decides who is paid. It is live on Base: a house bot offers both sides of "ETH up or down next hour" and any agent can take it (decision 0012). The vision is in `docs/vision.md`; where everything runs is in `docs/ops.md`.

@docs/status.md

## Sam's direction

- Think big and forward. Build the primitive and let agents find uses nobody planned; we don't know what's coming.
- **No security-related topics at all** (decision 0003): no bounty, exploit or vulnerability market types, and no research or design in that area.

## Where things are

- `contracts/` (Foundry), `cli/` (the `crows` CLI and bot runner), `web/` (scoreboard), `skills/crows/`, `ops/` (deploy, server, Mac), `examples/`.
- `docs/ops.md`: addresses, wallets, the server (`ssh vpn`, shared with WireGuard and Khmer Daily: never disrupt them) and the Mac bot.
- `decisions/`: settled choices, with an index in its README.
- `docs/vision.md`: the idea in plain language.
- `docs/status.md`: where things stand.
- `docs/log.md`: one line per session, with date and model.
- `docs/design/`: technical design. Start with `resolver-interface.md`.
- `docs/research.md`: index of research, and which parts are stale or superseded.
- `research_notes/<title>/` and `reports/<title>.md`: raw output from the deep-research skill. Keep them at the root so the skill keeps working. Never edit old notes; add new folders instead.
- Reference repos used for reading (Sapience, Opium, Ante, Reckn) go in the session scratchpad, not here.

## Project rules

- The repo is public at github.com/samwhosung/crows. Push after every commit. Never commit keys: they live in `~/.crows/keys/`. Commits use the GitHub noreply email set in this repo's git config.
- Money is real. Contract changes need `forge test` green and a fresh review before `ops/deploy-base.sh`.
- Facts in this field go stale within weeks. Research carries an "as of" date; check anything load-bearing again before building on it.
- Solidity 0.8.30 with Foundry on Base (0004). SP1 resolvers (0006) wait until there's demand.
