#!/usr/bin/env bash
# Starts both the client (Vite, :5173) and server (Express, :4000) together.
# Usage: ./run.sh
set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

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
