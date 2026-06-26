# CLI Distribution

How to install and publish the `hyle` CLI. The CLI is provider-agnostic — it
talks to whatever registry `HYLE_REGISTRY_URL` / `.hyle` points at (local or
remote).

## Install

> **WIP — no package-manager release yet.** `hyle` is **not** on npmjs (or any
> public registry). Install from source. The `npm install -g hyle` path below
> only works against a registry you publish to yourself (see
> [Publish to a private registry](#publish-to-a-private-registry-artifactory--nexus--gitlab)).

```bash
# Run from source (no install — works everywhere bun runs)
cd cli && bun install
bun run dev -- --help        # `dev --` is the source-run prefix for any command

# Put a real `hyle` on your PATH (builds the node bundle, then links it)
bun run link                 # = bun run build:npm && bun link
hyle --version               # now the bare `hyle` command works
```

`bun run link` is the canonical way to get a working bare `hyle` command from a
clone. It builds `dist/hyle.js` (the same Node bundle that gets published) and
registers it globally. To remove it later: `bun unlink` in `cli/`.

> Verify it resolves with `which -a hyle` (or `type hyle`) — a shell
> function/alias or another `hyle` on PATH shadows the link; fix with `hash -r`,
> a fresh shell, or `node cli/dist/hyle.js <cmd>` directly.

By default the CLI targets `http://localhost:3000`. Point it elsewhere with
`HYLE_REGISTRY_URL` or `remote_url` in `.hyle` / `~/.hyle`.

## Build a publishable package

The npm build bundles the TypeScript into a single Node-runnable file with a
`#!/usr/bin/env node` shebang:

```bash
cd cli
bun run build:npm     # → dist/hyle.js (the published bin)
node dist/hyle.js --version
```

`prepublishOnly` runs `typecheck` + `build:npm` automatically, so `npm publish`
always ships a fresh, type-checked bundle. `package.json` `files` whitelists
`dist/` only.

## Publish to npmjs (official)

> Not done yet for the public `hyle` package — these are the steps a maintainer
> runs to cut the first release. Until that happens, `npm install -g hyle` 404s
> for end users; use the source install above.

```bash
cd cli
npm login
npm publish            # publishConfig.access=public is already set
```

## Publish to a private registry (Artifactory / Nexus / GitLab)

Copy `cli/.npmrc.example` to `cli/.npmrc` and set your registry + token:

```ini
registry=https://your-company.jfrog.io/artifactory/api/npm/npm-local/
//your-company.jfrog.io/artifactory/api/npm/npm-local/:_authToken=${NPM_TOKEN}
```

Then:

```bash
cd cli
NPM_TOKEN=*** npm publish
```

Developers install from the same registry:

```bash
npm config set registry https://your-company.jfrog.io/artifactory/api/npm/npm-local/
npm install -g hyle
```

> Prefer an env-injected `NPM_TOKEN` (CI secret) over committing a token. Keep
> `.npmrc` out of version control.

## Standalone binaries (no Node required)

For air-gapped or no-runtime installs, build self-contained executables:

```bash
cd cli
bun run build          # → dist/hyle (single binary for the current platform)
bun run build:all      # → dist/hyle-linux-x64, -macos-arm64, -windows-x64.exe, ...
```

Distribute these via your artifact store, Homebrew tap, Chocolatey, etc.

> **macOS note:** `bun --compile` produces an *unsigned* binary. Gatekeeper (and
> some sandboxed environments) will kill it on first run (`exit 137`). Ad-hoc
> sign it before distributing — `codesign --sign - --force dist/hyle` — or ship
> a notarized build. For local development prefer `bun run link` (Node bundle),
> which has no signing requirement.
