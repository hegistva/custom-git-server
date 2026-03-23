#!/usr/bin/env sh

set -eu

if [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

pnpm format
pnpm format:check
