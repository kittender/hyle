# Hylé Architecture & Design Decisions

Architectural principles, design trade-offs, and known issues.

**Quick Links:**
- [ROADMAP.md](ROADMAP.md) — Shipped, roadmap, phases
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) — Threat model, P0-P10 findings
- [DEPLOYMENT.md](DEPLOYMENT.md) — Operations, monitoring, runbooks
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — Pre-ship checklist
- [CONTRIBUTING.md](CONTRIBUTING.md) — Dev setup, testing, PR workflow

---

## System Architecture

```mermaid
graph LR
    CLI["CLI<br/>Bun+TypeScript<br/>commands/"]
    Config["Config<br/>.hyle<br/>hyle.yaml"]
    RegistryAPI["Registry API<br/>Bun HTTP<br/>handlers/"]
    GitHubRaw["GitHub<br/>raw.githubusercontent.com<br/>blueprint files"]
    WebUI["Web UI<br/>Angular<br/>search/detail"]
    GitHub["GitHub OAuth"]
    Resend["Resend<br/>email service"]
    
    CLI -->|read/write| Config
    CLI -->|publish,pull,<br/>search| RegistryAPI
    RegistryAPI -->|fetch files| GitHubRaw
    RegistryAPI -->|verify author| GitHub
    RegistryAPI -->|send notifications| Resend
    WebUI -->|search,fetch| RegistryAPI
    WebUI -->|auth| GitHub
    
    style CLI fill:#42b983
    style RegistryAPI fill:#42b983
    style WebUI fill:#35495e
    style GitHub fill:#000
    style Resend fill:#ffc40e
    style GitHubRaw fill:#000
```

---

---

## See Also

- [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) — Current constraints + known issues (what doesn't work yet)
- [SECURITY_AUDIT.md](SECURITY_AUDIT.md) — Threat model, P0-P10 findings, verification checklist

---

## Architectural Constraints

1. **Core CLI is programmatic only**: no LLM required, no network call on every command, fast and scriptable
2. **Config lives in project or global `.hyle`**: not in `hyle.yaml` (manifest is for publishing)
3. **Four domains are orthogonal**: ontology (knowledge), craft (technical), identities (personas), ethics (constraints). A file belongs to exactly one domain
4. **Inheritance depth ≤ 2**: prevents opaque dependency chains
5. **Security is defense-in-depth**: scans + author tiers + pull warnings + user review (no single gate)
6. **GitHub is the file store**: Blueprints live on publishers' GitHub repos. Hylé registry stores only manifests + per-file checksums. On pull, files are fetched directly from GitHub (raw.githubusercontent.com)
7. **Publisher must own a GitHub repo**: A public GitHub repo is required to publish. The repo link is auto-detected from `git remote` (no extra setup after first push)
8. **Registry publish history is public**: publish history always visible, including flagged versions with reasons

---

## Model Configuration

Blueprints declare recommendations: which LLMs author tested.

```yaml
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
```

Users choose their LLM freely. Recommendations help discover tested setups. `hyle search` filters by tag (e.g., `--tag budget`, `--tag bedrock`) — authors should tag blueprints to match their recommendation categories.

---

---

## See Also

- [README.md](../README.md) — Product overview
- [CONFIG.md](CONFIG.md) — Configuration reference
- [ROADMAP.md](../ROADMAP.md) — Roadmap, phases, shipped features
- [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) — Current constraints
- [SECURITY_AUDIT.md](../security/SECURITY_AUDIT.md) — Threat model, findings
- [DEPLOYMENT_QUICK_START.md](../operations/DEPLOYMENT_QUICK_START.md) — 5-minute setup
- [DEPLOYMENT.md](../operations/DEPLOYMENT.md) — Production operations
- [CONTRIBUTING.md](../guides/CONTRIBUTING.md) — Dev setup, testing
- [RELEASE_CHECKLIST.md](../operations/RELEASE_CHECKLIST.md) — Pre-ship checklist
