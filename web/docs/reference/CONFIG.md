# Configuration Guide

How to configure `hyle.yaml`, `.hyle`, and `.hyleignore` for your blueprint.

---

## Quick Reference

- **`hyle.yaml`** — Blueprint manifest (published to registry). What files, models, dependencies.
- **`.hyle`** — Local project config (not published). Registry URL only; auth is handled separately by `hyle login`.
- **`.hyleignore`** — Git-style exclusion patterns (API keys, secrets).

---

## Patterns & Use Cases

### Pattern 1: Simple Blueprint (Just Claude)

Use this for small projects with no external dependencies.

```yaml
name: my-first-blueprint
author: jane-doe
version: 0.1.0
description: A Claude project with CLAUDE.md and agent identities
license: MIT

blueprint:
  ontology:
    - CLAUDE.md
  identities:
    - .claude/agents/*.md
```

**When to use:** Personal projects, learning, quick prototypes.

**Files:** Just CLAUDE.md + agent definitions. No craft or ethics.

---

### Pattern 2: Multi-Provider Blueprint with Compatibility

Use this for projects that work across multiple LLMs and harnesses.

```yaml
name: flexible-agent-framework
author: eng-team
version: 1.2.0
description: Agent setup compatible with Claude, OpenAI, local Ollama, and AWS Bedrock
license: Apache-2.0
tags: [multi-provider, agents, production]

recommendations:
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
    - ollama/qwen2.5:14b
  
  budget:
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
    - ollama/qwen2.5:7b
  
  offline:
    - ollama/qwen2.5:14b
  
  harness:
    - bedrock/anthropic.claude-3-sonnet
    - cursor/claude-sonnet-4-6

dependencies:
  - name: node
    version: ">=18.0"
    url: https://nodejs.org

blueprint:
  ontology:
    - CLAUDE.md
    - docs/features/*.md
  craft:
    - SKILLS.md
    - ARCHITECTURE.md
    - package.json
  identities:
    - AGENTS.md
    - .claude/agents/*.md
  ethics:
    - policies/*.cedar
```

**When to use:** Production services, multi-team setups, cost-optimized deployments. Declare what works; users choose their LLM.

**Key decision:** Which LLMs to test/validate with? List under appropriate category (universal, budget, offline, etc.).

---

### Pattern 3: Corporate/Team Blueprint with Inheritance

Use this for org-wide base configs that projects extend.

```yaml
name: acme-base-config
author: acme-platform-team
version: 2.0.0
description: ACME standard agent config with compliance policies
license: CC-BY-4.0
tags: [internal, base, compliance, cedar]

blueprint:
  ontology:
    - CLAUDE.md
    - docs/acme-standards.md
  craft:
    - ARCHITECTURE.md
    - package.json
  ethics:
    - policies/data-handling.cedar
    - policies/logging.cedar
```

**Child blueprint extends it:**

```yaml
name: acme-java-springboot
extends:
  - acme-base-config@2.0.0  # Inherits base config + policies
version: 1.0.0
description: ACME Spring Boot agents (extends base config)
author: jane-doe

blueprint:
  ontology:
    - docs/spring-specifics.md  # Added on top
  overrides:
    - CLAUDE.md  # Replaces parent's CLAUDE.md instead of merging
  craft:
    - pom.xml
    - spring-config.yaml
```

**When to use:** Organizations with compliance requirements, shared infrastructure, multi-team governance.

**Inheritance rule:** Child overrides parent; max depth 2 (no grandparents).

---

### Pattern 4: Blueprint with Heavy Dependencies

Use this when your agents require external tools (Cedar, CLI tools, databases).

```yaml
name: claude-cedar-framework
author: security-team
version: 1.0.0
description: Agent framework with Cedar policy enforcement
license: MIT
tags: [claude, cedar, authz, policies]

dependencies:
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar
  - name: node
    version: ">=18.0"
    url: https://nodejs.org
  - name: docker
    version: ">=20.0"
    url: https://www.docker.com
  - name: spec-kit
    version: ">=1.0"
    url: https://www.npmjs.com/package/spec-kit
    install:
      macos: npm install -g spec-kit
      linux: npm install -g spec-kit
      windows: npm install -g spec-kit

blueprint:
  ontology:
    - CLAUDE.md
    - specs/*.pdf
  craft:
    - ARCHITECTURE.md
    - package.json
  identities:
    - AGENTS.md
  ethics:
    - policies/*.cedar
    - compliance/readme.md
```

**When to use:** Framework-heavy projects, security-critical workflows, complex tech stacks.

**Install resolution:** On `hyle pull`, Hylé checks each dependency:
1. Local PATH lookup
2. Version check (matches constraint?)
3. If missing, warn user + suggest install command

---

### Pattern 5: Local Development Setup

Configure `.hyle` in your project directory to override global defaults.

