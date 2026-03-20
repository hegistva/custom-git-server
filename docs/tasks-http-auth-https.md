# Tasks: HTTP Auth + HTTPS

## Step 1 (Basic Auth POC)

- [x] Add nginx Basic Auth for `*.git` paths
- [x] Add `REMOTE_USER` FastCGI param
- [x] Remove `http.receivepack=true` global Git setting
- [x] Add bind-mounted `auth/htpasswd`
- [x] Exclude `auth/htpasswd` via `.gitignore`
- [x] Validate: unauthenticated requests return `401`, valid credentials return `200`

## Step 2 (Caddy HTTPS)

- [x] Add `Caddyfile` with `tls internal`
- [x] Add `caddy` service to `docker-compose.yml`
- [x] Expose `80` and `443` on Caddy
- [x] Remove direct host exposure of `git-server` HTTP port
- [x] Keep `git-server` and `caddy` on shared Docker network
- [x] Keep SSH mapping (`2222:22`) for Git over SSH
- [x] Move Basic Auth from nginx to Caddy `basicauth`
- [x] Forward authenticated username from Caddy to backend (`X-Remote-User` -> `REMOTE_USER`)

## Verification

- [ ] Add host mapping on client (`git.local`)
- [ ] Trust Caddy local root CA on client
- [x] Verify unauthenticated HTTPS request returns `401`
- [x] Verify authenticated HTTPS request returns `200`
- [x] Verify HTTP endpoint redirects to HTTPS
- [x] Verify `git clone` / `git push` over HTTPS with credentials

## Next Optional Hardening

- [ ] Add separate read-only vs write permissions
- [ ] Add repeatable credential rotation script for `Caddyfile` bcrypt hashes
- [ ] Replace `tls internal` with ACME certs for public deployment
