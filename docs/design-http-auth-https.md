# Design: HTTP Authentication + HTTPS

> Status: Deprecated by the fullstack architecture in [design-fullstack.md](design-fullstack.md).
>
> This document remains for historical context only. Active authentication and routing behavior now use PAT validation through backend `/internal/git-auth` with nginx `auth_request` (see Fullstack Phases 8 and 9).

## Objective (Historical)

This document captured an earlier secure Git Smart HTTP rollout in two steps:

1. Basic authentication POC
2. HTTPS termination with Caddy

SSH support remained unchanged in that phase.

---

## Historical End State (after Step 2)

```text
Client HTTPS --> Caddy (TLS + Basic Auth, 443) --> git-server:80 --> fcgiwrap --> git-http-backend
Client SSH   --> git-server:22
```

### Why Caddy as separate proxy (Historical)

- Keeps certificate handling out of the app container
- Automatically manages local TLS certs (`tls internal`)
- Keeps nginx config focused on Git backend/auth, not edge TLS concerns

---

## Step 1 Decisions (Historical)

- Remove `http.receivepack=true` system config from image
- Enforce `auth_basic` in nginx for `*.git` paths
- Pass `REMOTE_USER` to `git-http-backend`
- Store credentials in bind-mounted `auth/htpasswd`

Rationale:

- Without global `http.receivepack`, pushes are accepted only for authenticated requests where `REMOTE_USER` is set.
- This avoids anonymous push while still allowing clone/fetch/push for authenticated users.

---

## Step 2 Decisions (Historical)

- Add `caddy` service in `docker-compose.yml`
- Expose ports `80` and `443` from Caddy
- Keep `git-server` HTTP internal-only on Docker network
- Keep SSH direct via `2222:22`
- Move Basic Auth from nginx to Caddy `basicauth` (superseded)
- Forward authenticated user as `X-Remote-User` from Caddy to nginx (superseded)
- Map nginx `REMOTE_USER` from `$http_x_remote_user` (superseded)
- Configure Caddy with:

```caddy
git.local, localhost {
    tls internal
    basicauth {
        gituser <bcrypt-hash>
    }
    reverse_proxy git-server:80 {
        header_up X-Remote-User {http.auth.user.id}
    }
}
```

---

## Authentication Location (Superseded)

This section is superseded. Authentication is no longer edge static Basic Auth.

Current behavior:

- Caddy handles TLS and routes Git paths to `git-server`
- nginx performs `auth_request` subrequests to backend `/internal/git-auth`
- backend validates username + PAT and repository authorization
- nginx forwards authenticated identity to `git-http-backend` via `REMOTE_USER`

Historical benefits:

- Centralized edge policy (TLS + auth in one place)
- No auth files or auth modules needed in `git-server`
- Backend remains focused on Git CGI handling

## Operational Notes (Historical)

- Clients must resolve `git.local` to the host running Docker if not using `localhost`.
- Clients should trust Caddy local root CA for normal TLS verification.
- Password updates are done by replacing bcrypt hashes in `Caddyfile` and restarting Caddy.

---

## Risks / Limits (Historical)

- `tls internal` is ideal for local/internal usage only.
- For public internet, switch to real DNS + ACME cert issuance.
