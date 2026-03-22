#!/bin/bash

set -eu

if [ "${GIT_AUTH_BACKEND:-false}" = "true" ]; then
	cp /etc/nginx/nginx.auth-request.conf /etc/nginx/nginx.conf
else
	cp /etc/nginx/nginx.legacy.conf /etc/nginx/nginx.conf
fi

# Backend writes repositories on the shared volume as a different container user.
# Trust the mounted repo path for git-http-backend operations in this container.
su git -s /bin/sh -c "git config --global --replace-all safe.directory '*'"

# 1. Ensure the run directory exists
mkdir -p /run
chown git:nginx /run

# 2. Start SSH
/usr/sbin/sshd

# 3. Start fcgiwrap (Running as the 'git' user, but accessible by 'nginx' group)
# We use -U nginx to allow the nginx user to read/write the socket
spawn-fcgi -s /run/fcgiwrap.socket -U nginx -u git -g git /usr/bin/fcgiwrap

# 4. Start Nginx
nginx -g "daemon off;"