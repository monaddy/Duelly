#!/usr/bin/env bash
set -euo pipefail
cleanup() { trap - SIGINT SIGTERM EXIT; kill -- -$$ >/dev/null 2>&1 || true; }
trap cleanup SIGINT SIGTERM EXIT
( cd server && npm run dev ) &
npm run dev
