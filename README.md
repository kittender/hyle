# Hylé

Hylé is a **blueprint manager** for LLM-powered projects. Pull best-practice AI workflows; publish your own.

```bash
hyle pull claude-java-springboot    # Install latest blueprint
hyle push                           # Publish your own (auto-versioning)
```

<img src="design/hylé-lotus.png" width="468" height="468" alt="A golden lotus on green waterlilies leaves, emitting a soft light, on a soft forest green background">

## Why Hylé

Reusable **AI workflow contexts**: CLAUDE.md, agent definitions, policy files, MCP configs, ontology docs — packaged once, installed anywhere. No re-creating boilerplate across projects. Hylé manages the manifest and file list; blueprints live on your GitHub.

**Core CLI is programmatic** — no LLM calls, no network overhead. Fast. Scriptable. [Programmatic commands only — no LLM required.]

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
hyle pull claude-java-springboot             # Install
hyle pull username/starter@1.0.0 --dry-run  # Preview before applying
```

On pull: metadata fetch → diff preview → SHA-256 verify → dependency check → apply. No surprises.

### Publish blueprints

```bash
hyle init                      # Generate hyle.yaml
hyle push --new my-blueprint   # Create + publish
hyle snapshot                  # Patch bump (WIP)
hyle push                      # Minor bump (stable)
hyle release                   # Major bump (stable)
```

---

## Documentation

Detailed guides and reference:

**Getting started:**
- [Publishing guide](web/docs/guides/PUBLISHING.md) — package & publish blueprints
- [Example blueprint](web/docs/guides/EXAMPLE_BLUEPRINT.md) — real-world Angular/Java mono-repo
- [Troubleshooting](web/docs/guides/TROUBLESHOOTING.md) — common errors & fixes
- [Quick start (dev)](web/docs/guides/DEV_QUICK_START.md) — local setup
- [Contributing](web/docs/guides/CONTRIBUTING.md) — how to help

**Reference:**
- [Configuration](web/docs/reference/CONFIG.md) — `hyle.yaml`, `.hyle`, `.hyleignore`
- [Models](web/docs/reference/MODELS.md) — primary vs secondary, cost optimization
- [Architecture](web/docs/reference/ARCHITECTURE.md) — system design
- [Registry API](web/docs/reference/REGISTRY_API.md) — API endpoints

**Operations:**
- [Deployment](web/docs/operations/DEPLOYMENT.md) — self-hosted registry (Bun + SQLite)
- [Release checklist](web/docs/operations/RELEASE_CHECKLIST.md) — publish & deploy process

**Security:**
- [Security policy](web/docs/security/SECURITY.md) — threat model, mitigations
- [Security audit](web/docs/security/SECURITY_AUDIT.md) — checksum verification, supply-chain safety

**Roadmap:**
- [Feature roadmap](web/docs/ROADMAP.md) — planned features & timeline

