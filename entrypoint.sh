#!/bin/bash

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