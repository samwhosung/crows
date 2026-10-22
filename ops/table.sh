#!/bin/sh
# Run the house table: the house bot, the Claude Opus bot, and the scoreboard data writer.
# Usage: ops/table.sh start | stop | status | logs      (CROWS_NETWORK defaults to base)
# A caffeinate process keeps the Mac awake while the house runs. Logs: ~/.crows/logs/
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
C="$ROOT/cli/bin/crows"
LOGS="$HOME/.crows/logs"
mkdir -p "$LOGS"
export CROWS_NETWORK="${CROWS_NETWORK:-base}"
# Patterns include the network so other bots on this machine (e.g. local tests) are never matched.
HOUSE="src/main.ts bot --network $CROWS_NETWORK --as house"
OPUS="src/main.ts bot --network $CROWS_NETWORK --as opus"
BOARD="ops/board-loop.sh"

running() { pgrep -f "$1" >/dev/null 2>&1; }

case "${1:-status}" in
  start)
    running "$HOUSE" || { nohup "$C" bot --network "$CROWS_NETWORK" --as house --role house --stake 1 --max 12 >>"$LOGS/house.log" 2>&1 & echo "started house"; }
    running "$OPUS" || { nohup "$C" bot --network "$CROWS_NETWORK" --as opus --strategy claude:opus --stake 1 --max 8 >>"$LOGS/opus.log" 2>&1 & echo "started opus"; }
    running "$BOARD" || { nohup "$ROOT/ops/board-loop.sh" >>"$LOGS/board.log" 2>&1 & echo "started board"; }
    sleep 3
    hp=$(pgrep -f "$HOUSE" | head -1)
    [ -n "$hp" ] && ! running "caffeinate -i -w $hp" && { nohup caffeinate -i -w "$hp" >/dev/null 2>&1 & echo "keeping the Mac awake while the house runs"; }
    ;;
  stop)
    pkill -f "$HOUSE" || true; pkill -f "$OPUS" || true; pkill -f "$BOARD" || true
    echo stopped
    ;;
  status)
    for p in "$HOUSE" "$OPUS" "$BOARD"; do running "$p" && echo "running: $p" || echo "stopped: $p"; done
    ;;
  logs)
    tail -n 20 "$LOGS"/house.log "$LOGS"/opus.log 2>/dev/null
    ;;
  *) echo "usage: ops/table.sh start|stop|status|logs"; exit 1 ;;
esac
