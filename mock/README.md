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
  seed-data.json                the social graph + per-blueprint metadata
  seed.ts                       Bun ingestion script
  Dockerfile                    one-shot seeder image (compose `seed` service)
  package.json                  seeder deps (js-yaml, tar)
```

## How to run

From the repo root:

```bash
docker compose --profile mock up --build
```

The `seed` service waits for the registry to be healthy, publishes the blueprints
through the API, then writes the social graph into the shared `registry-data`
volume. It is idempotent; to re-seed from scratch, `docker compose down -v` first.

Run it manually against a running registry:

```bash
cd mock && bun install
HYLE_REGISTRY_URL=http://localhost:3000 DB_PATH=<path>/hyle-registry.db bun run seed.ts
```

Env vars: `HYLE_REGISTRY_URL` (default `http://localhost:3000`), `DB_PATH`
(default `/data/hyle-registry.db`), `MOCK_DIR` (default the script's folder).

## What gets published vs. written directly

- **Via the public API** (`POST /blueprints`): every blueprint version. The
  publish handler stores the manifest JSON verbatim, so author-presentation extras
  (`license`, `language`, `long_description`, `fork_count`) survive the round-trip
  and are returned to the UI without any schema change.
- **Directly into SQLite** (the publish API can't set these without auth): users +
  socials, stars, reviews, timestamped `install_events`, `featured` picks, the
  activity feed, and backdated `created_at` per version for realistic ordering.

## `seed-data.json` schema

```jsonc
{
  "users": [
    { "username", "github_id", "email", "avatar_url", "bio", "website",
      "socials": { "github": "...", "x": "...", "linkedin": "..." } }
  ],
  "blueprints": [
    {
      "author", "name",
      "featured": 1,                 // curated rank (or null) → /stats/team-picks
      "versions": [                  // published oldest→newest; last = latest
        { "version", "created_at", "notes", "stable": true }
      ],
      "stars": 2890,                 // target count; synthetic stargazers fill the gap
      "starred_by": ["username"],    // named users who star it (drive "Starred" tabs)
      "reviews": [ { "username", "rating", "body", "created_at" } ],
      "installs": { "month", "half", "year", "older" }  // events per time bucket
    }
  ],
  "activity": [
    { "type": "push|pull|verified|community",
      "author", "name", "version", "actor", "note", "created_at" }
  ]
}
```

### Badge thresholds

Star/rating targets are chosen to cross the thresholds in
[`registry/src/handlers/badges.ts`](../registry/src/handlers/badges.ts):

- **Verified** — author is `hyle-org` (or `anthropic`).
- **Popular** — ≥ 1000 stars.
- **Community Loved** — ≥ 100 stars **and** ≥ 4.0 average rating.

### Install buckets → period rankings

`installs` expands to individual `install_events` rows with timestamps spread
across each window. The homepage "Most pulled" filter and `/stats/most-pulled`
count events per period, so:

- `month` → events in the last 30 days
- `half` → +31–182 days, `year` → +183–365 days, `older` → > 365 days

`This month / 6 months / This year / All time` are cumulative over these buckets.

## Adding a blueprint

1. Create `blueprints/<author>/<name>/hyle.yaml` plus the files it references under
   `ontology/`, `identities/`, `craft/`, `ethics/`. The manifest must satisfy the
   CLI's `validateManifest` (lowercase-slug name/author, semver version).
2. Add a matching entry under `blueprints` in `seed-data.json` (versions, stars,
   reviews, installs, optional `featured`).
3. If new authors/reviewers appear, add them to `users`.
4. Re-seed: `docker compose down -v && docker compose --profile mock up --build`.
