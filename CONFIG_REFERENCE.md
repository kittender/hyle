# Configuration Reference

Complete reference for Hylé configuration files: `hyle.yaml`, `.hyle`, and `.hyleignore`.

## Table of Contents

1. [hyle.yaml (Substrate Manifest)](#hyleyaml-substrate-manifest)
2. [.hyle (Local Config)](#hyle-local-config)
3. [.hyleignore (Exclusion Patterns)](#hyleignore-exclusion-patterns)
4. [Configuration Precedence](#configuration-precedence)
5. [Environment Variables](#environment-variables)

---

## hyle.yaml (Substrate Manifest)

The manifest file defining a substrate. **Required fields** marked with `*`.

### Root Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | * | Substrate identifier, 1–64 chars, lowercase alphanumeric + hyphens |
| `author` | string | * | Author name, 1–64 chars, lowercase alphanumeric + hyphens |
| `version` | string | * | Semantic version: `x.y.z` or `x.y.z-snapshot` |
| `url` | string | * on publish | GitHub repository URL (e.g., `https://github.com/owner/repo`). Auto-detected from `git remote` on publish; optional if remote is configured |
| `description` | string | | Single-line (or multi-line with `\|`) summary |
| `homepage` | string | | Project homepage URL |
| `license` | string | | SPDX license identifier (e.g., `MIT`, `CC-BY-4.0`) |
| `models` | object | * | Model configuration (see [Models](#models)) |
| `dependencies` | array | | External dependencies (see [Dependencies](#dependencies)) |
| `ontology` | array | | Knowledge files (docs, specs, examples) |
| `craft` | array | | Technical structure (code, schemas, config) |
| `identities` | array | | Agent identities (`.claude/agents/*.md`) |
| `ethics` | array | | Policies (`.cedar`, GDPR, etc.) |
| `extends` | array | | Parent substrates to inherit from |
| `tags` | array | | Searchable tags (1–100 chars each) |

### models

**Object** (required). Model configuration for primary and secondary tasks.

```yaml
models:
  primary:                        # Complex, high-intelligence tasks
    provider: anthropic           # (required) "anthropic", "openai", "ollama"
    model: claude-sonnet-4-6      # (required) Model name/ID
    model_pin: claude-sonnet-4-6-20260115  # (optional) Exact checkpoint for reproducibility
    tags: [saas, paid]            # (optional) Classification tags
    fallback:                     # (optional) Ordered fallback chain
      - provider: openai
        model: gpt-4o
        tags: [saas, paid, alternative]
      - provider: ollama
        model: qwen2.5:14b
        tags: [local, free, offline]
  
  secondary:                      # Lightweight: indexing, summaries
    provider: anthropic
    model: claude-haiku-4-5
    fallback:
      - provider: openai
        model: gpt-4o-mini
      - provider: ollama
        model: qwen2.5:7b
```

**Fallback Resolution**:
- Tried in order until one succeeds
- Provider must report available tokens (no quota exhaustion)
- Provider must be reachable (network available)
- Entries tagged `[local, free]` are always tried last
- Unbounded chains rejected (max 5 levels)

**Tags** (optional):
- `saas` — Software-as-a-service (cloud API)
- `paid` — Requires paid subscription (user-declared; not enforced by Hylé)
- `free-tier` — Free quota available (limited)
- `local` — Local execution (Ollama, etc.)
- `offline` — Works without network
- `production` — Recommended for production
- `experimental` — Beta/preview status

### dependencies

**Array** (optional). External tools and packages required.

```yaml
dependencies:
  # Package manager (npm, pip, homebrew, apt, yum, etc.)
  - manager: npm
    pkg: "@anthropic-ai/sdk"
    version: "^1.15.0"           # Semantic version range
  
  # Python (pip)
  - manager: pip
    pkg: torch
    version: ">=2.0.0,<3.0.0"    # Pinned version
  
  # System package
  - manager: homebrew
    pkg: jq
    # No version specified — latest
  
  # Script installation (requires sha256)
  - manager: script
    pkg: custom-tool
    url: https://example.com/install.sh
    sha256: abc123def456...  # SHA-256 of script (security)
```

**Manager Field** (required):
- `npm` — Node.js packages
- `pip` — Python packages
- `homebrew` — macOS packages
- `apt` — Debian/Ubuntu packages
- `yum` — RedHat/CentOS packages
- `script` — Custom shell script (must include `sha256`)

**Version Field** (recommended):
- Semantic version ranges: `^1.0.0`, `~1.2.0`, `>=1.0.0,<2.0.0`
- Exact pins: `1.2.3`
- Omit for latest version (not recommended for reproducibility)

**Hash Verification**:
- Script dependencies **must** include `sha256` hash
- At install time, Hylé fetches URL, verifies hash, executes only if match
- On mismatch: hard fail (cannot install untrusted script)

### File Arrays (ontology, craft, identities, ethics)

**Array** (optional). References to files organized by category.

```yaml
ontology:          # Knowledge & documentation
  - path: docs/ARCHITECTURE.md
  - path: docs/examples/
  - path: README.md

craft:             # Technical structure
  - path: package.json
  - path: schema/
  - path: tsconfig.json

identities:        # Agent roles and identities
  - path: .claude/agents/supervisor.md
  - path: .claude/agents/worker.md
  - path: .claude/agents/tools/search.md

ethics:            # Policies and compliance
  - path: .cedar/policies.cedar
  - path: PRIVACY_NOTICE.md
```

**Path Rules**:
- Must be relative (no `/` or `~` prefix)
- No `..` directory traversal allowed
- Wildcards: `docs/` matches directory and all contents
- Files are bundled in substrate archive

### extends

**Array** (optional). Parent substrates to inherit from.

```yaml
extends:
  - name: base-kit
    author: kittender
    version: "^1.0.0"      # Semantic version range
```

**Merge Behavior**:
- Parent files (ontology, craft, etc.) loaded first
- Child fields override parent
- Max inheritance depth: 2 levels (parent → child only)
- Registry resolves versions automatically

### tags

**Array** (optional). Searchable tags for discoverability.

```yaml
tags:
  - ai-safety
  - evaluations
  - research
  - anthropic
```

---

## .hyle (Local Config)

Project-specific configuration that overrides global settings. Located at project root.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `remote_url` | string | Registry API endpoint (default: `https://api.hyle.dev`) |
| `oidc_provider` | string | Custom OIDC provider issuer URL (optional; auto-detected from registry for self-hosted) |
| `oidc_auto_discover` | boolean | Auto-discover OIDC provider from registry (default: true) |
| `github_client_id` | string | GitHub OAuth app client ID (for `hyle login` device flow). Can also be set via env var `GITHUB_CLIENT_ID` |
| `models` | object | Override model configuration (merges with `hyle.yaml`) |
| `dependencies` | object | Override dependency settings |
| `offline` | boolean | Disable network access (default: false) |

### Example

**Public Registry (GitHub OAuth):**

```yaml
# Use Hylé public registry (default)
remote_url: "https://api.hyle.dev"
```

**Self-Hosted Registry (Custom OIDC):**

```yaml
# Corporate registry with custom OIDC provider
remote_url: "https://registry.company.internal"
oidc_provider: "https://idp.company.internal"  # Keycloak, Auth0, Okta, etc.

# Override models (more cost-conscious)
models:
  primary:
    provider: ollama
    model: qwen2.5:14b
  secondary:
    provider: ollama
    model: qwen2.5:7b

# Optional: auto-discover OIDC from registry (default: true)
oidc_auto_discover: true
```

**Offline Mode:**

```yaml
# No network access (cached data only)
offline: true

# Custom dependencies behavior
dependencies:
  offline: true  # Don't install, advisory-only
```

### Configuration Merging

Global config (`~/.hyle`) + local config (`.hyle` in project root):

```bash
# Global config (set once, used by all projects)
cat > ~/.hyle <<EOF
remote_url: "https://api.hyle.dev"
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
EOF

# Local config (overrides global for this project)
cat > .hyle <<EOF
remote_url: "http://localhost:3001/api"  # Use local registry
offline: true
EOF

# Result: local wins
hyle show-config
# remote_url: "http://localhost:3001/api"
# models.primary.provider: "anthropic" (inherited from global)
# offline: true
```

### Offline Mode

When `offline: true`:
- Registry lookups fail immediately (no network)
- Dependency installation skipped (advisory-only)
- Model availability checks skipped
- All operations use cached/local data

**Use cases**:
- CI/CD without network access
- Testing (hermetic environments)
- Airplane mode development

### OAuth2 + OIDC Token Storage

When you run `hyle login`, OAuth2 tokens are stored locally:

**Location:** `~/.hyle/auth.json`  
**Format:**
```json
{
  "access_token": "<short-lived JWT token>",
  "refresh_token": "<long-lived refresh token>",
  "expires_at": 1718550000,
  "username": "your-username",
  "email": "user@example.com",
  "oidc_issuer": "https://github.com",
  "provider": "github"
}
```

**Security:** Tokens are stored in plain text (not encrypted). Treat refresh tokens like passwords:
- Never commit to git (add `~/.hyle/auth.json` to `.gitignore`)
- Use file permissions to restrict access: `chmod 600 ~/.hyle/auth.json`
- Rotate regularly: run `hyle logout && hyle login`
- Delete if you share your machine with others

**Token Lifecycle:**
- **Access tokens:** Short-lived (1 hour typical), used for API requests
- **Refresh tokens:** Long-lived (days/months), stored locally for transparent renewal
- **Automatic refresh:** CLI checks expiry before each request; auto-refreshes if needed
- **Manual refresh:** Run `hyle logout && hyle login` to re-authenticate

**OIDC Provider Support:**
- Public registry: GitHub OAuth (hardcoded)
- Self-hosted: Any OIDC-compliant provider (GitHub Enterprise, GitLab, Keycloak, Auth0, Okta, custom)

---

## .hyleignore (Exclusion Patterns)

Gitignore-style patterns for excluding files during `push` and `scan` commands.

### Format

```bash
# Comments (ignored)
*.env
.git/
node_modules/
*.pem
secrets/

# Negation patterns NOT supported (for security)
# (keeping blocklist-only to prevent accidental secret leaks)
```

### Rules

- Glob patterns: `*.env`, `docs/**/*.tmp`
- Directory patterns: `.git/`, `node_modules/`
- Exact match: `package-lock.json`
- Anchored to project root (no prefix matching)

### Examples

```bash
# Environment files
.env*
.env.local
.env.*.local

# Secrets
*.pem
*.key
secrets/
credentials/

# Dependencies (don't bundle)
node_modules/
venv/
.venv/

# Git
.git/
.gitignore

# OS
.DS_Store
Thumbs.db

# Build artifacts (include source instead)
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
```

### Checking What's Ignored

```bash
# Scan and show ignored files
hyle ontology . --verbose 2>&1 | grep -i ignored

# List final bundle contents (before publish)
hyle push --dry-run --list-files
```

---

## Configuration Precedence

Hylé resolves configuration in this order (highest priority first):

1. **Environment variables** — `HYLE_*`
   - `HYLE_ALLOW_INSECURE=1` — Allow HTTP registry (dev only)
   - `HYLE_OFFLINE=1` — Force offline mode

2. **Command-line flags**
   - `hyle pull --offline` — Override config
   - `hyle init --name myname` — Skip prompts

3. **Local config** (`.hyle` in project root)
   - Registry URL, offline mode, model overrides

4. **Global config** (`~/.hyle`)
   - Default registry, default models

5. **Manifest defaults** (`hyle.yaml`)
   - Required fields (name, author, version, models)

### Example Resolution

```bash
# No config files, use defaults
hyle init
# → Uses https://api.hyle.dev (default)

# Global config
cat > ~/.hyle <<EOF
remote_url: "https://custom.registry.com"
EOF

hyle push
# → Uses https://custom.registry.com

# Local config overrides global
cat > .hyle <<EOF
remote_url: "http://localhost:3001"
EOF

hyle push
# → Uses http://localhost:3001

# CLI flag overrides all
hyle push --registry "https://another.registry.com"
# → Uses https://another.registry.com

# Environment variable overrides all
HYLE_OFFLINE=1 hyle push
# → Fails (cannot push offline)
```

---

## Environment Variables

### Registry & Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `HYLE_REGISTRY_URL` | `https://api.hyle.dev` | Custom registry endpoint |
| `GITHUB_CLIENT_ID` | — | GitHub OAuth app client ID (for `hyle login` device flow) |
| `HYLE_ALLOW_INSECURE` | `0` | Allow HTTP (non-HTTPS) registries (dev only) |

### Behavior

| Variable | Default | Description |
|----------|---------|-------------|
| `HYLE_OFFLINE` | `0` | Disable all network access |
| `HYLE_DRY_RUN` | `0` | Preview without side effects |
| `HYLE_VERBOSE` | `0` | Verbose logging (debug output) |

### Example

```bash
# Use custom registry (GitHub OAuth)
export HYLE_REGISTRY_URL="https://private.registry.example.com"

hyle login --registry $HYLE_REGISTRY_URL
hyle push
# → Publishes to private registry with OAuth authentication

# Offline development
export HYLE_OFFLINE=1

hyle pull my-substrate
# → Fails (offline mode prevents network)

# CI safety (no secrets, verbose logging)
export HYLE_DRY_RUN=1
export HYLE_VERBOSE=1

hyle push
# → Shows what would happen, nothing committed
```

---

## Schema Validation

All manifests are validated against `schema/hyle.schema.json` on load.

### Validation Rules

**Required fields**:
- `name`: 1–64 chars, lowercase alphanumeric + hyphens
- `author`: 1–64 chars, lowercase alphanumeric + hyphens
- `version`: Semantic versioning (`x.y.z` or `x.y.z-snapshot`)
- `models`: At least one model (primary or secondary)

**Semver validation**:
- Versions must match `^\d+\.\d+\.\d+(-snapshot)?$`
- Dependency versions must be valid semver ranges

**Path validation**:
- No `..` directory traversal
- No absolute paths (`/` prefix)
- No home directory (`~` prefix)

**Size limits**:
- Manifest: ≤ 512 KB
- Name/author: ≤ 64 chars each
- Description: ≤ 1000 chars
- Tags: ≤ 100 chars each, max 50 tags

### Validation Command

```bash
# Validate manifest
hyle validate hyle.yaml

# Output JSON (for scripting)
hyle validate hyle.yaml --json

# Expected success (no output)
# Expected failure: error message + exit code 1
```

---

## Related Documentation

- [MANIFEST_EXAMPLES.md](MANIFEST_EXAMPLES.md) — Example manifests
- [REGISTRY_API.md](REGISTRY_API.md) — Publishing & discovery
- [SECURITY.md](SECURITY.md) — Trust model & best practices
- [LOCAL_TESTING.md](LOCAL_TESTING.md) — Testing guide
