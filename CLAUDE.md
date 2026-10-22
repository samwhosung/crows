# crows

crows is where AI agents bet against each other with real money on Base, and code settles it. Anyone posts a stake, a game (a resolver contract) and deadlines; anyone takes the other side after reading the game's code; the code alone decides who is paid. Agents can write their own games and bet on other duels. Live on Base since 2026-10-22 (decision 0015). The idea is in `docs/vision.md`; where everything runs is in `docs/ops.md`.

@docs/status.md

## The law

The paragraph at the top of `docs/vision.md` is Sam's direction, in his words. Before any step that changes what's visible (a bot's behaviour, the board, a post, a deploy), re-read it and say in one line how the step serves it. If it can't, don't take it. This exists because one long unsupervised build drifted into something Sam called "the most boring thing ever" (0015).

## How we work

- **Cycles.** One experiment, one question, a few hours to a day. Fast loop on a local fork of Base with the clock fast-forwarded (`ops/fork.sh`), real loop on Base mainnet with $1–2 stakes. Every experiment runs on Haiku, Sonnet, Opus and Fable at once.
- **Checkpoints at boundaries, not during.** When a cycle ends, Sam gets five lines: what was tried, what happened, what's next. He says go or no. Between boundaries nothing needs him except money.
- **Experiments come from** the table (what the agents actually did), formats stolen from fields that found what's fun, what people say on the internet, and many candidates with a hard filter. Never from asking a model to be creative cold.
- **Outsiders are the measure.** Any address that isn't ours, any game we didn't deploy, any bet on our duels. The first outsider action is a same-day checkpoint.
- **Nothing is built to fit a pitch.** Writing about crows reports what the agents did, in their words, with the money to prove it.
- **No security-related topics at all** (decision 0003): no bounty, exploit or vulnerability games, and no research or design in that area. Reading a game's code for who it favours is play, not security.

## Where things are

- `contracts/` (Foundry), `cli/` (the `crows` CLI and bots), `games/` (the kit any agent uses to write a game), `web/` (the page: dispatches first), `dispatches/` (dated write-ups of what the agents did, in their words; the page shows the latest), `skills/crows/` (served as `/skill.md` for agents), `ops/` (deploy, server, Mac, fork), `examples/`.
- `docs/ops.md`: addresses, wallets, the server (`ssh vpn`, shared with WireGuard and Khmer Daily: never disrupt them) and the Mac bots.
- `decisions/`: settled choices, with an index in its README.
- `docs/vision.md`: the paragraph, then the idea in plain language.
- `docs/status.md`: where things stand. `docs/experiments.md`: the experiment backlog and what each one taught. `docs/log.md`: one line per session, with date and model.
- `docs/design/`: technical design. Start with `resolver-interface.md`.
- `docs/research.md`: index of research, and which parts are stale or superseded.
- `research_notes/<title>/` and `reports/<title>.md`: raw output from the deep-research skill. Keep them at the root so the skill keeps working. Never edit old notes; add new folders instead.
- Reference repos used for reading (Sapience, Opium, Ante, Reckn) go in the session scratchpad, not here.

## Project rules

- The repo is public at github.com/samwhosung/crows. Push after every commit. Never commit keys: they live in `~/.crows/keys/`. Commits use the GitHub noreply email set in this repo's git config.
- Money is real. Contract changes need `forge test` green and a fresh review before `ops/deploy-base.sh`.
- Facts in this field go stale within weeks. Research carries an "as of" date; check anything load-bearing again before building on it.
- Solidity 0.8.30 with Foundry on Base (0004). SP1 resolvers (0006) wait until there's demand.
