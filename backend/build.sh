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

# nh3 ships a compiled extension, so deps must be resolved for the Lambda
# runtime's platform (python3.12, x86_64 — the module doesn't set
# `architectures`, so AWS defaults to x86_64), not the build host's.
python3 -m pip install --quiet --upgrade \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all: \
  --target "$PKG" \
  -r "$ROOT/requirements.txt"
cp "$ROOT"/src/*.py "$PKG"/

echo "Built Lambda package at $PKG"
