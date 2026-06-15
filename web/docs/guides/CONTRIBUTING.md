# Contributing to Hylé

Start with [DEV_QUICK_START.md](DEV_QUICK_START.md) (2-min setup).

---

## Code of Conduct

Read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) when participating.

---

## Development Setup

```bash
git clone https://github.com/kittender/hyle.git
cd hyle
bun install
cd cli
bun run build
bun test
```

**Time:** ~5 min.

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
# Run tests
bun test

# Match pattern
bun test --grep "validateManifest"

# Coverage
bun test --coverage

# Offline (no network)
bun test --offline

# Mock registry
bun scripts/mock-registry.ts --port 3001
```

Test fixtures: `cli/tests/fixtures/` (valid, invalid, malicious cases)

---

## Security

Before submitting:
- No secrets, API keys, credentials
- Path validation: `path.resolve()` + `path.relative()`
- `bun audit --production`
- `bun run lint` passes

**Reporting:** See [SECURITY.md](SECURITY.md) for responsible disclosure.

---

## Documentation Updates

Update docs when:
- Adding CLI command → [PUBLISHING.md](PUBLISHING.md) or [README.md](README.md)
- Changing manifest schema → [CONFIG.md](CONFIG.md)
- Major architectural change → [ARCHITECTURE.md](ARCHITECTURE.md)

Keep examples up-to-date with schema.

---

## Release Process

Semantic versioning (maintainers only):

- **Patch** (`x.x.+1`): Bug fixes → `hyle push`
- **Minor** (`x.+1.0`): Features → `hyle push`
- **Major** (`+1.0.0`): Breaking → `hyle release`

```bash
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions auto-publishes.

---

## Resources

- [DEV_QUICK_START.md](DEV_QUICK_START.md) — 2-min setup
- [ARCHITECTURE.md](ARCHITECTURE.md) — Design, constraints, issues
- [CONFIG.md](CONFIG.md) — Configuration reference
- [REGISTRY_API.md](REGISTRY_API.md) — Backend API
- [PUBLISHING.md](PUBLISHING.md) — Blueprint publishing guide

---

## Questions?

- Design: [GitHub Discussions](https://github.com/kittender/hyle/discussions)
- Bugs: [Issues](https://github.com/kittender/hyle/issues)
- Security: [SECURITY.md](SECURITY.md)
