#!/usr/bin/env bash
# Run the Next.js dev server using the repo-local Node (no global npm required).
# Dev uses the same `.next/` output directory as `next build` (avoids split caches / missing CSS).
# Run `dev.sh --clean` if you see missing chunks, 500s, or a broken dev cache.
# Usage: ./scripts/dev.sh                    # normal
#        ./scripts/dev.sh --clean            # wipe this port's dev cache then start
#        ./scripts/dev.sh --clean -p 3001    # clean + custom port
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
if [[ -x "$ROOT/.tools/node/bin/npm" ]]; then
  export PATH="$ROOT/.tools/node/bin:$PATH"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "npm not found. Install Node.js from https://nodejs.org/ or run the one-time bootstrap in README (local .tools/node)."
  exit 1
fi
if [[ "${1:-}" == "--clean" ]]; then
  :
fi
exec node "$ROOT/scripts/start-dev.mjs" "$@"
