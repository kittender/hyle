# Populate with Mock Data (optional)

The repo includes a dynamic mock data generator that auto-discovers all blueprints
in [`mock/blueprints/`](../../mock/blueprints) and generates a realistic social
graph — stars, reviews, install counts, multiple versions with diffs, activity
events, and a mock user account.

Enable it with the `mock` compose profile:

```bash
docker compose --profile mock up --build
```

This brings up the stack and runs a one-shot `seed` container that:

1. **Discovers** all blueprints in `mock/blueprints/<author>/<name>/`.
2. **Generates** fake stats (stars, reviews, installs) and version history (2–3
   versions per blueprint) with manifest diffs to populate the registry.
3. **Publishes** all versions through the public API (works because local stack
   runs `auth=none`).
4. **Seeds** the social graph: mock user account, stars, reviews, timestamped
   install events, and activity feed.

Seeding is **non-idempotent** — re-running clears old data and generates fresh
mock stats, so every seed is reproducible but not cumulative:

```bash
docker compose down -v && docker compose --profile mock up --build
```

You can also run the seeder by hand against an already-running stack:

```bash
cd mock && bun install
HYLE_REGISTRY_URL=http://localhost:3000 DB_PATH=<path-to>/hyle-registry.db bun run seed.ts
```

## Mock User

A mock user account (`mock-user`) is automatically created to enable testing auth
flows without OAuth. It owns the `mock-user/test-blueprint` and stars
`andrej-kirskyn/good-java`.

## Adding a Blueprint

Drop a new `blueprints/<author>/<name>/hyle.yaml` with referenced files into
`mock/blueprints/`. The seeder auto-discovers it on the next run and generates
stats + versions automatically. No manual `seed-data.json` edits needed.

See [`mock/README.md`](../../mock/README.md) for layout and implementation details.
