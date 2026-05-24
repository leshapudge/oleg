#!/bin/bash
# Быстрый push для агента/разработчика
set -euo pipefail
cd "$(dirname "$0")/.."

MSG="${1:-Update game}"
git add index.html styles/ js/ .github/ .nojekyll .cursor/rules/ 2>/dev/null || true
git add -u index.html styles/ js/ .github/ 2>/dev/null || true

if git diff --cached --quiet; then
  echo "Нечего пушить"
  exit 0
fi

git commit -m "$MSG"
git push origin main
echo "✅ https://leshapudge.github.io/oleg/"
