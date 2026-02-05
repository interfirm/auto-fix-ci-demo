#!/bin/bash
# Collect lint, typecheck, and test errors for AI fix
# Usage: ./scripts/collect-errors.sh > errors.log

set -o pipefail

echo "=== TypeScript Errors ==="
pnpm turbo typecheck 2>&1 || true

echo ""
echo "=== ESLint Errors ==="
pnpm turbo lint 2>&1 || true

echo ""
echo "=== Test Failures ==="
pnpm turbo test:ci 2>&1 || true
