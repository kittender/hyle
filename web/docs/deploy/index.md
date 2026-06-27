# Self-Hosting the Registry

👇 **Which are you?**

- **Want to try locally in 5 minutes?** → [Quick start](quickstart.md)
- **Deploying to production?** → [Production guide](production.md)
- **Distributing the CLI (npm/standalone)?** → [CLI distribution](CLI_DISTRIBUTION.md)
- **Contributing code?** → [Dev setup](../contribute/DEV_QUICK_START.md)

---

## Overview

Hylé is **self-hosted, open source FOSS** — run the full stack (registry + web UI) on your own infra.

**Same Docker images everywhere:** Local dev, staging, production. Only configuration changes between environments.

| Component | Stack | Runs |
|-----------|-------|------|
| **Registry** | Bun + TS + SQLite | Blueprint API, manifest storage, dependency resolution |
| **Web** | Angular 21 | Search UI, blueprint detail pages, docs viewer |
| **CLI** | Bun + TS | `pull` / `push` / `init` — distributed as standalone binary or npm package |

**Auth is optional:**
- Local dev: `auth=none` (no secrets, no account needed)
- Staging/prod: GitHub OAuth or generic OAuth2/OIDC (GitLab, Okta, Keycloak, Bitbucket)

**Database:**
- SQLite (bundled, volume-mounted) — fine for evaluation, on-prem, small teams
- PostgreSQL & multi-node HA not yet bundled but possible via adapter interface

---

## Quick Decision Tree

| Scenario | Path |
|----------|------|
| **Testing locally, no network** | [Quick start](quickstart.md) — Docker Compose + SQLite + `auth=none` |
| **Deploying to AWS/GCP/Azure** | [Production guide](production.md) — TLS, GitHub/OIDC auth, monitoring |
| **On-prem / private datacenter** | [Production guide](production.md) — customize for your network |
| **Distributing CLI via npm/brew** | [CLI distribution](CLI_DISTRIBUTION.md) |

---

## Architecture

```
┌─────────────────┐
│   Git + GitHub  │
│   (source only) │
└────────┬────────┘
         │
┌────────▼──────────┬──────────────────┐
│ Hylé Registry     │ Hylé Web UI      │
│ (API + manifest)  │ (search + docs)  │
│ Bun + TS + SQLite │ Angular 21       │
└─────────┬─────────┴────────┬─────────┘
          │                  │
   Registry←─────────────────┘
   returns checksums (SHA-256)
   
   CLI fetches files from GitHub,
   verifies against registry checksums
```

**Key point:** Registry stores metadata + checksums only. File content lives on GitHub and is verified client-side. No large uploads, no file storage required.

---

## Quick References

- **Local quickstart:** [Quick start](quickstart.md) (5 minutes, Docker)
- **Production deployment:** [Production guide](production.md) (TLS, auth, monitoring, scaling)
- **CLI distribution:** [CLI distribution](CLI_DISTRIBUTION.md) (npm, standalone binary, Docker)
- **Environment variables:** See [Production guide — Configuration](production.md#configuration) or `.env.example` in repo

---

## Next Steps

- **Just trying it out?** → [Quick start](quickstart.md)
- **Going to production?** → [Production guide](production.md)
- **Contributing code?** → [Dev setup](../contribute/DEV_QUICK_START.md)
