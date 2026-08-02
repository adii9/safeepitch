#!/usr/bin/env bash
# Local dev — starts SAM local API + frontend dev server side-by-side.
#
# Usage:
#   ./scripts/local-dev.sh
#
# Prerequisites:
#   - AWS SAM CLI installed
#   - Docker running
#   - Node 20+ installed
#   - Python 3.11+ installed

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  echo "==> Shutting down..."
  jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT

cd "${REPO_ROOT}/infra/sam" && sam local start-api --port 3001 &
SAM_PID=$!
echo "==> SAM local API on http://localhost:3001 (pid ${SAM_PID})"

cd "${REPO_ROOT}/apps/web" && npm run dev &
WEB_PID=$!
echo "==> Vite dev server on http://localhost:3000 (pid ${WEB_PID})"

echo ""
echo "==> Open http://localhost:3000 to use the app."
echo "    Press Ctrl+C to stop."

wait
