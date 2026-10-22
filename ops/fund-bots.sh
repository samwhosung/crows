#!/bin/sh
# Move USDC and gas money from the treasury to the house and opus bots, and name them on-chain.
# Usage: ops/fund-bots.sh [house_usdc=15] [opus_usdc=10] [eth_each=0.0015]
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
C="$ROOT/cli/bin/crows"
export CROWS_NETWORK=base
H=$($C wallet list --json | python3 -c 'import sys,json;print([w["address"] for w in json.load(sys.stdin) if w["name"]=="house"][0])')
O=$($C wallet list --json | python3 -c 'import sys,json;print([w["address"] for w in json.load(sys.stdin) if w["name"]=="opus"][0])')
$C send --as treasury --to "$H" --usdc "${1:-15}" --eth "${3:-0.0015}"
$C send --as treasury --to "$O" --usdc "${2:-10}" --eth "${3:-0.0015}"
$C name the-house --as house
$C name claude-opus-5.5 --as opus
$C wallet show --as house
$C wallet show --as opus
