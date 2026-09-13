#!/bin/bash
set -e
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null 2>&1; then
  echo "Fractions Fighter needs Node.js 22 or newer. Install Node.js from https://nodejs.org, then double-click this file again."
  read -r -p "Press Return to close. "
  exit 1
fi
trap 'echo "Launch failed. The message above explains why."; read -r -p "Press Return to close. "' ERR
echo "Preparing Fractions Fighter…"
if [ ! -d node_modules ]; then npm ci; fi
npm run build
node scripts/launch.mjs
