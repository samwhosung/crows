#!/bin/sh
# Deploy crows to Base mainnet from the treasury wallet, verify the source on Sourcify, refresh the CLI.
# Usage: ops/deploy-base.sh            (needs a little ETH in ~/.crows/keys/treasury.key's address)
# Rehearse on a fork: BASE_RPC_URL=http://127.0.0.1:8546 SKIP_VERIFY=1 ops/deploy-base.sh
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
RPC="${BASE_RPC_URL:-https://mainnet.base.org}"
export PATH="$HOME/.foundry/bin:$PATH"
cd "$ROOT/contracts"
forge build
NETWORK=base forge script script/Deploy.s.sol --rpc-url "$RPC" --broadcast --slow \
  --private-key "$(cat "$HOME/.crows/keys/treasury.key")"
[ "${SKIP_VERIFY:-0}" = 1 ] && { cd "$ROOT/cli" && node scripts/abi.mjs; echo "deployed (unverified): $(cat "$ROOT/contracts/deployments/base.json")"; exit 0; }
for pair in crows:Crows closerCall:CloserCall priceLine:PriceLine upDown:UpDown; do
  key="${pair%%:*}"; name="${pair##*:}"
  addr=$(python3 -c "import json;print(json.load(open('deployments/base.json'))['$key'])")
  args=""
  [ "$name" = "Crows" ] && args="--constructor-args $(cast abi-encode 'constructor(address)' 0x00000000000000171ede64904551eeDF3C6C9788)"
  # shellcheck disable=SC2086
  forge verify-contract --chain base --verifier sourcify --watch "$addr" "$name" $args || echo "verify $name: retry later"
done
cd "$ROOT/cli" && node scripts/abi.mjs
echo "deployed: $(cat "$ROOT/contracts/deployments/base.json")"