```yaml
# .hyle — project-local config

remote_url: http://localhost:3000              # Use local registry for testing
```

Save to `<project-root>/.hyle`. Local config overrides global `~/.hyle`.

**When to use:** Development, testing locally, team-specific overrides.

---

### Pattern 6: Secrets & Exclusions

Use `.hyleignore` to prevent accidental publication of API keys, credentials, local configs.

```
# .hyleignore — file exclusions for hyle push

# Environment
.env
.env.local
.env.*.local

# Secrets
*.pem
*.key
*.p12
*.jks
credentials.json
aws-credentials
secrets/

# Local config
config/local.*
docker-compose.local.yml
.vscode/
.idea/

# Private docs
docs/private/
INTERNAL_*.md
```

**Always add before publishing:**
```bash
# Review what will be published
hyle pull <name> --dry-run

# Or directly inspect
git ls-files  # See what's committed
hyle push --dry-run  # See what hyle will publish
```

---

## Complete Field Reference

### hyle.yaml

| Field | Required | Type | Description |
|-------|----------|------|---|
| `name` | ✅ | string | Blueprint identifier (1–64 chars, lowercase + hyphens). Must be unique with author name on registry. |
| `author` | ✅ | string | Author name (1–64 chars, lowercase + hyphens). Combined with `name` for uniqueness. |
| `version` | ✅ | string | Semantic version: `x.y.z` or `x.y.z-snapshot`. Patch bumps snapshot, minor/major bumps stable. |
| `description` | — | string | Single-line summary (shown in search results + detail page). |
| `url` | ✅ on publish | string | GitHub repo URL. Auto-detected from git remote origin; can be overridden here. |
| `license` | — | string | SPDX license identifier (`MIT`, `Apache-2.0`, `CC-BY-4.0`, etc.). Defaults to `MIT`. |
| `tags` | — | array of strings | Searchable keywords (e.g., `[java, spring, tdd, claude]`). 1–100 chars each, max 20 tags. |
| `recommendations` | — | object | LLMs tested with this blueprint, grouped by category. See Model Recommendations section below. |
| `dependencies` | — | array of objects | External tools required to use this blueprint. See Dependencies section below. |
| `blueprint.ontology` | — | array of strings | Knowledge files: CLAUDE.md, specs, features, diagrams, examples. Glob patterns allowed. |
| `blueprint.craft` | — | array of strings | Technical structure: SKILLS.md, ARCHITECTURE.md, package.json, build configs, MCP setups. Glob patterns. |
| `blueprint.identities` | — | array of strings | Agent definitions: AGENTS.md, `.claude/agents/*.md`, persona configs. Glob patterns. |
| `blueprint.ethics` | — | array of strings | Policies + constraints: `.cedar` files, TruLens/Ragas evals, compliance docs. Glob patterns. |
| `blueprint.overrides` | — | array of strings | Files in child that fully replace parent's version (instead of merging). |
| `extends` | — | array of strings | Parent blueprints to inherit from (e.g., `["acme-base@2.0.0"]`). Max depth 2. |
| `forks` | — | array of strings | Blueprints this was derived from (attribution only, no inheritance). |

**File patterns:** Glob-style (`*.md`, `docs/**/*.pdf`). Relative to project root.

---

### Model Recommendations

Share which LLMs you tested. This is feedback for other users, not enforcement — anyone can try any model.

```yaml
recommendations:                        # Optional: LLMs you tested
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
    - ollama/qwen2.5:14b
  
  budget:
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
    - ollama/qwen2.5:7b
  
  offline:
    - ollama/qwen2.5:14b
  
  harness:
    - bedrock/anthropic.claude-3-sonnet
    - cursor/claude-sonnet-4-6
```

**Recommendation categories:** (freeform, define as needed)
- `universal` — Tested with any LLM
- `budget` — Works with cheap/small models
- `offline` — Works with local models (Ollama, etc.)
- `advanced` — Requires capable model (Sonnet+)
- `harness` — Platform-specific (Bedrock, Cursor, Hermès)

**If no `recommendations` block:** Blueprint has no recommendations yet.

---

### Tags & Search Discoverability

Tags help users find blueprints by technology stack and LLM preferences. Use both framework/language tags and LLM provider tags.

```yaml
tags:
  # Tech stack tags
  - java
  - spring-boot
  - react
  - typescript
  
  # LLM provider/model tags (simple, not exact model versions)
  - claude          # Any Claude model
  - anthropic       # Anthropic family
  - openai          # OpenAI family
  - gemini          # Google Gemini
  - gemma           # Google Gemma
  - ollama          # Local/offline models
  
  # Capability tags
  - tdd
  - testing
  - security
  - offline         # Works without internet
```

**Tag guidance:**
- **LLM tags:** Use provider name (`claude`, `anthropic`, `openai`, `gemini`, `gemma`, `ollama`) not full model string
- **Tech tags:** Language, framework, tool (java, spring, react, typescript, tdd, testing, etc.)
- **Capability tags:** What the blueprint does (security, compliance, offline, budget, advanced)
- **Keep simple:** Users search with `hyle search claude java` — tags should match common search terms, not be overly specific

