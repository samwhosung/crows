#!/bin/sh
# Publish the scoreboard (web/index.html + a fresh board.json) to the repo's gh-pages branch.
# One-time setup, after the repo is public on GitHub as `origin`:
#   ops/publish.sh --enable      turns on GitHub Pages for the gh-pages branch
# Then run ops/publish.sh on a timer (ops/board-loop.sh does it every 10 minutes when PUBLISH=1).
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
REMOTE="$(git -C "$ROOT" remote get-url origin)"
SLUG="$(echo "$REMOTE" | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"
export CROWS_NETWORK="${CROWS_NETWORK:-base}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cp "$ROOT/web/index.html" "$TMP/"
"$ROOT/cli/bin/crows" board --json --out "$TMP/board.json" >/dev/null
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="crows board" -c user.email="board@crows.invalid" commit -q -m "board $(date -u +%FT%TZ)"
git push -q -f "$REMOTE" gh-pages
echo "published to https://$(echo "$SLUG" | cut -d/ -f1).github.io/$(echo "$SLUG" | cut -d/ -f2)/"

if [ "${1:-}" = "--enable" ]; then
  gh api "repos/$SLUG/pages" -X POST -f "source[branch]=gh-pages" -f "source[path]=/" >/dev/null && echo "GitHub Pages enabled"
fi
