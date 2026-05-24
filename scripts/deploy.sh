#!/bin/bash
# Публикация на leshapudge/oleg + включение GitHub Pages
set -euo pipefail
cd "$(dirname "$0")/.."

REPO="leshapudge/oleg"
SITE="https://leshapudge.github.io/oleg/"

echo "→ Проверка входа в GitHub..."
if ! gh auth status &>/dev/null; then
  echo "Нужен вход в аккаунт leshapudge:"
  gh auth login --hostname github.com --git-protocol https --web
fi

USER=$(gh api user -q .login)
if [ "$USER" != "leshapudge" ]; then
  echo "⚠ Сейчас залогинен: $USER"
  echo "  Нужен leshapudge. Выполни: gh auth logout && gh auth login"
  exit 1
fi

echo "→ Remote → github.com/$REPO"
git remote set-url origin "https://github.com/$REPO.git"

echo "→ Push main..."
git push -u origin main

echo "→ Включение GitHub Pages (ветка main)..."
if gh api "repos/$REPO/pages" &>/dev/null; then
  gh api "repos/$REPO/pages" -X PUT \
    -f build_type=legacy \
    -f "source[branch]=main" \
    -f "source[path]=/" \
    -q .html_url 2>/dev/null || true
else
  gh api "repos/$REPO/pages" -X POST \
    -f build_type=legacy \
    -f "source[branch]=main" \
    -f "source[path]=/" \
    -q .html_url 2>/dev/null || true
fi

echo ""
echo "✅ Готово!"
echo "   Репозиторий: https://github.com/$REPO"
echo "   Сайт (через 1–3 мин): $SITE"
echo ""
echo "   Если Actions: Settings → Pages → Source: GitHub Actions"
