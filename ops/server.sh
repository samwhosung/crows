#!/bin/sh
# The house bot and the public scoreboard, on the shared droplet (`ssh vpn`).
#
#   ops/server.sh install   first time: user, dirs, house key, Caddy site, systemd service (then runs update)
#   ops/server.sh update    ship the CLI and page, install deps, restart the house
#   ops/server.sh status    service state, memory, last log lines
#   ops/server.sh logs      follow the house log
#
# The droplet also runs WireGuard (wg0) and Khmer Daily behind Caddy. This script only adds its own files:
# /opt/crows, /var/lib/crows, /etc/caddy/sites.d/crows.caddy, /etc/systemd/system/crows-house.service,
# and the `crows` system user. The service is capped at 200 MB so it can never starve the VPN.
set -eu
HOST="${CROWS_SERVER:-vpn}"
SITE="${CROWS_SITE:-crows.188-166-209-89.sslip.io}"
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
VIEM="$(node -e "console.log(require('$ROOT/cli/node_modules/viem/package.json').version)")"

update() {
  rsync -az --delete --exclude node_modules --exclude 'deployments/local.json' --exclude test \
    "$ROOT/cli/" "$HOST:/opt/crows/cli/"
  rsync -az "$ROOT/web/index.html" "$HOST:/var/lib/crows/www/index.html"
  ssh "$HOST" "set -e
    cd /opt/crows/cli
    PATH=/opt/node/bin:\$PATH npm install --omit=dev --no-audit --no-fund --no-save viem@$VIEM >/dev/null
    chown -R root:root /opt/crows && chmod 644 /var/lib/crows/www/index.html
    systemctl restart crows-house
    sleep 5; systemctl is-active crows-house"
}

case "${1:-status}" in
  install)
    ssh "$HOST" "set -e
      id crows >/dev/null 2>&1 || useradd --system --home-dir /var/lib/crows --shell /usr/sbin/nologin crows
      mkdir -p /opt/crows /var/lib/crows/keys /var/lib/crows/www
      chown crows:crows /var/lib/crows /var/lib/crows/keys /var/lib/crows/www
      chmod 755 /var/lib/crows /var/lib/crows/www; chmod 700 /var/lib/crows/keys"
    # The house key moves to the server; the Mac keeps a copy only as a backup and never runs the house.
    scp -q "$HOME/.crows/keys/house.key" "$HOST:/var/lib/crows/keys/house.key"
    ssh "$HOST" "chown crows:crows /var/lib/crows/keys/house.key && chmod 600 /var/lib/crows/keys/house.key"
    ssh "$HOST" "cat > /etc/systemd/system/crows-house.service" <<EOF
[Unit]
Description=crows house bot and scoreboard data (Base mainnet)
After=network-online.target
Wants=network-online.target

[Service]
User=crows
Group=crows
Environment=CROWS_NETWORK=base
Environment=CROWS_HOME=/var/lib/crows
WorkingDirectory=/opt/crows/cli
ExecStart=/opt/node/bin/node --no-warnings --max-old-space-size=128 src/main.ts bot --as house --role house --stake 1 --max 12 --board /var/lib/crows/www/board.json
Restart=always
RestartSec=15
MemoryMax=200M
Nice=10
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/crows

[Install]
WantedBy=multi-user.target
EOF
    ssh "$HOST" "cat > /etc/caddy/sites.d/crows.caddy" <<EOF
# crows scoreboard. Managed by crows/ops/server.sh.
$SITE {
	encode zstd gzip
	root * /var/lib/crows/www
	header /board.json Cache-Control "no-store"
	file_server
}
EOF
    ssh "$HOST" "set -e; caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 && systemctl reload caddy && systemctl daemon-reload && systemctl enable crows-house >/dev/null 2>&1"
    update
    echo "scoreboard: https://$SITE/"
    ;;
  update) update ;;
  status)
    ssh "$HOST" "systemctl is-active crows-house wg-quick@wg0 caddy khmer-daily | paste -sd' ' -; systemctl show crows-house -p MemoryCurrent; free -m | sed -n 2p; journalctl -u crows-house -n 15 --no-pager -o cat"
    ;;
  logs) ssh "$HOST" "journalctl -u crows-house -f -o cat" ;;
  *) echo "usage: ops/server.sh install|update|status|logs"; exit 1 ;;
esac
