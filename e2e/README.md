# Hylé end-to-end tests

Two independent suites that drive the **real** stack, not mocks:

| Suite | Runner | Targets |
|-------|--------|---------|
| [`web/`](web) | Playwright | Web UI at `http://localhost:8080` |
| [`cli/`](cli) | `bun test` | Compiled CLI ↔ registry at `http://localhost:3000` |

Both assume the docker-compose stack from the repo root is up:

```bash
docker compose up --build -d      # web :8080, registry :3000, auth=none
```

## Web UI (`e2e/web`)

```bash
cd e2e/web
npm install
npx playwright install        # one-time browser download
npx playwright test           # or: npm test
```

Override the target with `BASE_URL` (default `http://localhost:8080`).

## CLI (`e2e/cli`)

Drives the CLI from `../../cli` against the live registry.

```bash
cd e2e/cli
bun install
bun test
```

Override the registry with `HYLE_REGISTRY_URL` (default `http://localhost:3000`).
The suite skips itself if the registry isn't reachable, so it stays green without a stack.
