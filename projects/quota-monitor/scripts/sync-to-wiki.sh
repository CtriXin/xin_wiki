#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="${1:-$HOME/monit}"
DST_DIR="${2:-$HOME/xin_wiki/projects/quota-monitor}"

if [[ ! -d "$SRC_DIR" ]]; then
  echo "Source not found: $SRC_DIR"
  exit 1
fi

mkdir -p "$DST_DIR"

echo "Syncing:"
echo "  from: $SRC_DIR"
echo "    to: $DST_DIR"

rsync -av --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '*.log' \
  --exclude '.env' \
  --exclude '.env.*' \
  --exclude 'config.json' \
  --exclude 'data/' \
  --exclude '.DS_Store' \
  "$SRC_DIR"/ "$DST_DIR"/

echo "Done."
