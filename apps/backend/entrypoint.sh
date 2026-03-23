#!/bin/sh

set -eu

# Ensure /git-repos exists and has proper permissions for the backend user (UID 1000)
# This runs as root before switching to UID 1000
mkdir -p /git-repos
chmod 777 /git-repos

# Switch to UID 1000 and run migrations, local seed, then backend
exec su node -s /bin/sh -c '
pnpm prisma migrate deploy
if [ "${NODE_ENV:-development}" != "production" ]; then
	pnpm db:seed
fi
node dist/index.js
'
