#!/bin/sh
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  npm install
fi
npm run dev -- --host 127.0.0.1 --port 4321
