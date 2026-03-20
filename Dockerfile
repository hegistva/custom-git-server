FROM alpine:3.19

# 1. Install dependencies
RUN apk add --no-cache \
    git \
    git-daemon \
    openssh \
    nginx \
    fcgiwrap \
    spawn-fcgi \
    bash

# 2. Setup SSH
RUN ssh-keygen -A && \
    adduser -D -s /usr/bin/git-shell git && \
    echo "git:$(openssl rand -base64 12)" | chpasswd

# 3. Setup Directories
RUN mkdir -p /git-repos /home/git/.ssh && \
    chown -R git:git /git-repos /home/git/.ssh

# 4. Allow unauthenticated HTTP push (receive-pack) globally
RUN git config --system http.receivepack true

# 4. Configure Nginx for Git Smart HTTP
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 22 80
ENTRYPOINT ["/entrypoint.sh"]