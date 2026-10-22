#!/bin/sh
# Rewrite web/board.json every minute for the scoreboard page.
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
while true; do
  "$ROOT/cli/bin/crows" board --json --out "$ROOT/web/board.json" >/dev/null || echo "$(date -u) board failed"
  sleep 60
done
