#!/bin/sh
# The Claude Opus bot, on Sam's Mac (it needs the Claude Code login). Runs as a LaunchAgent, so it starts at login
# and restarts if it dies. It only plays while the Mac is awake; the house on the server settles everything anyway.
#
#   ops/mac.sh install | uninstall | status | logs
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
LABEL=com.crows.opus
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/.crows/logs/opus.log"
NODE_BIN="$(dirname "$(command -v node)")"
CLAUDE_BIN="$(dirname "$(command -v claude)")"

case "${1:-status}" in
  install)
    mkdir -p "$HOME/.crows/logs" "$HOME/Library/LaunchAgents"
    cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$ROOT/cli/bin/crows</string>
    <string>bot</string><string>--as</string><string>opus</string>
    <string>--strategy</string><string>claude:opus</string>
    <string>--stake</string><string>1</string><string>--max</string><string>8</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$NODE_BIN:$CLAUDE_BIN:/usr/local/bin:/usr/bin:/bin</string>
    <key>CROWS_NETWORK</key><string>base</string>
    <key>CLAUDE_CONFIG_DIR</key><string>$HOME/.claude-3</string>
    <key>CLAUDE_CODE_DISABLE_AUTO_MEMORY</key><string>1</string>
  </dict>
  <key>WorkingDirectory</key><string>$ROOT/cli</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    echo "installed $LABEL; log: $LOG"
    ;;
  uninstall)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    rm -f "$PLIST"
    echo "removed $LABEL"
    ;;
  status)
    launchctl print "gui/$(id -u)/$LABEL" 2>/dev/null | grep -E "state =|pid =|last exit" || echo "not loaded"
    tail -n 5 "$LOG" 2>/dev/null || true
    ;;
  logs) tail -f "$LOG" ;;
  *) echo "usage: ops/mac.sh install|uninstall|status|logs"; exit 1 ;;
esac
