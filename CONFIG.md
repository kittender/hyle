# Configuration Reference

Quick reference for `hyle.yaml`, `.hyle`, and `.hyleignore`.

---

## hyle.yaml — Substrate Manifest

Required fields: `name`, `author`, `version`, `models`. On publish, requires `url` (auto-detected from git remote).

| Field | Type | Description |
|-------|------|---|
| `name` | string | Identifier (1–64 chars, lowercase alphanumeric + hyphens) |
| `author` | string | Author name (1–64 chars, lowercase alphanumeric + hyphens) |
| `version` | string | Semantic version: `x.y.z` or `x.y.z-snapshot` |
| `url` | string | GitHub repo URL (auto-detected on publish) |
| `description` | string | Single-line summary |
| `license` | string | SPDX identifier (e.g., `MIT`, `CC-BY-4.0`) |
| `tags` | array | Searchable tags (1–100 chars each) |
| `models` | object | Primary/secondary model config (see below) |
| `dependencies` | array | External tools/packages |
| `blueprint.ontology` | array | Knowledge docs (CLAUDE.md, specs, features) |
| `blueprint.craft` | array | Technical structure (SKILLS.md, ARCHITECTURE.md, package.json) |
| `blueprint.identities` | array | Agent definitions (.claude/agents/*.md) |
| `blueprint.ethics` | array | Policies (.cedar files, eval configs) |
| `extends` | array | Parent substrates to inherit from (v0.3+) |

### Model Configuration

```yaml
models:
  primary:
    provider: anthropic              # "anthropic", "openai", "ollama"
    model: claude-sonnet-4-6
    model_pin: claude-sonnet-4-6-20260115  # Optional: exact checkpoint
    tags: [saas, paid]
    fallback:
      - provider: openai
        model: gpt-4o
        tags: [saas, paid]
      - provider: ollama
        model: qwen2.5:14b
        tags: [local, free]
  secondary:
    provider: anthropic
    model: claude-haiku-4-5
    fallback:
      - provider: openai
        model: gpt-4o-mini
      - provider: ollama
        model: qwen2.5:7b
```

**Fallback resolution:** Tried in order; skipped if provider out of quota or unreachable. Entries tagged `[local, free]` tried last. Max 5 levels.

**Tags:** `saas`, `paid`, `free-tier`, `local`, `offline`, `production`, `experimental`.

### Dependencies

```yaml
dependencies:
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar
    install:
      macos: brew install cedar
      linux: apt-get install cedar
      windows: choco install cedar
```

| Field | Required | Purpose |
|---|---|---|
| `name` | yes | Identifier for PATH lookup + version check |
| `version` | yes | Semver constraint (`>=3.0`, `^2.1`, `latest`) |
| `url` | yes | Official source (GitHub repo, npm, tool website) |
| `install.<os>` | no | Override install command if auto-detect fails |

**Resolution order:** Local cache → registry DB → URL fetch → manual override → ask user.

---

## .hyle — Local Config

Global defaults at `~/.hyle`; local overrides at `<project>/.hyle`. Local takes precedence.

```yaml
remote_url: https://registry.hylé.com
currency: EUR                        # Cost estimates (EUR or USD)
default_llm: fallback                # Model key from hyle.yaml for extensions
auto_inject: true                    # Inject file refs into agent files on pull
contribute_deps: true                # Share resolved dep commands with registry

split_threshold: "80%"               # hyle watch --split threshold (% or tokens)
split_action: ask                    # ask | link | clipboard
audit_retention_days: 90             # Days to keep hyle-audit-*.log files

scan:
  ontology: [.md, .pdf, .docx, .feature, .csv, .ts]
  craft: [package.json, pom.xml, angular.json, .md]
  identities: [.md]
  ethics: [.cedar, trulens.yaml, ragas.yaml, guardrails.yaml]
```

---

## .hyleignore — Exclusion Patterns

Git-style patterns to exclude files from publishing (API keys, secrets, local configs).

```
.env
.env.local
*.pem
*.key
secrets/
config/local.*
private/
.aws/
.gcloud/
```

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `HYLE_HOME` | Config directory (default: `~/.hyle`) |
| `HYLE_REGISTRY_URL` | Override registry URL |
| `HYLE_OFFLINE` | Force offline mode (no network calls) |
| `HYLE_TOKEN` | Authentication token for registry API |
| `HYLE_DEBUG` | Enable debug logging |

---

## Configuration Precedence

1. Command-line flags (highest priority)
2. Environment variables
3. Local `.hyle` in project
4. Global `~/.hyle`
5. Defaults in `hyle.yaml`
