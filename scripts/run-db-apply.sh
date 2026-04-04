#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
if [[ -x "$ROOT/.tools/node/bin/npm" ]]; then
  export PATH="$ROOT/.tools/node/bin:$PATH"
fi
echo "Credora: when prompted, enter your Supabase database password (from Project Settings → Database)."
echo ""
exec npm run db:apply
