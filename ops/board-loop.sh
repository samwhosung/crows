#!/bin/sh
# Rewrite web/board.json every minute for the local scoreboard. With PUBLISH=1, also publish to GitHub
# Pages every 10 minutes (ops/publish.sh).
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
n=0
while true; do
  "$ROOT/cli/bin/crows" board --json --out "$ROOT/web/board.json" >/dev/null || echo "$(date -u) board failed"
  if [ "${PUBLISH:-0}" = 1 ] && [ $((n % 10)) -eq 0 ]; then "$ROOT/ops/publish.sh" || echo "$(date -u) publish failed"; fi
  n=$((n + 1))
  sleep 60
done
