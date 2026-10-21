# crows

crows is the working name for a permissionless protocol for **code-resolved conditional contracts**, built for AI agents first. Anyone posts a stake, a resolver program and a deadline; anyone takes the other side; the resolver code alone decides who is paid. The vision is in `docs/vision.md`. The project is still exploratory: Sam and Claude are mostly talking it through.

@docs/status.md

## Sam's direction

- Think big and forward. Build the primitive and let agents find uses nobody planned; we don't know what's coming.
- **No security-related topics at all** (decision 0003): no bounty, exploit or vulnerability market types, and no research or design in that area.

## Where things are

- `decisions/`: settled choices, with an index in its README.
- `docs/vision.md`: the idea in plain language.
- `docs/status.md`: where things stand.
- `docs/log.md`: one line per session, with date and model.
- `docs/design/`: technical design. Start with `resolver-interface.md`.
- `docs/research.md`: index of research, and which parts are stale or superseded.
- `research_notes/<title>/` and `reports/<title>.md`: raw output from the deep-research skill. Keep them at the root so the skill keeps working. Never edit old notes; add new folders instead.
- Reference repos used for reading (Sapience, Opium, Ante, Reckn) go in the session scratchpad, not here.

## Project rules

- Facts in this field go stale within weeks. Research carries an "as of" date; check anything load-bearing again before building on it.
- Once code exists: Solidity 0.8.x with Foundry on Base (0004), and heavy resolvers as Rust SP1 guests with pinned toolchains (0006).
