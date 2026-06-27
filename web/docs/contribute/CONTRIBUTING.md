# Contributing to Hylé

Be respectful and constructive in issues, PRs, and discussions — standard open-source
conduct.

---

## Development Setup

```bash
git clone https://github.com/kittender/hyle.git
cd hyle
bun install                    # installs all workspaces (cli, web, registry)
cd cli
bun run build                  # compiles to dist/hyle
bun test                       # 102+ tests, 2-3 sec
```

**Time:** ~5 min.

### Project Structure

```
cli/
  src/
    commands/        # init, pull, push, publish, etc.
    manifest.ts       # hyle.yaml validation
    config.ts         # .hyle file parsing
  tests/
    fixtures/          # valid, invalid, malicious test cases

web/
  src/app/            # Angular components
  src/app/api/        # Registry API routes
```

### Local Registry (Mock)

```bash
bun scripts/mock-registry.ts --port 3001    # Terminal 1
hyle search test                            # Terminal 2 — should list mock blueprints
hyle pull org/test-blueprint                # should extract files
```

---

## Workflow

### 1. Branch from `develop`

```bash
git checkout develop
git checkout -b feature/your-name
```

### 2. Code & Test

```bash
bun test
bun run lint
bun audit --production
```

### 3. Commit (Conventional Commits)

```bash
git commit -m "feat(cli): add hyle validate command"
git commit -m "fix(manifest): prevent path traversal"
```

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `security`

### 4. Submit PR to `develop`

- Link related issues
- Ensure CI passes
- Update docs if user-facing

---

## Testing

```bash
bun test                          # run all
bun test --grep "validateManifest"  # match pattern
bun test --coverage
bun test --offline                # no network
```

Test fixtures: `cli/tests/fixtures/` (valid, invalid, malicious cases).

| Task | Command |
|------|---------|
| Lint | `bun run lint` |
| Security audit | `bun audit --production` |
| Debug logs | `DEBUG=hyle:* bun run build` |
| Test one file | `bun test cli/src/manifest.test.ts` |

---

## Security

Before submitting:
- No secrets, API keys, credentials
- Path validation: `path.resolve()` + `path.relative()`
- `bun audit --production`
- `bun run lint` passes

**Reporting:** See [security.md](../security/security.md) for responsible disclosure.

---

## Documentation Updates

Update docs when:
- Adding a CLI command → [cli-reference.md](../cli-reference.md)
- Changing manifest schema → [Config reference](../publish/config.md)
- Major architectural change → [architecture.md](../knowledge/architecture.md)

Keep examples up-to-date with schema.

---

## Release Process

Semantic versioning (maintainers only):

- **Patch** (`x.x.+1`): Bug fixes, WIP → `hyle snapshot`
- **Minor** (`x.+1.0`): Features, backward compatible → `hyle push`
- **Major** (`+1.0.0`): Breaking → `hyle release`

```bash
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions auto-publishes.

---

## Questions?

- Design: [GitHub Discussions](https://github.com/kittender/hyle/discussions)
- Bugs: [Issues](https://github.com/kittender/hyle/issues)
- Security: [Security policy](../security/security.md)
