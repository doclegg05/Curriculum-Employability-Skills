#!/usr/bin/env bash
# The quality gate for this repo. CI runs this and fails the build when it
# exits non-zero; run it locally before sharing anything.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> SPOKES validator: all lesson decks"
for lesson in lesson-*/index.html; do
  echo "--- $lesson"
  python3 scripts/validate-lesson.py "$lesson"
done

echo "==> validator test suite"
python3 -m unittest discover -s scripts -p 'test_validator.py' -v

echo "==> registry / dashboard fallback sync"
python3 scripts/check-registry-sync.py

# REPORT-ONLY: prints per-deck Flesch-Kincaid grades (grade-8 ceiling) and
# always exits 0. Turning this into a blocking check is a later, deliberate
# calibration decision — do not drop --baseline without one.
echo "==> readability baseline (report-only)"
node scripts/readability-gate.mjs --baseline --format html \
  --allowlist config/readability-allowlist.json \
  lesson-*/index.html \
  || echo "readability baseline step failed (non-blocking)"

# Computed accessibility (axe-core WCAG A/AA, first slide view of every deck
# over file://). Ratchet: fails only on violations beyond the committed
# shrink-only allowlist scripts/a11y-baseline.json. The Node harness deps
# (devDependencies: playwright + axe-core) are test-only — the decks need
# nothing — so this step is skipped with a note when they are not installed.
# CI installs them; a bare classroom machine does not need them.
echo "==> a11y check (axe-core over lesson decks, ratchet vs committed baseline)"
if [ "${CI:-}" = "true" ] && [ ! -d node_modules ]; then
  npm ci
  npx playwright install --with-deps chromium
fi
if [ -d node_modules/playwright ] && [ -d node_modules/axe-core ]; then
  node scripts/a11y-check.mjs
else
  echo "a11y check SKIPPED: harness deps not installed (npm ci && npx playwright install chromium to enable)"
fi

echo "quality.sh: all checks passed"
