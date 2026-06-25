# Hylé

Hylé is a **blueprint manager** for LLM-powered projects.  
Pull best-practice AI workflows, boilerplates and staples; publish your own.

```bash
hyle pull claude-java-springboot    # Install latest target blueprint
hyle push                           # Publish your own (auto-versioning)
```

<img src="design/hylé-lotus.png" width="468" height="468" alt="A golden lotus on green waterlilies leaves, emitting a soft light, on a soft forest green background">

## Why Hylé

**Reusable, packaged, LLM configs** — like Docker for AI agent configs. Pull a published blueprint (CLAUDE.md, agents, policies, MCP configs, docs) or publish your own recipes. From basic framework templates to highly customized setups, see what the community shared. Hylé's core commands (pull, push, init) are programmatic; metadata lives in Hylé's registry; source code on GitHub for open-source trust and transparency.

Hylé requires :
- *local Git* for pulling
- *a GitHub account* for public publishing

All the blueprints published through CLI will be automatically visible on the official registry website. Anyone can get visibility by contributing to the registry.

---

## Quick Start

### Install

```bash
# macOS
brew install hyle

# Windows
choco install hyle

# Linux
curl -fsSL https://get.hylé.com | sh
```

### Use blueprints

```bash
hyle search java spring tdd                  # Search registry
hyle search react typescript claude          # You can mix tags + LLM recommandations
hyle search python anthropic                 
hyle search fastapi ollama                   
hyle pull claude-java-springboot             # Install
hyle pull username/starter@1.0.0 --dry-run  # Preview before applying
```

On pull: fetch manifest from registry → preview diff → SHA-256 verify → check declared dependencies → apply. Manifests indexed in registry for fast search; source code from GitHub.

### Publish blueprints

```bash
hyle init                      # Generate hyle.yaml
hyle push 0.1.0                # First publish (explicit version)
hyle snapshot                  # Patch bump (WIP)
hyle push                      # Minor bump (stable)
hyle release                   # Major bump (stable)
```

#### Publish only what matters — your manifest is the allowlist

A blueprint is **not** your whole repo. The `hyle.yaml` manifest lists the exact
paths to publish, so only files you explicitly point to ship — nothing else.
This means you can sit inside a 500k-line monorepo, a private product codebase, or
any messy working tree and still publish a clean, focused blueprint. Source files,
secrets, build artifacts, and unrelated code stay put because the manifest never
references them.

You point to precise paths, grouped by the four categories:

```yaml
# hyle.yaml
name: claude-springboot-tdd
author: yourname

ontology:                      # knowledge docs
  - CLAUDE.md
  - docs/architecture/overview.md
craft:                         # technical structure
  - .mcp/servers.json
  - SKILLS.md
identities:                    # agent roles
  - .claude/agents/reviewer.md
  - .claude/agents/test-writer.md
ethics:                        # policies & compliance
  - policies/data-access.cedar
```

Only those eight files get packaged and pushed. The rest of the codebase — however
big — is invisible to the blueprint.

Two ways to fill the manifest:

- **Manual** — list paths yourself for full control.
- **Scan helpers** — `hyle ontology [path]`, `hyle craft [path]`, `hyle identities [path]`,
  `hyle ethics [path]` scan a directory and append matching files to `hyle.yaml`,
  so you opt files *in* rather than risk shipping the whole tree.

Add `.hyleignore` (gitignore-style) as a second guard to exclude API keys, secrets,
or private docs even if a path or scan would otherwise catch them.

---

## Self-Hosted & Open Source

Hylé is **free, open-source software**. Run the registry on your own infra (on-premise or cloud). No vendor lock-in. Infrastructure costs only (similar to self-hosted GitLab, Artifactory, or Jenkins).

---

## How Blueprints Work

100% flexible. Author publishes CLAUDE.md, agents, policies, or any AI workflow. Registry indexes them for search. Each blueprint declares `recommendations` (which LLMs author tested, not enforced) and `dependencies` (node, npm, python, etc.). On `pull`, Hylé verifies dependencies exist before applying.

---

## Documentation

Detailed guides and reference:

**Understanding Hylé:**
- [Core concepts](web/docs/CONCEPTS.md) — User journey, trust tiers, four domains, model fallbacks (with diagrams)

**Getting started:**
- [Building blueprints](web/docs/guides/BUILDING.md) — step-by-step: from project to published blueprint
- [Publishing guide](web/docs/guides/PUBLISHING.md) — versioning strategy, costs, security best practices
- [Example blueprint](web/docs/guides/EXAMPLE_BLUEPRINT.md) — real-world Java Spring Boot + Angular walkthrough
- [Troubleshooting](web/docs/guides/TROUBLESHOOTING.md) — common errors, edge cases & recovery scenarios
- [Quick start (dev)](web/docs/guides/DEV_QUICK_START.md) — local setup
- [Contributing](web/docs/guides/CONTRIBUTING.md) — how to help

**Reference:**
- [CLI Commands](web/docs/reference/CLI_COMMANDS.md) — all `hyle` commands (search, pull, push, scan, verify, etc.)
- [Configuration](web/docs/reference/CONFIG.md) — `hyle.yaml`, `.hyle`, `.hyleignore` — patterns & full reference
- [Models](web/docs/reference/MODELS.md) — tested models (recommendations), advanced vs basic, cost optimization
- [Tags](web/docs/reference/TAGS.md) — comprehensive list of suggested tags for discovery (LLM providers, frameworks, capabilities)
- [Architecture](web/docs/reference/ARCHITECTURE.md) — system design & constraints
- [Known limitations](web/docs/reference/KNOWN_LIMITATIONS.md) — what doesn't work yet & why
- [Registry API](web/docs/reference/REGISTRY_API.md) — API endpoints

**Operations:**
- [Deployment quick start](web/docs/operations/DEPLOYMENT_QUICK_START.md) — self-hosted in 5 minutes (Docker Compose)
- [Deployment (production)](web/docs/operations/DEPLOYMENT.md) — HA, monitoring, incident response
- [Release checklist](web/docs/operations/RELEASE_CHECKLIST.md) — publish & deploy process

**Security:**
- [Security policy](web/docs/security/SECURITY.md) — threat model, mitigations
- [Security audit](web/docs/security/SECURITY_AUDIT.md) — checksum verification, supply-chain safety

**Roadmap:**
- [Feature roadmap](web/docs/ROADMAP.md) — planned features & timeline

