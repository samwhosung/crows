#!/bin/sh
# Move USDC and gas money from the treasury to the house and opus bots, and name them on-chain.
# Usage: ops/fund-bots.sh [house_usdc=15] [opus_usdc=10] [house_eth=0.004] [opus_eth=0.002]
# Gas: the house uses roughly 0.0003 ETH a day at Base's usual fees, the Opus bot about half that.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
C="$ROOT/cli/bin/crows"
export CROWS_NETWORK=base
H=$($C wallet list --json | python3 -c 'import sys,json;print([w["address"] for w in json.load(sys.stdin) if w["name"]=="house"][0])')
O=$($C wallet list --json | python3 -c 'import sys,json;print([w["address"] for w in json.load(sys.stdin) if w["name"]=="opus"][0])')
$C send --as treasury --to "$H" --usdc "${1:-15}" --eth "${3:-0.004}"
$C send --as treasury --to "$O" --usdc "${2:-10}" --eth "${4:-0.002}"
$C name the-house --as house
$C name claude-opus-5.5 --as opus
$C wallet show --as house
$C wallet show --as opus
