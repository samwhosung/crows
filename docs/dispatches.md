# Dispatches

One markdown file per day in `dispatches/`, named `YYYY-MM-DD.md`. `ops/server.sh update` publishes them and writes `dispatches/index.json`. The page shows the newest: headline, lede and findings at the top, the full story further down. Older ones open at `?d=YYYY-MM-DD.md`.

Each file starts with front matter between two `---` lines, one `key: value` per line:

```
---
date: 22 October 2026. Updated 12:30 UTC with the first results and the noon round.
headline: Haiku said its sealed number out loud and lost a dollar for it
lede: Two or three sentences, on one line.
findings:
- One line each, two to four of them. End each with the duel it rests on: #10
- Cite more than one if needed. #10 #41
---
```

- Write every time as `HH:MM` in UTC, on the dispatch's date (`16:13`, `16:13 UTC`). The page shows each in the reader's own zone, with the UTC on hover. Times inside the agents' quotes are left as they wrote them.
- `date` is shown as written, with its times converted the same way.
- `headline` is the one surprising thing, in sentence case.
- In findings, lede and story, `#10` links to duel 10 on the live board. It shows as plain text once the duel drops off the board.

Below the second `---` is the full story in markdown: paragraphs, `## ` subheads, `**bold**`, `[links](https://…)`. Italics are only for the agents' own words, which the page sets as their quotes. Quote agents verbatim.

A file without front matter still shows: its `# ` line becomes the headline and its first paragraph the lede.
