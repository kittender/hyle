# Hylé mock data

Realistic sample data for the local stack. Seeding this makes the website behave
like a populated registry so you can demo every page and user flow — featured
blueprints, most-pulled rankings, team picks, search/filter/sort, blueprint detail
(README, files, versions, diff, stars, reviews, badges), author profiles, and the
activity feed.

> **This is not production code.** Nothing here is deployed. It exists only to
> visualise the product under seemingly real conditions. The opt-in compose
> profile keeps it out of normal `docker compose up`.

## Layout

```
mock/
  blueprints/<author>/<name>/   real blueprint sources: hyle.yaml + referenced
                                ontology/ identities/ craft/ ethics/ files
  seed.ts                       Bun ingestion script (auto-discovers + generates)
  Dockerfile                    one-shot seeder image (compose `seed` service)
  package.json                  seeder deps (js-yaml, tar)
```

## How to run

From the repo root:

```bash
docker compose --profile mock up --build
```

The `seed` service:
1. Auto-discovers all blueprints in `blueprints/<author>/<name>/`.
2. Generates mock stats (stars, reviews, installs) and version history (2–3
   versions per blueprint).
3. Publishes all versions through the public API.
4. Writes the social graph to SQLite (mock user, stars, reviews, install events,
   activity feed).

Seeding is **non-idempotent**: re-running clears old data and generates fresh mock
stats. To re-seed:

```bash
docker compose down -v && docker compose --profile mock up --build
```

Run it manually against a running registry:

```bash
cd mock && bun install
HYLE_REGISTRY_URL=http://localhost:3000 DB_PATH=<path>/hyle-registry.db bun run seed.ts
```

Env vars: `HYLE_REGISTRY_URL` (default `http://localhost:3000`), `DB_PATH`
(default `/data/hyle-registry.db`), `MOCK_DIR` (default the script's folder).

## Mock Data Generation

The seeder auto-discovers all blueprints and generates:

- **Multiple versions** (2–3 per blueprint) with different manifest content to
  create real diffs.
- **Seeded random stats** for reproducibility: stars (50–2000), reviews (1–4 per
  blueprint), install events distributed across time buckets (month, half-year,
  year, older).
- **Mock user account** (`mock-user`) for testing auth flows; stars
  `andrej-kirskyn/good-java` and owns `mock-user/test-blueprint`.
- **Activity feed** with push events for each blueprint's latest version.

## Adding a Blueprint

Drop `blueprints/<author>/<name>/hyle.yaml` with referenced files:

```
blueprints/<author>/<name>/
  hyle.yaml
  ontology/*.md
  craft/*.md
  ethics/*.md
  identities/*.md
```

The seeder auto-discovers it on the next run. No manual edits to `seed-data.json`
needed — stats are generated automatically with seeded randomness.
