# Hylé Quickstart

Run the whole stack — registry, web UI, and CLI — on your own machine in a few
minutes, then deploy the **same images** to staging/pre-prod/prod by changing
configuration only.

## 1. Run locally (clone → up)

Requirements: Docker + Docker Compose.

```bash
git clone <this-repo> hyle && cd hyle
docker compose up --build
```

That starts:

| Service  | URL                     | What |
|----------|-------------------------|------|
| Web UI   | http://localhost:8080   | Search blueprints, learn the tool |
| Registry | http://localhost:3000   | Blueprint API (`/health` to check) |

Defaults: **SQLite** on a Docker volume and **`auth=none`** (no SSO, no
secrets). Publishing trusts the manifest author — perfect for local evaluation.

Override ports / URLs by copying `.env.example` to `.env` first.

## 2. Use the CLI against your local registry

There is no package-manager release yet, so install the CLI from source. The
one-liner below builds the Node bundle and puts a real `hyle` on your PATH:

```bash
cd cli && bun install && bun run link    # registers the bare `hyle` command
```

(Or skip the link and run any command through `bun run dev -- <command>` from
`cli/` — same CLI, no PATH entry.) Full options:
[CLI distribution](guides/CLI_DISTRIBUTION.md).

> After linking, confirm `hyle` resolves to the bundle you just built — a shell
> function, alias, or another `hyle` earlier on PATH will silently shadow it:
>
> ```bash
> which -a hyle    # or: type hyle  — should point at the bun-linked binary
> ```
>
> If it's shadowed, run `hash -r`, open a fresh shell, or invoke it directly
> (`node cli/dist/hyle.js <cmd>` from the repo, or the full `/usr/local/bin/hyle`
> path).

By default the CLI talks to `http://localhost:3000`, so it already points at the
stack from step 1.

```bash
# In any project you want to publish as a blueprint:
hyle init                 # creates hyle.yaml
hyle push                 # publishes to the local registry (no login needed)

# Elsewhere:
hyle pull <author>/<name> # pulls it back
```

To point at a different registry without editing files:

```bash
export HYLE_REGISTRY_URL=http://localhost:3000   # or a remote URL
```

…or set `remote_url` in `.hyle` (project) or `~/.hyle` (global).

> Local `http://` to `localhost` / `127.0.0.1` is always allowed. Non-local
> hosts must use `https://` (override with `HYLE_ALLOW_INSECURE=1`).

## 3. Deploy to your own infrastructure

Same images, real SSO and public URLs. Configuration is the only difference.

```bash
cp .env.example .env        # fill in URLs, provider, secrets
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Pick the URL set per environment:

| Target     | `HYLE_REGISTRY_URL`              | `HYLE_WEB_URL`                | Auth |
|------------|----------------------------------|------------------------------|------|
| Local test | `http://localhost:3000`          | `http://localhost:8080`      | `none` |
| Staging    | `https://registry.staging.acme`  | `https://hyle.staging.acme`  | `github` / `oauth2` |
| Prod       | `https://registry.acme.com`      | `https://hyle.acme.com`      | `github` / `oauth2` |

Auth is **opt-in**. `github` uses GitHub OAuth; `oauth2` is a generic
OAuth2/OIDC provider you point at GitLab, Bitbucket, Keycloak, Okta, etc. — see
[Configuration](reference/CONFIG.md#self-hosting-environment-variables)
and [Deployment](operations/DEPLOYMENT.md).

The CLI can be published to **npmjs** or a private registry like **Artifactory**
— see [CLI distribution](guides/CLI_DISTRIBUTION.md).
