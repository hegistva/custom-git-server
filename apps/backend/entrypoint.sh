#!/bin/sh

set -eu

# Ensure /git-repos exists and has proper permissions for the backend user (UID 1000)
# This runs as root before switching to UID 1000
mkdir -p /git-repos
chmod 777 /git-repos

# Switch to UID 1000 and run migrations + backend
exec su node -s /bin/sh -c 'pnpm prisma migrate deploy && node dist/index.js'
