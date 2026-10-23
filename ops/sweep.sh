#!/bin/sh
# Send everything our wallets hold on Base mainnet to one address: all USDC, and all ETH but a few cents for the
# transfer's own fee. The keeper (house) keeps 0.001 ETH so it can still settle live duels.
# Stakes locked in live duels come back to the wallets when they settle; run this again after that.
# Usage: ops/sweep.sh <to_address> [wallet...]   (default: the five bots, the treasury and the house)
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
C="$ROOT/cli/bin/crows"
export CROWS_NETWORK=base
RPC=https://mainnet.base.org
USDC_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
TO="${1:?usage: ops/sweep.sh <to_address> [wallet...]}"; shift
WALLETS="${*:-haiku sonnet opus fable tourist treasury house}"

for w in $WALLETS; do
  a=$($C wallet show --as "$w" --json | python3 -c 'import sys,json;print(json.load(sys.stdin)["address"])')
  units=$(cast call "$USDC_TOKEN" "balanceOf(address)(uint256)" "$a" --rpc-url "$RPC" | cut -d' ' -f1)
  if [ "$units" != "0" ]; then
    $C send --as "$w" --to "$TO" --usdc "$(python3 -c "print(f'{$units/1e6:.6f}')")"
    sleep 3
  fi
  if [ "$w" = house ]; then keep=1000000000000000; else keep=20000000000000; fi
  wei=$(cast balance "$a" --rpc-url "$RPC")
  eth=$(python3 -c "w=$wei-$keep; print(f'{w/1e18:.18f}' if w>0 else '')")
  if [ -n "$eth" ]; then
    $C send --as "$w" --to "$TO" --eth "$eth"
    sleep 3
  fi
  echo "$w ($a): $(cast call "$USDC_TOKEN" "balanceOf(address)(uint256)" "$a" --rpc-url "$RPC" | cut -d' ' -f1) USDC units, $(cast balance "$a" --ether --rpc-url "$RPC") ETH left"
done
