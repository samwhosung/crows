#!/bin/sh
# The fast loop: a local fork of Base with our contracts at their real addresses, a hand-driven ETH feed that
# mirrors the live price, four model bots, a keeper, and a clock you can fast-forward. No real money.
#
#   ops/fork.sh start              fork Base, deploy, fund throwaway wallets, start the mirror and the keeper
#   ops/fork.sh bots [--invent 1m] start Haiku, Sonnet, Opus and Fable bots (logs in ~/.crows/fork/logs)
#   ops/fork.sh timelapse [hours]  advance the chain's clock, 10 minutes every 20 seconds (default 10 hours)
#   ops/fork.sh board | logs | stop
#
# Everything lives under ~/.crows/fork (CROWS_HOME), so fork keys never mix with mainnet keys.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
export PATH="$HOME/.foundry/bin:$PATH"
export CROWS_NETWORK=local
export CROWS_HOME="${CROWS_FORK_HOME:-$HOME/.crows/fork}"
RPC=http://127.0.0.1:8545
LOGS="$CROWS_HOME/logs"
CROWS="$ROOT/cli/bin/crows"
DEPLOYER=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # anvil's first account
MODELS="haiku sonnet opus fable"

q() { "$CROWS" "$@" 2>&1 | grep -vE "ExperimentalWarning|Support for loading|trace-warnings"; }

case "${1:-}" in
  start)
    mkdir -p "$LOGS"
    pkill -f "anvil --fork-url" 2>/dev/null || true
    rm -rf "$CROWS_HOME/local" "$CROWS_HOME/keys" "$CROWS_HOME/games"
    nohup anvil --fork-url "${BASE_RPC_URL:-https://mainnet.base.org}" --port 8545 --block-time 2 --silent > "$LOGS/anvil.log" 2>&1 &
    until cast block-number -r $RPC >/dev/null 2>&1; do sleep 1; done
    (cd "$ROOT/contracts" && NETWORK=local MOCK_FEED=true forge script script/Deploy.s.sol --rpc-url $RPC --broadcast --private-key $DEPLOYER >/dev/null 2>&1)
    (cd "$ROOT/cli" && node scripts/abi.mjs >/dev/null)
    for w in keeper $MODELS; do
      a=$(q init "$w" --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["address"])')
      q dev faucet "$a" --usdc 50 --eth 1 >/dev/null
    done
    for w in $MODELS; do q name --as "$w" "claude-$w" >/dev/null; done
    nohup "$CROWS" dev mirror --every 20 > "$LOGS/mirror.log" 2>&1 &
    OURS=$(q wallet --json | python3 -c 'import sys,json;print(",".join(w["address"] for w in json.load(sys.stdin)))')
    nohup "$CROWS" bot --as keeper --role keeper --ours "$OURS" --board "$CROWS_HOME/board.json" > "$LOGS/keeper.log" 2>&1 &
    echo "fork up: rpc $RPC, home $CROWS_HOME, wallets: keeper $MODELS"
    ;;
  bots)
    shift
    mkdir -p "$LOGS"
    for m in $MODELS; do
      nohup "$CROWS" bot --as "$m" --strategy "claude:$m" --hourly --invent "${2:-2m}" --max 10 --max-take 2 "$@" > "$LOGS/$m.log" 2>&1 &
    done
    echo "bots started: $MODELS (logs: $LOGS)"
    ;;
  timelapse)
    H="${2:-10}"
    n=$((H * 6))
    i=0
    while [ $i -lt $n ]; do
      cast rpc evm_increaseTime 600 -r $RPC >/dev/null
      cast rpc evm_mine -r $RPC >/dev/null
      i=$((i + 1))
      sleep 20
    done
    echo "advanced ${H}h"
    ;;
  board) q board ;;
  logs) tail -n 20 "$LOGS"/*.log ;;
  stop)
    pkill -f "src/main.ts bot --as" 2>/dev/null || true
    pkill -f "src/main.ts dev mirror" 2>/dev/null || true
    pkill -f "anvil --fork-url" 2>/dev/null || true
    echo stopped
    ;;
  *) echo "usage: ops/fork.sh start | bots [--invent 1m] | timelapse [hours] | board | logs | stop"; exit 1 ;;
esac
