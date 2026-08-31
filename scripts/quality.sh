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

echo "quality.sh: all checks passed"
