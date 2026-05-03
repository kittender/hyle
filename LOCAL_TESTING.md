# Local Testing Guide

Validate CLI commands locally without hitting live registry or external URLs.

## Setup: Mock Registry Server

### 1. Start Mock Registry (HTTP on `http://localhost:3001`)

**Option A: Use test fixtures (recommended for CI)**

```bash
cd cli
bun run test:fixtures
```

**Option B: Start mock server manually**

```bash
bun scripts/mock-registry.ts --port 3001
```

Mock server serves:
- `GET /api/search?q=<query>` → returns test substrate list
- `GET /api/substrates/:author/:name/:version` → returns mock manifest + files
- `POST /api/substrates/:author/:name` → accept/reject publish (fail-first testing)

### 2. Initialize Test Project with Local Config

```bash
mkdir -p test-project && cd test-project

# Create .hyle (local config, overrides global)
cat > .hyle <<EOF
remote_url: "http://localhost:3001/api"
dependencies:
  offline: true
models:
  primary:
    provider: local
    model: "ollama-qwen"
EOF
```

## Test Commands Locally

### 1. Test `hyle init` (no registry required)

```bash
hyle init
# Answers (for test):
# Name: test-substrate
# Author: test-author
# Description: Test substrate
# Files: (skip, add manually after)

# Verify output
cat hyle.yaml | head -20
```

### 2. Test File-Scanning Commands (no registry required)

```bash
# Create test files
mkdir -p docs src/.claude
echo "# Ontology" > docs/architecture.md
echo "# Agent" > src/.claude/agent.md

# Scan and update hyle.yaml
hyle ontology docs/
hyle craft src/
hyle identities src/.claude/

# Verify references added
grep -A 5 "ontology:" hyle.yaml
```

### 3. Test `hyle pull` (with mock registry)

```bash
# Ensure mock server is running on :3001
hyle pull test-author/test-substrate \
  --dry-run  # Preview without applying
  
# Check diff output (should show mock files)
hyle pull test-author/test-substrate \
  --verbose

# Verify files installed
ls -la test-substrate-pulled/
```

### 4. Test `hyle push` / `hyle snapshot` (publish workflow)

```bash
# Snapshot (patch bump, unstable, for WIP testing)
hyle snapshot
# Expected: version x.x.(N+1), no stable tag

# Check what would be sent (dry-run)
hyle push --dry-run

# Check dependencies before publish
hyle deps check
```

### 5. Test `.hyle` Config Merging (local > global)

```bash
# Global config (user home)
cat > ~/.hyle <<EOF
remote_url: "https://api.hyle.dev"
models:
  primary:
    provider: anthropic
    model: "claude-sonnet-4-6"
EOF

# Local config (project root) overrides global
cat > .hyle <<EOF
remote_url: "http://localhost:3001/api"
offline: true
EOF

# Verify local overrides global
hyle show-config
# Output should show local remote_url, offline flag
```

### 6. Test `.hyleignore` Parsing

```bash
cat > .hyleignore <<EOF
*.env
.git/
node_modules/
*.pem
EOF

# Create files to test
touch .env.local api.pem

# Scan and verify ignored
hyle ontology . --verbose
# Output should skip .env.local, api.pem
```

### 7. Test Manifest Validation (P0-8)

```bash
# Create invalid hyle.yaml
cat > bad.yaml <<EOF
name: "bad"
models:
  primary:
    fallback:
      - provider: unknown
        model: "fake"
EOF

# Validate should catch error
hyle validate bad.yaml
# Expected: error on unknown provider

# Validate good manifest
hyle validate hyle.yaml
# Expected: success, no output
```

## Offline Mode (CI-Safe Testing)

**Problem:** Integration tests fail if network unavailable (CI, airplane mode, etc.)

**Solution:** Use `--offline` flag + hermetic fixtures

```bash
# Run tests without network
bun test --offline test/*.test.ts

# What's mocked:
# - Registry lookups → return test fixtures
# - Dependency installation → skip (advisory-only in offline mode)
# - Remote URL checks → always pass
# - Model availability checks → skip
```

## Test Fixtures Structure

```
cli/tests/fixtures/
├── hyle.yaml              # Valid test manifest
├── bad-*.yaml             # Invalid manifests (security, format)
├── substrates/
│   ├── valid-ontology/    # Minimal valid substrate
│   ├── valid-pull/        # Substrate with deps, identities
│   └── malicious/         # Attack test case (SSRF, path traversal)
└── .hyle                  # Sample local config
```

## Verify Test Coverage

```bash
# Show coverage gaps
bun run test --coverage

# Expected thresholds (from P0-9):
# - Line coverage: ≥ 75%
# - Branch coverage: ≥ 65%
# - Critical paths (security): 100%
```

## Checklist: Before Shipping

- [ ] All 6 core commands pass locally (init, pull, push, snapshot, release, validate)
- [ ] `.hyle` override works (local > global)
- [ ] `.hyleignore` patterns respected
- [ ] Offline mode tests pass (`--offline` flag)
- [ ] Invalid manifests rejected (validation catches all P0 issues)
- [ ] Registry mock returns expected payloads
- [ ] `--dry-run` previews without side effects
- [ ] No network calls in CI tests (all hermetic)

## Troubleshooting

### Mock Registry Won't Start

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill existing process if needed
kill -9 $(lsof -t -i :3001)

# Try custom port
bun scripts/mock-registry.ts --port 3002
```

### Tests Hang on Network Calls

```bash
# Use --offline to skip network
bun test --offline

# Or set environment variable
OFFLINE=1 bun test
```

### Invalid Manifest Not Caught

```bash
# Run validate explicitly
hyle validate bad.yaml --json

# Check schema file
cat schema/hyle.schema.json | grep -A 5 "provider"
```

## Related Documentation

- [LOCAL_TESTING.md](LOCAL_TESTING.md) — This guide
- [CONTRIBUTING.md](CONTRIBUTING.md) — Development workflow
- [SECURITY.md](SECURITY.md) — Security testing
- [MANIFEST_EXAMPLES.md](MANIFEST_EXAMPLES.md) — Example substrates
