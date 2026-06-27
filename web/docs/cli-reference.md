# CLI Commands Reference

Complete guide to all `hyle` CLI commands.

👇 **Quick jump:**

| I want to… | Jump to |
|---|---|
| Initialize a new blueprint | [hyle init](#hyle-init) |
| Find a blueprint | [hyle search](#hyle-search) |
| Install a blueprint | [hyle pull](#hyle-pull) |
| Publish my own | [hyle push / release](#hyle-publish--hyle-push--hyle-release) |
| Auto-populate domains | [Scan commands](#scan-commands) (ontology, craft, identities, ethics) |
| Check my manifest | [hyle validate](#hyle-validate) |
| Fix missing dependencies | [hyle verify](#hyle-verify) |
| Check for updates | [hyle outdated](#hyle-outdated) |
| See all config options | [Configuration files](#configuration-files) |

👇 **By category:**
- [Core commands](#core-commands) — everyday use
- [Scan commands](#scan-commands) — auto-populate blueprint domains
- [Validation & verification](#validation--verification) — check your work
- [Version management](#dependency--version-management) — updates & upgrades
- [Extensions](#extension-commands) — LLM-powered features (optional)
- [Global options](#global-options) — available on any command
- [Config files](#configuration-files) — hyle.yaml, .hyle, .hyleignore
- [Environment variables](#environment-variables) — override behavior
- [Common workflows](#tips--common-workflows) — step-by-step examples

---

## Core Commands

Commands for everyday use: searching, pulling, publishing blueprints.

### `hyle init`

Generate a new `hyle.yaml` blueprint manifest.

```bash
hyle init                    # Interactive setup (prompts for name, author, version)
hyle init --yes              # Skip prompts, use defaults
```

**What it does:**
- Creates `hyle.yaml` in current directory
- Sets name (must be unique with author on registry)
- Sets author, version (default: 0.1.0), license (default: MIT)
- Initializes empty blueprint domains (ontology, craft, identities, ethics)

**Next steps:** Run scan commands to populate domains, then publish.

---

### `hyle search`

Search the registry for blueprints.

```bash
hyle search java spring tdd          # Search by tech + features
hyle search claude anthropic          # Search by LLM provider
hyle search python ollama             # Multi-provider search
hyle search react typescript claude   # Mix all tags
hyle search --tag budget              # Filter by tag (e.g. recommendation category)
hyle search --tag bedrock             # Filter by tag (e.g. harness)
hyle search --author jane-doe         # Filter by author
hyle search --limit 50                # Show top 50 (default: 20)
```

**Tags:** Framework/language (java, spring, react, typescript), LLM provider (claude, anthropic, openai, gemini, ollama), capability (tdd, testing, security, offline, budget).

**Output:** Blueprint name, author, version, stars, description, tags.

---

### `hyle pull`

Fetch and apply a blueprint to your project.

```bash
hyle pull claude-java-springboot         # Pull latest version
hyle pull username/starter@1.0.0         # Pull specific version
hyle pull my-blueprint --dry-run          # Preview diff without applying
hyle pull my-blueprint --dry-run --force  # Preview with potential overwrites
hyle pull my-blueprint --force            # Apply, overwriting existing files
hyle pull my-blueprint --yes              # Skip confirmations
hyle pull <name> --offline                # Use cached registry metadata
```

**What it does:**
1. Fetch manifest from registry
2. Display diff preview (files to add/update)
3. Verify SHA-256 checksums
4. Check declared dependencies are installed
5. Apply files to project (with git tracking)

**Verify after pull:**
```bash
git diff HEAD              # See exact changes
hyle verify                # Check dependencies, checksums, models
```

---

### `hyle publish` / `hyle push` / `hyle release`

Publish your blueprint to the registry.

**Choose based on changes:**

| Command | Version bump | Status | When |
|---------|--------------|--------|------|
| `hyle snapshot` | Patch: 0.1.0 → 0.1.1 | WIP, not listed | Still testing |
| `hyle push` | Minor: 0.1.0 → 0.2.0 | Stable, listed | Backward compatible |
| `hyle release` | Major: 0.1.0 → 1.0.0 | Stable, listed | Breaking changes |

```bash
hyle push                    # Minor bump, publish stable
hyle release                 # Major bump, publish stable
hyle snapshot                # Patch bump, WIP release
hyle push --dry-run          # Preview what will be published
```

**Requires:**
- GitHub account (OAuth login)
- hyle.yaml with unique name + author
- Git remote (auto-detected from origin)

---

### `hyle login` / `hyle logout`

Authenticate with registry (GitHub OAuth).

```bash
hyle login                   # Authenticate, opens browser
hyle login --registry <url>  # Use custom registry
hyle logout                  # Remove stored auth
```

---

## Scan Commands

Auto-detect and populate blueprint domains from your project files.

Each command scans for files matching patterns, adds them to `hyle.yaml`, and respects `.hyleignore` exclusions.

### `hyle ontology`

Scan for knowledge files: CLAUDE.md, specs, features, diagrams.

```bash
hyle ontology                     # Scan entire project
hyle ontology docs/               # Scan specific directory
hyle ontology CLAUDE.md specs/    # Scan specific paths
hyle ontology --dry-run           # Preview without modifying hyle.yaml
hyle ontology --add docs/README   # Add single file
```

**Patterns matched:**
- `CLAUDE.md` (project context)
- `*.md` (all markdown)
- `docs/**/*.md` (documentation)
- `spec/**/*.md`, `requirements/**/*.md`, `architecture/**/*.md`

**Files added to:** `blueprint.ontology`

---

### `hyle craft`

Scan for technical structure: build configs, MCP setups, dependency files.

```bash
hyle craft                        # Scan entire project
hyle craft .                      # Scan current directory
hyle craft --dry-run              # Preview without modifying
hyle craft --add package.json     # Add single file
```

**Patterns matched:**
- `package.json`, `tsconfig.json`, `pom.xml`, `Cargo.toml` (dependency/build files)
- `ARCHITECTURE.md`, `SKILLS.md` (technical docs)
- `.claude/**/*.md` (harness config)
- `config/**/*.json` (configuration)
- `.eslintrc*`, `.prettierrc*`, `biome.json` (linting/formatting)

**Files added to:** `blueprint.craft`

---

### `hyle identities`

Scan for agent roles and personas.

```bash
hyle identities                       # Scan entire project
hyle identities .claude/agents/       # Scan agent directory
hyle identities --dry-run             # Preview without modifying
```

**Patterns matched:**
- `AGENTS.md` (main agent definitions)
- `.claude/agents/**/*.md` (Claude Code agents)
- `agents/**/*.md`, `identities/**/*.md` (framework-specific agents)

**Files added to:** `blueprint.identities`

---

### `hyle ethics`

Scan for compliance, policies, and access controls.

```bash
hyle ethics                          # Scan entire project
hyle ethics policies/                # Scan policy directory
hyle ethics --dry-run                # Preview without modifying
```

**Patterns matched:**
- `*.cedar` (Cedar access-control policies)
- `evals/**/*.ts`, `evals/**/*.js` (TruLens/Ragas evals)
- `ETHICS.md`, `COMPLIANCE.md`, `PRIVACY.md` (policy docs)
- `policies/**/*.md` (policy files)

**Files added to:** `blueprint.ethics`

---

## Validation & Verification

### `hyle validate`

Validate a `hyle.yaml` manifest for structure and correctness.

```bash
hyle validate hyle.yaml           # Validate file
hyle validate hyle.yaml --json    # Output validation result as JSON
```

**Checks:**
- Required fields (name, author, version)
- Semantic versioning format (x.y.z)
- File glob patterns compile
- No duplicate entries across domains
- Valid SPDX license identifiers
- Tag format (max 20, max 100 chars each)

---

### `hyle verify`

Post-pull sanity check: verify dependencies, checksums, model availability.

```bash
hyle verify                  # Check all installed blueprints
```

**Checks:**
1. Declared dependencies installed (PATH lookup)
2. Dependency versions match constraints
3. File checksums match registry
4. Recommended models available (via registry)

---

## Dependency & Version Management

### `hyle outdated`

Show installed blueprints with newer versions available.

```bash
hyle outdated             # Check all blueprints
hyle outdated --json      # Output as JSON
```

---

### `hyle upgrade`

Upgrade blueprint(s) to latest version.

```bash
hyle upgrade my-blueprint   # Upgrade specific blueprint
hyle upgrade                # Upgrade all (prompts per blueprint)
hyle upgrade --yes          # Skip confirmations
```

---

## Extension Commands

Optional LLM-powered features. Require explicit install via `hyle install`.

### `hyle install`

Install extensions that unlock LLM-powered features.

```bash
hyle install index                      # Scan + generate metadata index
hyle install ontology-structure         # LLM: generate ontology docs
hyle install identities-structure       # LLM: generate agent specs
```

**Available extensions:**
| Extension | Requires | What |
|-----------|----------|------|
| `index` | ANTHROPIC_API_KEY | LLM-powered metadata indexing |
| `ontology-structure` | ANTHROPIC_API_KEY | Generate ontology summaries |
| `identities-structure` | ANTHROPIC_API_KEY | Generate agent role specs |

---

### `hyle index`

Generate LLM-powered metadata index.

```bash
hyle index                    # Index all domains → hyle.json
hyle index --dry-run          # Print to stdout instead of writing
hyle index --domain ontology  # Reindex single domain
```

Requires `hyle install index` and ANTHROPIC_API_KEY.

---

## Global Options

Available on any `hyle` command:

```bash
hyle <command> --offline    # Skip all network calls (use local cache)
hyle --help                 # Show help
hyle --version              # Show version
```

---

## Configuration Files

### `hyle.yaml` — Blueprint Manifest

In project root. Published to registry.

```yaml
name: my-blueprint
author: jane-doe
version: 0.1.0
description: My AI project
license: MIT

blueprint:
  ontology:
    - CLAUDE.md
    - docs/**/*.md
  craft:
    - package.json
    - ARCHITECTURE.md
  identities:
    - AGENTS.md
  ethics:
    - policies/*.cedar
```

See [CONFIG.md](CONFIG.md) for full reference.

---

### `.hyle` — Local Config

In project root or global `~/.hyle`. Not published.

```yaml
remote_url: https://registry.hylé.com      # Registry URL
```

Auth is handled separately by `hyle login` (stores an OAuth token in `~/.hyle/auth.json`), not via this file.

See [CONFIG.md](publish/config.md) for full reference.

---

### `.hyleignore` — Exclusions

Git-style patterns to exclude from publish.

```
# Environment & secrets
.env
.env.local
*.pem
*.key
credentials.json

# Local config
config/local.*
.vscode/
.idea/
```

See [CONFIG.md](publish/config.md) for full reference.

---

## Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `HYLE_REGISTRY_URL` | Override registry URL | `export HYLE_REGISTRY_URL=http://localhost:3000` |
| `HYLE_ALLOW_INSECURE` | Allow non-HTTPS / localhost `remote_url` (dev only) | `export HYLE_ALLOW_INSECURE=1` |

---

## Tips & Common Workflows

### Publishing Your First Blueprint

```bash
# 1. Create blueprint structure
hyle init                          # Generate hyle.yaml

# 2. Populate domains with your files
hyle ontology                      # Scan knowledge files
hyle craft                         # Scan technical files
hyle identities                    # Scan agent definitions
hyle ethics                        # Scan policies

# 3. Review & refine
vim hyle.yaml                      # Edit if needed
hyle validate hyle.yaml            # Check syntax

# 4. Publish
hyle login                         # GitHub OAuth
hyle push --dry-run                # Preview what will publish
hyle push                          # Publish as minor version (stable)
```

### Keeping Dependencies Updated

```bash
# Check for updates
hyle outdated

# Upgrade all blueprints
hyle upgrade --yes

# Or upgrade one at a time
hyle upgrade my-blueprint
```

### Local Registry Testing

```bash
# Use local dev registry
export HYLE_REGISTRY_URL=http://localhost:3000

# Operations now use local registry
hyle search my-test-blueprint
hyle pull my-test-blueprint
hyle push                          # Publish to local
```

---

## See Also

- [Publishing guide](publish/index.md) — Full walkthrough from idea to registry
- [Config reference](publish/config.md) — Detailed `hyle.yaml`, `.hyle`, `.hyleignore`
- [Troubleshooting](troubleshooting.md) — Common errors & fixes
- [Concepts](concepts.md) — Mental models: pull flow, publish flow, four domains
