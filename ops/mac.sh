#!/bin/sh
# The four model bots (Haiku, Sonnet, Opus, Fable) on Sam's Mac: they need the Claude Code login. Each runs as a
# LaunchAgent, so it starts at login and restarts if it dies. They only play while the Mac is awake; the keeper on
# the server settles everything anyway.
#
#   ops/mac.sh install | uninstall | status | logs [model]
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
MODELS="haiku sonnet opus fable"
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
    for m in $MODELS; do
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
    <string>--strategy</string><string>claude:$m</string>
    <string>--hourly</string><string>--invent</string><string>${CROWS_INVENT_EVERY:-4h}</string>
    <string>--stake</string><string>1</string><string>--max</string><string>10</string><string>--max-take</string><string>2</string>
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
    echo "installed: $MODELS (logs in $LOGS)"
    ;;
  uninstall)
    for m in $MODELS; do unload "$m"; rm -f "$(plist "$m")"; done
    echo "removed: $MODELS"
    ;;
  status)
    for m in $MODELS; do
      printf '%s: ' "$m"
      launchctl print "gui/$(id -u)/$(label "$m")" 2>/dev/null | grep -E "state =" | head -1 | tr -d '\t' || echo "not loaded"
      tail -n 2 "$LOGS/$m.log" 2>/dev/null | sed 's/^/    /' || true
    done
    ;;
  logs) tail -f "$LOGS/${2:-opus}.log" ;;
  *) echo "usage: ops/mac.sh install|uninstall|status|logs [model]"; exit 1 ;;
esac
