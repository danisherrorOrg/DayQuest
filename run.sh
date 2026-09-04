#!/usr/bin/env bash
# Starts both the client (Vite, :5173) and server (Express, :4000) together.
# Usage: ./run.sh [lint|lint:fix|format|format:check]
set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

case "$1" in
  lint|lint:fix|format|format:check)
    exec npm run "$1"
    ;;
  "")
    ;;
  *)
    echo "Unknown option: $1" >&2
    echo "Usage: ./run.sh [lint|lint:fix|format|format:check]" >&2
    exit 1
    ;;
esac

if npm run dev; then
  exit 0
fi

# npm's optional-dependency bug occasionally drops the platform-specific
# rollup binary, which crashes the Vite client on startup. Self-heal once
# by doing a clean reinstall, then retry.
echo ""
echo "Dev servers exited with an error — reinstalling dependencies and retrying once..."
rm -rf node_modules client/node_modules server/node_modules package-lock.json
npm install
exec npm run dev
