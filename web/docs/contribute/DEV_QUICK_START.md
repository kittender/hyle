# Dev Quick Start

One-pager for new developers. Full setup in [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Clone & Install

```bash
git clone https://github.com/kittender/hyle.git
cd hyle
bun install                    # Installs all workspaces (cli, web, registry)
```

---

## Build & Test

```bash
cd cli
bun run build                  # Compiles to dist/hyle
bun test                       # 102+ tests (2–3 sec)
```

---

## Local Registry (Mock)

```bash
# Terminal 1: Mock registry on :3001
bun scripts/mock-registry.ts --port 3001

# Terminal 2: Test CLI commands
hyle search test               # Should list mock blueprints
hyle pull org/test-blueprint   # Should extract files
```

---

## Development Workflow

**1. Branch from `develop`**
```bash
git checkout develop
git checkout -b feature/your-name
```

**2. Edit code, test, commit**
```bash
bun test                       # Run before committing
git add .
git commit -m "feat(cli): add hyle foo command"
```

**3. Submit PR to `develop`** (not `main`)
- Link related issues
- Ensure CI passes

---

## Project Structure

```
cli/
  src/
    commands/        # init, pull, push, publish, etc.
    manifest.ts      # hyle.yaml validation
    config.ts        # .hyle file parsing
  tests/
    fixtures/        # Valid, invalid, malicious test cases
    
web/
  src/app/           # Angular components
  src/app/api/       # Registry API routes
```

---

## Common Commands

| Task | Command |
|------|---------|
| Build | `bun run build` (in cli/) |
| Test | `bun test` |
| Lint | `bun run lint` |
| Security audit | `bun audit --production` |
| Test coverage | `bun test --coverage` |
| Test offline | `bun test --offline` |

---

## Debugging

```bash
# Print debug logs
DEBUG=hyle:* bun run build

# Test specific file
bun test cli/src/manifest.test.ts

# Test matching pattern
bun test --grep "validateManifest"
```

---

## Where to Start

- **Bug fix?** → Read [CONTRIBUTING.md](CONTRIBUTING.md) "Testing Guidelines"
- **New command?** → Copy `cli/src/commands/pull.ts`, adapt, add tests
- **Registry feature?** → Start in `registry/src/handlers/`
- **Web UI?** → Angular standalone components in `web/src/app/`
- **Questions?** → [GitHub Discussions](https://github.com/kittender/hyle/discussions)
