#!/usr/bin/env bash
# Builds backend/.build/package — the directory that infra/live's
# archive_file data source zips into the Lambda deployment package.
# Run this before `terraform plan`/`apply` so source_code_hash reflects
# the current code + dependencies.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG="$ROOT/.build/package"

rm -rf "$ROOT/.build"
mkdir -p "$PKG"

python3 -m pip install --quiet --upgrade --target "$PKG" -r "$ROOT/requirements.txt"
cp "$ROOT"/src/*.py "$PKG"/

echo "Built Lambda package at $PKG"
