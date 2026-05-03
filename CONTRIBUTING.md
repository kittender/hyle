# Contributing to Hylé

Thank you for your interest in contributing to Hylé! This document outlines how to set up your development environment, run tests, and submit changes.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) when participating in the community.

## Getting Started

### Prerequisites

- **Node.js 18+** (for CLI development)
- **Bun 1.0+** (package manager + runtime)
- **Git**

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/kittender/hyle.git
cd hyle

# Install dependencies (both cli/ and web/ workspaces)
bun install

# Build CLI
cd cli
bun run build

# Run tests
bun test
```

## Project Structure

```
hyle/
├── cli/                    # Core CLI implementation (Bun + TypeScript)
│   ├── src/
│   │   ├── commands/       # Command implementations (init, pull, push, etc.)
│   │   ├── manifest.ts     # Schema validation
│   │   ├── config.ts       # .hyle config parsing
│   │   ├── ignore.ts       # .hyleignore parser
│   │   └── index.ts        # Entry point
│   ├── tests/              # Test fixtures and unit tests
│   └── package.json
├── web/                    # Registry frontend + backend (Next.js)
│   ├── src/
│   │   ├── app/            # Next.js pages and components
│   │   └── app/api/        # Registry API routes
│   └── package.json
├── schema/                 # Shared schemas (hyle.schema.json)
├── hyle.yaml               # Root substrate manifest
└── CLAUDE.md               # Project ontology + design decisions
```

## Development Workflow

### 1. Create a Feature Branch

```bash
# Always branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Changes

Follow these principles:

- **Keep changes focused**: One feature or fix per PR
- **No breaking changes**: Maintain backward compatibility for published substrates
- **Test-driven**: Write tests before or alongside code
- **Security-first**: Run `biome check` and `bun audit` before committing

### 3. Run Tests & Quality Checks

```bash
# Run all tests
bun test

# Check code quality
bun run lint

# Run security audit
bun audit

# Check test coverage
bun test --coverage
```

### 4. Commit with Conventional Commits

Format: `<type>(<scope>): <subject>`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `security`

```bash
git add .
git commit -m "feat(cli): add hyle validate command"
git commit -m "fix(manifest): prevent path traversal in isUnsafePath"
```

### 5. Submit a Pull Request

- Push your branch: `git push origin feature/your-feature-name`
- Open a PR to `develop` (not `main`)
- Fill in the PR template with:
  - Description of changes
  - Link to related issues
  - Test plan
- Ensure CI passes (tests, lint, audit)

## Reviewing Pull Requests

All PRs require:

1. **Code review** from at least one maintainer
2. **Tests** covering the changes (>75% coverage threshold)
3. **Lint/audit** checks passing
4. **Documentation** updates if user-facing

## Testing Guidelines

### Unit Tests

```bash
# Run tests for a specific file
bun test cli/src/manifest.test.ts

# Run tests matching a pattern
bun test --grep "validateManifest"
```

### Test Fixtures

Use test fixtures in `cli/tests/fixtures/` for:
- Valid substrates (`fixtures/valid/`)
- Invalid manifests (`fixtures/invalid/`)
- Malicious payloads (`fixtures/malicious/`)

### Integration Tests

For commands that interact with the registry:
- Use `--offline` flag for hermetic testing
- Mock registry responses in `cli/tests/mock-registry.ts`
- Never hit live registry in CI

### Offline Mode

```bash
# Run tests in offline mode (no network calls)
bun test --offline
```

## Security Guidelines

### Before Submitting

1. **No secrets**: Never commit API keys, credentials, or tokens
2. **Path validation**: Use `path.resolve()` + `path.relative()` for any file paths
3. **Dependency audit**: Run `bun audit --production`
4. **SAST**: Check code against `biome.json` security rules

### Reporting Security Issues

**Do not** open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

## Documentation

### Update Docs When:

- Adding a new CLI command → update `REGISTRY_API.md` (if backend-related) or add command examples
- Changing manifest schema → update `MANIFEST_EXAMPLES.md` and `CONFIG_REFERENCE.md`
- Adding configuration → document in `CONFIG_REFERENCE.md` with examples
- Major architectural change → update `CLAUDE.md` ontology section

### Documentation Style

- Use clear, concise language
- Include code examples where helpful
- Link to related sections
- Keep examples up-to-date with schema

## Release Process

Maintainers use semantic versioning:

- **Patch** (`x.x.+1`): Bug fixes, security patches → `hyle push`
- **Minor** (`x.+1.0`): New features (backward-compatible) → `hyle snapshot` for WIP, then `hyle push` for stable
- **Major** (`+1.0.0`): Breaking changes (rare for CLI) → `hyle release`

Pre-release testing:
1. Bump version in `cli/package.json`, `web/package.json`, `hyle.yaml`
2. Tag: `git tag v0.2.0`
3. Push: `git push origin v0.2.0`
4. GitHub Actions auto-publishes to GitHub Releases

## Resources

- [CLAUDE.md](CLAUDE.md) — Project ontology and design decisions
- [SECURITY.md](SECURITY.md) — Security policy and best practices
- [LOCAL_TESTING.md](LOCAL_TESTING.md) — Local testing guide
- [MANIFEST_EXAMPLES.md](MANIFEST_EXAMPLES.md) — Substrate manifest examples
- [CONFIG_REFERENCE.md](CONFIG_REFERENCE.md) — Configuration reference

## Questions?

- **Design questions**: Discuss in [GitHub Discussions](https://github.com/kittender/hyle/discussions)
- **Bug reports**: Open an [issue](https://github.com/kittender/hyle/issues)
- **Security concerns**: Email security@kittender.com (see SECURITY.md)

---

Thank you for contributing to Hylé! 🚀
