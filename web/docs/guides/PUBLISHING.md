# Publishing Blueprints to Hylé Registry

How to package and publish your AI workflow as a reusable blueprint.

---

## 1. Initialize your blueprint

```bash
cd my-project/
hyle init
```

Generates `hyle.yaml` at project root. The `name + author` combination must be unique on the registry — Hylé checks this during init.

**Example output:**
```yaml
name: my-cool-ai-project
author: jane-doe
version: 0.1.0
description: My AI project with Claude
license: MIT

models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6

blueprint:
  ontology: []
  craft: []
  identities: []
  ethics: []
```

---

## 2. Scan and organize files

Hylé covers four domains:

- `ontology` — What? Specifications, goals, features, examples, data
- `craft` — How? Architecture, design, practices, recipes
- `identities` — Who? Agent personas, model behavior specs
- `ethics` — Limits: constraints, compliance, security, privacy

Auto-scan your project:

```bash
hyle ontology    # CLAUDE.md, .cursorrules, specs, features, diagrams
hyle craft       # SKILLS.md, ARCHITECTURE.md, MCP configs, package.json, pom.xml
hyle identities  # AGENTS.md, .claude/agents/*.md
hyle ethics      # *.cedar policies, TruLens/Ragas configs, eval setups
```

Or point to specific paths:

```bash
hyle ontology path/to/relevant-files
hyle craft path/to/relevant-files
```

**Tip:** On first publish, if no files are declared, `hyle push` auto-suggests them.

Add `.hyleignore` to exclude secrets:

```
.env
*.pem
*.key
secrets/
config/local.*
```

---

## 3. Review and refine manifest

Edit `hyle.yaml` to include all files you want in the blueprint:

```yaml
name: claude-java-springboot
version: 1.0.11
description: State-of-the-art Spring Boot + Claude practices
tags: [java, spring, boot, claude, cedar, tdd]
author: jean-pierre-kowalski
url: https://github.com/jean-pierre-kowalski/claude-java-springboot

models:
  primary:
    provider: anthropic
    model: "claude-sonnet-4-6"
    model_pin: "claude-sonnet-4-6-20260101"     # Optional: pin exact checkpoint
    tags: [saas, paid]
    fallback:
      - provider: openai
        model: "gpt-4o"
        tags: [saas, paid]
      - provider: ollama
        model: "qwen2.5:14b"
        tags: [local, free]
  secondary:
    provider: anthropic
    model: "claude-haiku-4-5"
    tags: [saas, paid]
    fallback:
      - provider: openai
        model: "gpt-4o-mini"
        tags: [saas, free-tier]
      - provider: ollama
        model: "qwen2.5:7b"
        tags: [local, free]

dependencies:
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar
  - name: spec-kit
    version: ">=1.0"
    url: https://www.npmjs.com/package/spec-kit

blueprint:
  ontology:
    - CLAUDE.md
    - path/to/spec/*.pdf
    - path/to/features/*.md
  craft:
    - SKILLS.md
    - ARCHITECTURE.md
    - package.json
  identities:
    - AGENTS.md
    - .claude/agents/*.md
  ethics:
    - path/to/*.cedar
    - path/to/trulens.yaml
```

### Declaring dependencies

**What:** External tools your blueprint requires to work (Cedar, Node, Java, databases, CLI tools, etc.).

**Why:** When users `hyle pull` your blueprint, Hylé auto-detects missing tools, checks versions, and warns if they're missing. If deps can't be found, blueprint still installs (doesn't fail), but user gets a warning. Ideally, include an `install.sh` script in your blueprint that handles all dependency setup for your project.

**How:** Add `dependencies` block to `hyle.yaml`. Hylé uses `url` to find official install commands per OS. Don't write install commands yourself — Hylé maintains a shared database keyed by source URL. If your `install.sh` only works on one OS, Hylé warns about OS-specific compatibility.

| Field | Required | Purpose |
|---|---|---|
| `name` | yes | Tool identifier for PATH lookup and version check |
| `version` | yes | Semver constraint (`>=3.0`, `^2.1`, `latest`) |
| `url` | yes | Official source URL (GitHub repo, npm, Maven Central, etc.); Hylé resolves install commands from here |
| `install.macos` | no | Override for macOS if auto-detect fails |
| `install.linux` | no | Override for Linux |
| `install.windows` | no | Override for Windows |

**Resolution on pull:**
1. Check Hylé's local cache for known install command (URL + OS)
2. Query registry DB (community-contributed, URL-keyed)
3. Fetch URL and extract install instructions
4. Fall back to `install.<os>` override if provided
5. Ask user to install manually if nothing works

**Prefer official package managers over `curl | bash` pipes** — they're safer and verifiable.

---

## 4. Publish to registry

**Requirement:** Public GitHub repository. Hylé auto-detects from `git remote get-url origin` or uses `url` field from `hyle.yaml`.

On publish, Hylé will:
1. Auto-detect your GitHub repo URL
2. Verify all declared files are committed and pushed
3. Create git tag `hyle-v{version}` and push to remote
4. Register blueprint with registry: manifest + per-file SHA-256 checksums (no file upload)

Default registry: [registry.hylé.com](https://registry.hylé.com)

### Three publish tiers

| Command | Version | Stable? | When to use |
|---|---|---|---|
| `hyle snapshot` | patch `x.x.+1` | No | WIP sharing, no SLA |
| `hyle push` | minor `x.+1.0` | Yes | Tested, working blueprint |
| `hyle release` | major `+1.0.0` | Yes | Breaking changes |

All accept optional version override: `hyle push 1.5.0`

### On any publish

- **Automatic security scan** (async) on manifest. Red flags (hardcoded credentials, suspicious network calls) mark version `[flagged]`: not pullable, content hidden.
- **Model update emails** (monthly) if you pinned `model_pin` in manifest.
- **Full history is public** — including flagged versions with reason tags.

---

## Registry Safety & Trust

Every blueprint displays:

- **Pull count** — installation frequency
- **Stars** — from GitHub repo or registry
- **Reviews + ratings** — 1–5 star user reviews
- **Version diffs** — unified diff between any two versions
- **Community flags** — factual warnings (`[uses-curl-pipe]`, `[requires-paid-model]`, etc.) applied by registered users, reviewed by Hylé team

**Author portfolio** at `https://registry.hylé.com/u/<your-username>` — all your blueprints, stats, fork chains.

**Badge for GitHub profile:**

```markdown
[![Hylé blueprints](https://registry.hylé.com/badge/u/your-username)](https://registry.hylé.com/u/your-username)
```
