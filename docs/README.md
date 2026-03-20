# Custom Git Server

A lightweight, self-hosted Git server running inside a Docker container, supporting both **SSH** and **HTTP** access.

---

## Overview

This project packages a minimal Git server into a single Docker container based on **Alpine Linux**. It exposes two protocols for interacting with repositories:

- **SSH** – authenticated access via public key, using `git-shell` to restrict the `git` user to Git operations only.
- **HTTP (Smart HTTP)** – unauthenticated read/write access via Nginx + `git-http-backend` over FastCGI (`fcgiwrap`).

---

## Project Structure

```
.
├── docker-compose.yml       # Service definition, port mappings, and volume mounts
├── Dockerfile               # Image build: Alpine base, SSH, Nginx, fcgiwrap
├── entrypoint.sh            # Container startup: sshd, fcgiwrap, nginx
├── nginx.conf               # Nginx config routing HTTP requests to git-http-backend
├── keys/
│   └── authorized_keys      # SSH public keys allowed to connect as the 'git' user
├── repos/                   # Bare Git repositories (mounted into the container)
└── docs/
    └── README.md            # This file
```

---

## How It Works

### SSH Access

- **OpenSSH** is installed and host keys are generated at build time (`ssh-keygen -A`).
- A dedicated `git` user is created with `/usr/bin/git-shell` as its shell, restricting it to Git operations only.
- The `keys/authorized_keys` file is mounted into the container at `/home/git/.ssh/authorized_keys`. Add client public keys here to grant SSH access.
- The container exposes SSH on port **2222** (mapped from internal port 22).

**Clone / push example:**
```bash
# Create a bare repo first (inside the container or via a volume)
git clone ssh://git@localhost:2222/git-repos/myrepo.git
git remote add origin ssh://git@localhost:2222/git-repos/myrepo.git
```

### HTTP Access

- **Nginx** listens on port 80 and routes all requests matching `/<repo>.git/...` to `git-http-backend` via **fcgiwrap** over a Unix socket.
- `GIT_HTTP_EXPORT_ALL` is set, making all repositories accessible without needing a `git-daemon-export-ok` file.
- `http.receivepack true` is set globally, allowing HTTP **push** (in addition to clone/fetch) without authentication.
- The container exposes HTTP on port **8080** (mapped from internal port 80).

> **Note:** HTTP access is currently unauthenticated. For production use, place a reverse proxy (e.g., Nginx or Caddy) in front with TLS and HTTP Basic Auth.

**Clone / push example:**
```bash
git clone http://localhost:8080/myrepo.git
git remote add origin http://localhost:8080/myrepo.git
```

---

## Running the Server

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/)

### Start

```bash
docker compose up -d
```

### Stop

```bash
docker compose down
```

### Rebuild after changes

```bash
docker compose up -d --build
```

---

## Adding a Repository

Repositories must be **bare** Git repos placed inside the `repos/` directory (which is mounted into the container at `/git-repos`).

```bash
git init --bare repos/myrepo.git
```

The repository will be immediately accessible over both SSH and HTTP without restarting the container.

---

## Adding SSH Keys

Append the client's public key to `keys/authorized_keys`:

```bash
cat ~/.ssh/id_ed25519.pub >> keys/authorized_keys
```

The file is bind-mounted, so changes take effect immediately without restarting the container.

---

## Port Reference

| Protocol | Host Port | Container Port |
|----------|-----------|----------------|
| SSH      | 2222      | 22             |
| HTTP     | 8080      | 80             |

---

## Technology Stack

| Component    | Role                                                  |
|--------------|-------------------------------------------------------|
| Alpine Linux | Minimal base image                                    |
| OpenSSH      | SSH server; `git-shell` restricts the `git` user      |
| Nginx        | HTTP server; proxies Git Smart HTTP requests          |
| fcgiwrap     | FastCGI wrapper that executes `git-http-backend`      |
| git-http-backend | Git's built-in CGI handler for Smart HTTP        |
| spawn-fcgi   | Launches `fcgiwrap` bound to a Unix socket            |
