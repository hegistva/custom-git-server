# Custom Git Server

A lightweight self-hosted Git server with:

- SSH access on port `2222`
- HTTPS Git Smart HTTP access behind Caddy on port `443`
- HTTP Basic Auth enforced for all Git HTTP operations

---

## Overview

The stack runs two containers:

- `git-server` (Alpine + OpenSSH + nginx + fcgiwrap + `git-http-backend`)
- `caddy` (TLS termination and reverse proxy)

Request flow:

```text
HTTPS client --> Caddy (TLS + Basic Auth) --> git-server:80 --> fcgiwrap --> git-http-backend
SSH client   --> git-server:22 (sshd + git-shell)
```

---

## Project Structure

```text
.
├── Caddyfile
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── nginx.conf
├── keys/
│   └── authorized_keys
├── repos/
└── docs/
    ├── README.md
    ├── design-http-auth-https.md
    └── tasks-http-auth-https.md
```

---

## Security Model

### SSH

- Key-based auth via `keys/authorized_keys`
- `git` user runs under `git-shell`

### HTTPS (Git Smart HTTP)

- TLS is terminated by Caddy (`tls internal`)
- Authentication is enforced by Caddy `basicauth`
- Caddy forwards the authenticated user in `X-Remote-User`
- nginx maps `X-Remote-User` to `REMOTE_USER` for `git-http-backend` so authenticated push works
- Global unauthenticated push (`http.receivepack=true`) is not used

---

## Quick Start

### 1) Start the stack

```bash
docker compose up -d --build
```

### 2) Hostname setup

For local testing on the same machine, `localhost` works out of the box.

For remote clients or custom naming, add this on each client machine:

```text
127.0.0.1 git.local
```

### 3) Trust Caddy local root CA

```bash
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

Linux:

```bash
sudo cp caddy-root.crt /usr/local/share/ca-certificates/caddy-root.crt
sudo update-ca-certificates
```

macOS:

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain caddy-root.crt
```

---

## Using HTTPS Git

Clone (localhost):

```bash
git clone https://gituser:changeme@localhost/my-docs.git
```

Clone (custom hostname):

```bash
git clone https://gituser:changeme@git.local/my-docs.git
```

Set remote:

```bash
git remote set-url origin https://gituser:changeme@git.local/my-docs.git
```

---

## Verify Endpoint Behavior

Quick checks (local):

```bash
# No credentials -> 401
curl -s -o /dev/null -w "%{http_code}\n" -k "https://localhost/my-docs.git/info/refs?service=git-upload-pack"

# Valid credentials -> 200
curl -s -o /dev/null -w "%{http_code}\n" -k -u gituser:changeme "https://localhost/my-docs.git/info/refs?service=git-upload-pack"

# HTTP -> HTTPS redirect -> 308
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost/my-docs.git/info/refs?service=git-upload-pack"
```

Git protocol check over HTTPS:

```bash
GIT_SSL_NO_VERIFY=true git ls-remote https://gituser:changeme@localhost/my-docs.git
```

For local POC tests where the CA is not yet trusted, `-k` / `GIT_SSL_NO_VERIFY=true` is acceptable. For normal usage, trust the Caddy root CA and remove those flags.

---

## Managing HTTP Auth Users

Credentials are managed in `Caddyfile` with a bcrypt hash.

Generate a password hash:

```bash
docker run --rm caddy:2-alpine caddy hash-password --plaintext '<password>'
```

Then update the `basicauth` block in `Caddyfile`:

```caddy
basicauth {
    <username> <bcrypt-hash>
}
```

Apply changes:

```bash
docker compose restart caddy
```

---

## Ports

| Purpose | Host Port | Service |
|---|---:|---|
| SSH Git | 2222 | `git-server` |
| HTTP (redirect/entry) | 80 | `caddy` |
| HTTPS Git | 443 | `caddy` |

---

## Related Docs

- [design-http-auth-https.md](design-http-auth-https.md)
- [tasks-http-auth-https.md](tasks-http-auth-https.md)
