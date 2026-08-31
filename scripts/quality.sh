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

echo "quality.sh: all checks passed"
