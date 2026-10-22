#!/bin/sh
# Create (if needed), fund and name the four model bots on Base mainnet, from the treasury.
# Usage: ops/fund-bots.sh [usdc_each=8] [eth_each=0.002]
# Gas: a bot uses well under 0.001 ETH a day at Base's usual fees; deploying a game costs a few cents.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
C="$ROOT/cli/bin/crows"
export CROWS_NETWORK=base
USDC="${1:-8}"; ETH="${2:-0.002}"
for m in haiku sonnet opus fable; do
  a=$($C init "$m" --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["address"])')
  $C send --as treasury --to "$a" --usdc "$USDC" --eth "$ETH"
  name=$($C wallet show --as "$m" --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["name"])')
  [ -n "$name" ] || $C name "claude-$m" --as "$m"
  $C wallet show --as "$m"
done
