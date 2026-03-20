# Design: HTTP Authentication + HTTPS

## Objective

Implement secure Git Smart HTTP access in two steps:

1. Basic authentication POC
2. HTTPS termination with Caddy

SSH support remains unchanged.

---

## Current End State (after Step 2)

```text
Client HTTPS --> Caddy (TLS + Basic Auth, 443) --> git-server:80 --> fcgiwrap --> git-http-backend
Client SSH   --> git-server:22
```

### Why Caddy as separate proxy

- Keeps certificate handling out of the app container
- Automatically manages local TLS certs (`tls internal`)
- Keeps nginx config focused on Git backend/auth, not edge TLS concerns

---

## Step 1 Decisions (already implemented)

- Remove `http.receivepack=true` system config from image
- Enforce `auth_basic` in nginx for `*.git` paths
- Pass `REMOTE_USER` to `git-http-backend`
- Store credentials in bind-mounted `auth/htpasswd`

Rationale:

- Without global `http.receivepack`, pushes are accepted only for authenticated requests where `REMOTE_USER` is set.
- This avoids anonymous push while still allowing clone/fetch/push for authenticated users.

---

## Step 2 Decisions (implemented)

- Add `caddy` service in `docker-compose.yml`
- Expose ports `80` and `443` from Caddy
- Keep `git-server` HTTP internal-only on Docker network
- Keep SSH direct via `2222:22`
- Move Basic Auth from nginx to Caddy `basicauth`
- Forward authenticated user as `X-Remote-User` from Caddy to nginx
- Map nginx `REMOTE_USER` from `$http_x_remote_user`
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

## Authentication Location

Authentication is enforced at Caddy (edge), not nginx.

Benefits:

- Centralized edge policy (TLS + auth in one place)
- No auth files or auth modules needed in `git-server`
- Backend remains focused on Git CGI handling



## Operational Notes

- Clients must resolve `git.local` to the host running Docker if not using `localhost`.
- Clients should trust Caddy local root CA for normal TLS verification.
- Password updates are done by replacing bcrypt hashes in `Caddyfile` and restarting Caddy.

---

## Risks / Limits

- `tls internal` is ideal for local/internal usage only.
- For public internet, switch to real DNS + ACME cert issuance.
