#!/bin/sh
# The bots on Sam's Mac: the four models (Haiku, Sonnet, Opus, Fable) and the tourist. They need the Claude Code
# login. Each runs as a LaunchAgent, so it starts at login and restarts if it dies. They only play while the Mac is
# awake; the keeper on the server settles everything anyway.
#
#   ops/mac.sh install [bot...] | uninstall | status | logs [bot]
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
MODELS="haiku sonnet opus fable"
BOTS="$MODELS tourist"
AGENTS="$BOTS sync" # sync copies the bots' verdicts file to the server every minute, so the board can show declines

# What each bot runs. Models invent a game every few hours and judge dares carefully; the tourist takes any dare it
# sees in its last 20 minutes and flips a coin on the hourly table (experiment 2: who farms the tourist?).
args_for() {
  case "$1" in
    tourist) echo "--strategy tourist --hourly --stake 1 --max 6 --max-take 1" ;;
    *) echo "--strategy claude:$1 --hourly --invent ${CROWS_INVENT_EVERY:-4h} --stake 1 --max 10 --max-take 2" ;;
  esac
}
xml_args() { for a in $(args_for "$1"); do printf '    <string>%s</string>\n' "$a"; done; }
LOGS="$HOME/.crows/logs"
NODE_BIN="$(dirname "$(command -v node)")"
CLAUDE_BIN="$(dirname "$(command -v claude)")"
FOUNDRY_BIN="$HOME/.foundry/bin"

label() { echo "com.crows.$1"; }
plist() { echo "$HOME/Library/LaunchAgents/$(label "$1").plist"; }

unload() {
  launchctl bootout "gui/$(id -u)/$(label "$1")" 2>/dev/null || true
  # bootout returns before the old job is gone; loading again too soon fails with "Input/output error".
  i=0; while launchctl print "gui/$(id -u)/$(label "$1")" >/dev/null 2>&1 && [ $i -lt 20 ]; do sleep 0.5; i=$((i+1)); done
}

case "${1:-status}" in
  install)
    mkdir -p "$LOGS" "$HOME/Library/LaunchAgents"
    shift; for m in ${*:-$AGENTS}; do
      if [ "$m" = sync ]; then
        cat > "$(plist sync)" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$(label sync)</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/sh</string><string>-c</string>
    <string>while :; do [ -f "$HOME/.crows/base/verdicts.jsonl" ] &amp;&amp; rsync -az --timeout=20 "$HOME/.crows/base/verdicts.jsonl" vpn:/var/lib/crows/base/verdicts.jsonl; sleep 60; done</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>PATH</key><string>/usr/bin:/bin:/usr/local/bin</string><key>HOME</key><string>$HOME</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>$LOGS/sync.log</string>
  <key>StandardErrorPath</key><string>$LOGS/sync.log</string>
</dict>
</plist>
EOF
        unload sync
        launchctl bootstrap "gui/$(id -u)" "$(plist sync)"
        continue
      fi
      cat > "$(plist "$m")" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$(label "$m")</string>
  <key>ProgramArguments</key>
  <array>
    <string>$ROOT/cli/bin/crows</string>
    <string>bot</string><string>--as</string><string>$m</string>
$(xml_args "$m")
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$NODE_BIN:$CLAUDE_BIN:$FOUNDRY_BIN:/usr/local/bin:/usr/bin:/bin</string>
    <key>HOME</key><string>$HOME</string>
    <key>CROWS_NETWORK</key><string>base</string>
    <key>CLAUDE_CONFIG_DIR</key><string>$HOME/.claude-3</string>
    <key>CLAUDE_CODE_DISABLE_AUTO_MEMORY</key><string>1</string>
  </dict>
  <key>WorkingDirectory</key><string>$ROOT/cli</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOGS/$m.log</string>
  <key>StandardErrorPath</key><string>$LOGS/$m.log</string>
</dict>
</plist>
EOF
      unload "$m"
      launchctl bootstrap "gui/$(id -u)" "$(plist "$m")"
    done
    echo "installed: ${*:-$AGENTS} (logs in $LOGS)"
    ;;
  uninstall)
    for m in $AGENTS; do unload "$m"; rm -f "$(plist "$m")"; done
    echo "removed: $AGENTS"
    ;;
  status)
    for m in $AGENTS; do
      printf '%s: ' "$m"
      launchctl print "gui/$(id -u)/$(label "$m")" 2>/dev/null | grep -E "state =" | head -1 | tr -d '\t' || echo "not loaded"
      tail -n 2 "$LOGS/$m.log" 2>/dev/null | sed 's/^/    /' || true
    done
    ;;
  logs) tail -f "$LOGS/${2:-opus}.log" ;;
  *) echo "usage: ops/mac.sh install [bot...]|uninstall|status|logs [bot]"; exit 1 ;;
esac