**Examples of good tags:**
```yaml
tags: [java, spring, claude, tdd, testing]       # ✓ Mix LLM + tech
tags: [python, anthropic, openai, offline]       # ✓ Multiple LLM providers
tags: [typescript, react, gemini, api]           # ✓ Clear searchable terms
```

**Examples to avoid:**
```yaml
tags: [anthropic/claude-sonnet-4-6]              # ✗ Too specific
tags: [works-great, my-favorite, needs-node-18] # ✗ Not searchable
```

---

### Dependencies

```yaml
dependencies:
  - name: cedar                         # Tool identifier (used in PATH lookup)
    version: ">=3.0"                    # Semver constraint: ">=3.0", "^2.1", "latest"
    url: https://github.com/cedar-policy/cedar  # Official source URL
    install:                            # Optional: override auto-detection per OS
      macos: brew install cedar
      linux: apt-get install cedar
      windows: choco install cedar
```

**Resolution on hyle pull:**
1. Check local PATH (is tool installed?)
2. Verify version matches constraint
3. If missing/wrong version, check registry DB for install command (keyed by URL)
4. Fall back to `install.<os>` override if provided
5. Prompt user to install manually if nothing works

**Best practice:** Use official package managers (`brew`, `apt`, `npm`) over `curl | bash`.

---

### .hyle — Local Config

Global defaults at `~/.hyle`. Project-local overrides at `<project>/.hyle`. Project config takes precedence.

```yaml
# Registry
remote_url: https://registry.hylé.com           # Default registry URL
```

Authentication is handled separately by `hyle login` (stores an OAuth token in `~/.hyle/auth.json`), not via this file.

**Precedence (lowest to highest):**
1. Defaults in code
2. Global `~/.hyle`
3. Project-local `.hyle`
4. Environment variables
5. Command-line flags

---

### .hyleignore

Git-style patterns to exclude files from `hyle push`. Prevents accidental leaks of secrets, local configs, credentials.

```
# Environment
.env
.env.local
.env.*.local
.env-*

# Secrets & credentials
*.pem
*.key
*.p12
*.jks
credentials.json
private-key.*
aws-credentials
.aws/
.gcloud/

# Local/temp configs
config/local.*
docker-compose.local.yml
.vscode/
.idea/
secrets/
private/
internal/

# Build artifacts (optional; usually excluded by .gitignore anyway)
node_modules/
build/
dist/
*.log
```

**Syntax:** Same as `.gitignore` (wildcards, directories, negation with `!`).

---

## Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `HYLE_REGISTRY_URL` | Override registry URL | `export HYLE_REGISTRY_URL=http://localhost:3000` |
| `HYLE_ALLOW_INSECURE` | Allow non-HTTPS / localhost `remote_url` (dev only) | `export HYLE_ALLOW_INSECURE=1` |

Use the `--offline` flag (not an env var) to skip network calls: `hyle <command> --offline`.

---

## Configuration Precedence (Full Order)

When a setting could come from multiple sources, resolution order is:

1. **Command-line flags** (highest priority)
2. **Environment variables**
3. **Project `.hyle`** (in current directory)
4. **Global `~/.hyle`**
5. **Defaults in `hyle.yaml`**
6. **Built-in defaults** (lowest priority)

**Example:** To temporarily use a different registry:
```bash
hyle pull my-blueprint --registry http://localhost:3000
# Overrides both .hyle files and env var
```

---

## Examples by Use Case

### Development (local testing)
```yaml
# .hyle
remote_url: http://localhost:3000
```

### Production (multi-provider)
```yaml
# hyle.yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
  budget:
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
  offline:
    - ollama/qwen2.5:14b
```

### Enterprise (inheritance + compliance)
```yaml
# hyle.yaml
extends:
  - org-base@1.0.0
blueprint:
  ethics:
    - policies/*.cedar
    - compliance/*.md
```

---

## Tips & Best Practices

1. **Keep `hyle.yaml` in git.** It's your blueprint manifest — version control it.
2. **Never commit `~/.hyle/auth.json`.** It holds your OAuth token; `hyle login`/`hyle logout` manage it for you.
3. **Always add `.hyleignore`.** Prevent accidental secret leaks on publish.
4. **Use `hyle push --dry-run`** before publishing to verify what will be included.
5. **Document dependencies in blueprint description.** Users need to know what's required.
6. **Test compatible models locally.** Verify each compatibility category works before publishing.

---

## Need Help?

- **Config not working?** See [TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md)
- **How to publish?** See [PUBLISHING.md](../guides/PUBLISHING.md)
- **Architecture decisions?** See [ARCHITECTURE.md](ARCHITECTURE.md)
