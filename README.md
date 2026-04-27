# Hylé

> **LLM and agentic setup manager** Package your hard-won AI setup. Pull it anywhere. One command.

```bash
hyle pull claude-java-springboot
```

The AI/LLM ecosystem moves fast. Every new project requires rebuilding from scratch — CLAUDE.md, agent definitions, Cedar policies, MCP configs, specs — with a lot of trial and error. When a setup finally works well, it lives in one repo and dies there. 

Hylé ends that. It lets you **package entire AI workflow contexts** — CLAUDE.md, agent definitions, Cedar policies, MCP configs, model fallback chains, compliance evals — into an open-source **substrate** and publish it to a registry. And pull community substrates instead of starting cold !

```bash
hyle search java spring tdd           # Find community substrates
hyle pull claude-java-springboot      # Pull: shows diff, verifies SHA-256, installs deps
hyle push                             # Publish your own (requires an account)
```

A substrate is a `hyle.yaml` manifest + all the files it references. On pull: Hylé shows a full diff before touching anything, verifies the checksum, auto-detects your OS and installs declared dependencies. No surprises.

Core CLI is **programmatic only — no LLM required**, no network call to an AI on every command. Fast and scriptable.

<img src="design/hylé-lotus.png" width="468" height="468" alt="A golden lotus on green waterlilies leaves, emitting a soft light, on a soft forest green background">

---

## Getting started

### Install Hylé

```bash
# macOS
brew install hyle

# Windows
choco install hyle

# Linux
curl -fsSL https://get.hyle.eu | sh
# or: cargo install hyle-cli
```

### Search the registry

```bash
hyle search java spring tdd
```

Full-text search across name, description, and tags.
You can also look into [https://www.hyle.eu/] for a full UI experience with advanced filters.

### Pull a substrate into your project

```bash
hyle pull claude-java-springboot
hyle pull cursor-react-boilerplate
hyle pull research-paper-base          # A substrate doesn't have to be about coding ;)
hyle pull fantasy-book-writing         # Remember LLM are about all languages
hyle pull dnd-masterai-with-sounds     # And a substrate isn't only for business
```

On pull, Hylé will:
1. Show a **diff** of every file that would change — new files, modified lines, deletions — before touching your project
2. Require confirmation (or pass `--dry-run` to exit after diff without applying)
3. Verify the bundle's SHA-256 checksum against the registry manifest — rejects mismatches with an explicit error
4. Extract files; prompt `Overwrite? y/N` per conflict
5. Check which declared dependencies are installed (PATH lookup + semver check)
6. Detect your OS and resolve the correct install command per dependency — no manual adaptation needed. Install on your confirmation.
7. Guide you through anything requiring manual steps, with links
8. Warn upfront about any paid services or SaaS models declared in the substrate

#### What more could it be ?

Maybe we will be able to package any form of ontologies for any types of AI, as source documents;
Like specifying an artistic direction or style to an image generator, or video generator.
Hosting more heavier files requires more funding, though.

```bash
hyle pull francobelge-lineart-diffusion       # Visual ontology and prompting recipes for generative models
```

---

## Saving and sharing your workflow

#### 1. Initialize Hylé in your project

```bash
cd my-project/
hyle init
```

This generates a `hyle.yaml` at the project root after asking basic questions. The `name + author` combination must be unique on the registry — Hylé will check this during init.

#### 2. Scan your project files

```bash
hyle ontology    # Finds CLAUDE.md, specs, features, model interfaces, diagrams
hyle craft       # Finds SKILLS.md, ARCHITECTURE.md, MCP configs, package.json, pom.xml
hyle identities  # Finds AGENTS.md, .claude/agents/*.md
hyle ethics      # Finds *.cedar policies, TruLens configs, Ragas configs, eval setups
```

You can also point each command at a specific path:

```bash
hyle ontology path/to/relevant-files
hyle craft path/to/relevant-files
```

#### 3. Review the manifest

Open `hyle.yaml` and refine it. Every document or path you want to include in the packaged substrate can be added manually.

```yaml
name: claude-java-springboot
version: 1.0.11
description: Powers up any Spring Boot project with state-of-the-art practices
tags: [java, spring, boot, claude, cedar, tdd]
forks:          # Hylé registry link of source substrate if forked from one
author: jean-pierre-kowalski
url: https://github.com/JeanPierreKowalski

models:
  primary:                              # Complex, high-intelligence tasks
    provider: anthropic
    model: "claude-sonnet-4-6"          # Required: model family alias
    model_pin: "claude-sonnet-4-6-20260101"   # Optional: pin exact checkpoint for reproducibility
    tags: [saas, paid]
    fallback:
      - provider: openai               # First fallback: OpenAI paid
        model: "gpt-4o"
        tags: [saas, paid]
      - provider: openai               # Second: free-tier Codex when out of tokens
        model: "codex-mini"
        tags: [saas, free-tier]
      - provider: ollama               # Always keep a local fallback
        model: "qwen2.5:14b"
        tags: [local, free]
  secondary:                           # Lightweight tasks: summaries, indexing, scaffolding
    provider: anthropic
    model: "claude-haiku-4-5"
    tags: [saas, paid]
    fallback:
      - provider: openai               # Free-tier fallback
        model: "gpt-4o-mini"
        tags: [saas, free-tier]
      - provider: ollama               # Local fallback
        model: "qwen2.5:7b"
        tags: [local, free]

dependencies:
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar        # Hylé resolves install per OS from here
  - name: spec-kit
    version: ">=1.0"
    url: https://www.npmjs.com/package/spec-kit
  - name: tessl
    version: latest
    url: https://tessl.io
  - name: peonping
    version: ">=1.0"
    url: https://peonping.com
    install:                                           # Optional: per-OS override
      macos: brew install PeonPing/tap/peon-ping
      linux: curl -fsSL peonping.com/install | bash

substrate:
  ontology:
    - CLAUDE.md
    - path/to/spec/*.pdf
    - path/to/features/*.md
    - path/to/models/*.ts
  ethics:
    - path/to/*.cedar            # Cedar authorization policies
    - path/to/trulens.yaml       # TruLens eval configuration
    - path/to/ragas.yaml         # Ragas evaluation setup
    - path/to/guardrails/*.yaml  # Any agent compliance/safety rules
  identities:
    - AGENTS.md
    - .claude/agents/*.md
  craft:
    - SKILLS.md
    - ARCHITECTURE.md
    - .claude/mcp/*.md
    - package.json
```

##### Declaring dependencies (publisher guide)

The `url` field is the canonical pointer to a dependency — the official GitHub repo, npm package page, or tool website. **Do not write install commands yourself unless auto-detection fails.** Hylé maintains a shared database of install commands per OS, resolved from known URLs. When a puller installs your substrate, Hylé detects their OS and picks the right command automatically — a macOS user never sees an `apt` command, a Linux user never sees `brew`.

| Field | Required | Purpose |
|---|---|---|
| `name` | yes | Identifier used for PATH lookup and version check |
| `version` | yes | Semver constraint (e.g. `>=3.0`, `^2.1`, `latest`) |
| `url` | yes | Official source URL — Hylé resolves install commands from here |
| `install.macos` | no | Override for macOS if Hylé can't auto-detect |
| `install.linux` | no | Override for Linux |
| `install.windows` | no | Override for Windows |

**Resolution order on pull:**
1. Check Hylé's local cache for a known install command for this URL + OS
2. Query the Hylé registry DB (community-contributed, URL-keyed)
3. Fetch the URL and attempt to extract install instructions
4. Fall back to the `install.<os>` override if provided
5. If nothing works: print the `url` and ask the user to install manually

When Hylé resolves a new install command (steps 2–4), it saves it to local cache and optionally contributes it to the shared registry, so future pullers benefit too.

> **If you provide `install` overrides**, prefer official package managers over raw `curl | bash` pipes when possible — they are safer, verifiable, and easier to update.

Add a `.hyleignore` file to explicitly exclude files you never want to share, like API keys, secrets, and private configs:

```
.env
*.pem
*.key
secrets/
config/local.*
```

#### 4. Publish to the registry

The default registry is **[registry.hyle.eu](https://registry.hyle.eu)**. 
You can point to your own remote in `.hyle` (must be a public GitHub URL) but it will be marked as "unverified".

Three publish tiers — no version numbers to remember or type:

| Command | Version bump | Listed as stable | When to use |
|---|---|---|---|
| `hyle snapshot` | patch `x.x.+1` | No | WIP sharing, no SLA — fast and low-commitment |
| `hyle push` | minor `x.+1.0` | Yes | Tested, working substrate |
| `hyle release` | major `+1.0.0` | Yes | Breaking changes to structure or file layout |

Lower positions reset to zero on each bump (`push` resets patch, `release` resets minor+patch). All three accept an explicit version override as an optional arg: `hyle push 1.5.0`.

On any publish, Hylé:
- Bundles all files referenced in `hyle.yaml` (minus `.hyleignore`) with a SHA-256 checksum manifest
- Runs an **automatic security scan** (async). If red flags are found — `curl | bash` patterns, hardcoded credential shapes, skip-confirmation flags, suspicious network calls — the version is marked `[flagged]`: not pullable, content not shown, only flag tags visible. **Push history is always public.**
- Emails you if a newer checkpoint is available for any pinned `model_pin` in your manifest (monthly, one-click update link)

---

## CLI reference

### Core commands

| Command | Description |
|---|---|
| `hyle init` | Interactive setup, generates `hyle.yaml` |
| `hyle pull <name>` | Pull substrate: show diff, verify checksum, check+install deps |
| `hyle pull <name>@<version>` | Pull specific version (checksum-pinned) |
| `hyle pull <name> --dry-run` | Preview diff without applying |
| `hyle snapshot` | Patch bump, unstable — for WIP sharing, no SLA |
| `hyle push` | Minor bump, listed as stable |
| `hyle release` | Major bump, listed as stable, lower numbers reset |
| `hyle ontology [path]` | Scan and add ontology files to `hyle.yaml` |
| `hyle craft [path]` | Scan and add craft files to `hyle.yaml` |
| `hyle identities [path]` | Scan and add identity files to `hyle.yaml` |
| `hyle ethics [path]` | Scan and add ethics files to `hyle.yaml` |
| `hyle search <query>` | Search the substrate registry |
| `hyle audit verify` | Verify chain integrity of a `hyle-audit.log` file |
| `hyle config get <key>` | Read a config value |
| `hyle config set <key> <value>` | Write a config value |

All core commands are **programmatic only** — no LLM required, lightweight, fast.

---

## Configuration

Hylé uses a two-layer config system: global defaults at `~/.hyle`, local overrides at `<project>/.hyle`. Local values take precedence field by field.

```yaml
# ~/.hyle or <project>/.hyle

remote_url: https://registry.hyle.eu    # Default registry
currency: EUR                           # Cost estimates in hyle watch (EUR or USD)
default_llm: fallback                   # Model key from hyle.yaml to use for extensions
auto_inject: true                       # Inject file refs into CLAUDE.md on pull
contribute_deps: true                   # Share resolved dep install commands with registry

split_threshold: "80%"                  # hyle watch --split threshold (% or abs token count)
split_action: ask                       # ask | link | clipboard
audit_retention_days: 90               # Days to keep hyle-audit-*.log files

scan:
  ontology: [.md, .pdf, .docx, .feature, .csv, .ts]
  craft: [package.json, pom.xml, angular.json, .md]
  identities: [.md]
  ethics: [.cedar, trulens.yaml, ragas.yaml, guardrails.yaml]
```

---

## Optional tools

Additional capabilities that may use lightweight LLM calls. Recommend installing a free local model (`ollama pull qwen`) and setting it as the `fallback` LLM to avoid costs.

```bash
hyle install watcher
hyle install structurer
```

### `hyle watch` — live monitoring and context management

```bash
hyle watch                    # Live terminal UI: token consumption, cost estimate. Ctrl+C to exit.
hyle watch --audit            # + hash-chained audit log (see below)
hyle watch --split 80%        # + context-split prompt at 80% of model context limit
hyle watch --split 10000      # + context-split prompt at 10 000 tokens
hyle watch --audit --split 80%  # All three combined
```

#### `--audit` — GDPR-grade audit trail

Writes one `hyle-audit-<session_id>.log` file per session. Each line is a JSON event. The chain is tamper-evident: each entry's `hash` field = SHA-256 of `(prev_hash + all other fields)`. Verify offline with `hyle audit verify`.

| Event | What is recorded |
|---|---|
| `session_start` | Session ID, substrate name+version, model config (provider, model, model_pin, role) |
| `mcp_call` | Tool name, SHA-256 of sanitized args (no raw secrets), SHA-256 of response, tokens in/out |
| `model_switch` | Reason (`quota_exhausted` or `unreachable`), previous model, new model |
| `threshold_event` | Token count, % consumed, action taken (`split_offered` / `split_confirmed` / `dismissed`) |
| `session_end` | Total tokens, cost estimate, session duration |

Raw argument values and responses are **never stored** — only their hashes. Log rotation is configurable (`audit_retention_days` in `.hyle`, default 90 days). Intended for GDPR Article 30 records of processing.

#### `--split` — context-split assistance

When the token threshold is reached, `hyle watch` uses the configured `secondary` model to produce a compact session summary (key decisions, current task state, unresolved questions), then:

- Displays a summary box in the terminal
- Shows a **clickable link** (OSC 8 terminal hyperlink) to open a new session pre-seeded with the summary and a catch-up prompt: *"You are continuing a session. Here is where we left off: `<summary>`. Please confirm you understand and are ready to continue."*
- If terminal links are unsupported: offers to copy the summary + prompt to clipboard instead

Threshold can be set as `80%` (percentage of the active model's context limit) or `10000` (absolute token count). Configure `split_action: ask | link | clipboard` in `.hyle` to control behavior.

### Registry — safety, trust, and community

Every substrate on the registry carries:

- **Pull count** — how many times it has been installed
- **Stars** — from the linked GitHub repo if declared, otherwise registry-specific
- **Likes + reviews** — per-user like (one per substrate) and written reviews with a 1–5 rating
- **Version diff** — "Changes" tab on the website shows a unified diff between any two versions
- **Community flags** — factual, non-qualitative warning tags applied by registered users and reviewed by the Hylé team: `[skips-confirmations]`, `[uses-curl-pipe]`, `[requires-paid-model]`, `[unverified-deps]`, `[ollama-required]`

**Security scan on every publish:** Hylé automatically scans each pushed version for red flags (curl-pipe install patterns, hardcoded credential shapes, skip-confirmation flags, suspicious network calls in agent instructions). Flagged versions are marked `[flagged:<tags>]` — not pullable, content hidden, only flag tags visible. **The full publish history is always public**, including flagged versions with their reason tags.

**Publisher portfolio:** every author gets a public profile at `https://registry.hyle.eu/u/<author>` — all their substrates, stats, and fork chains in one place. Add a badge to your GitHub profile:

```markdown
[![Hylé substrates](https://registry.hyle.eu/badge/u/your-username)](https://registry.hyle.eu/u/your-username)
```

**Model update notifications:** if your substrate declares `model_pin`, Hylé emails you monthly when a newer checkpoint is available for that model — with a one-click "update model_pin" link. No manual tracking required.

---

### `hyle index` — unified document index (LLM-powered)

```bash
hyle index          # Generate hyle.json across all four domains
hyle index --dry-run
```

Scans every file declared in `hyle.yaml` across all four domains (ontology, craft, identities, ethics) and generates a `hyle.json` metadata index. Uses the configured `secondary` model (Haiku, Qwen, or equivalent lightweight LLM) — no heavy model required.

For each file, the index captures:

| Field | Description |
|---|---|
| `summary` | 2–4 sentence description of the file's purpose and content |
| `tags` | Semantic keywords extracted from the document |
| `scopes` | Domains or subsystems the document applies to |
| `weight` | Relevance score (0–1) relative to other documents in the same domain |
| `domain` | Which of the four substrate domains the file belongs to |

#### Example `hyle.json`

```json
{
  "generated": "2026-04-27T10:00:00Z",
  "model": "claude-haiku-4-5-20251001",
  "domains": {
    "ontology": [
      {
        "path": "CLAUDE.md",
        "summary": "Primary AI agent instruction file. Defines project conventions, tool usage rules, and coding standards for Claude Code.",
        "tags": ["conventions", "agent-instructions", "coding-standards"],
        "scopes": ["project-wide", "claude-code"],
        "weight": 1.0
      },
      {
        "path": "docs/architecture.md",
        "summary": "High-level system architecture. Covers service boundaries, data flow, and integration points.",
        "tags": ["architecture", "services", "data-flow"],
        "scopes": ["backend", "infrastructure"],
        "weight": 0.7
      }
    ],
    "craft": [
      {
        "path": "SKILLS.md",
        "summary": "Catalog of available Claude Code slash commands and MCP skills installed in this project.",
        "tags": ["skills", "mcp", "slash-commands"],
        "scopes": ["tooling", "claude-code"],
        "weight": 0.9
      }
    ],
    "identities": [],
    "ethics": []
  }
}
```

#### Why `hyle.json` matters

LLMs with limited context or no RAG pipeline can receive `hyle.json` as a single compact file and immediately understand the full map of available knowledge — what documents exist, what they cover, and how relevant each is. This lets agents decide which files to actually read rather than loading everything blindly.

`hyle.json` is excluded from the substrate bundle by default (it is local state, not source). Add it to `.hyleignore` explicitly if needed.

---

## Where does Hylé name comes from ?

In the *hylomorphism doctrine*, developed by the Ancient Greek philosopher Aristotle, the Greek words *ὕλη (hyle: "wood, matter")* and μορφή (morphē: "form") express how the compound of matter gains a substantial form through act, hence becoming a physical entity. 

Projects developed with the assistance of LLM, mimic this potency of matter becoming its own physical entity through actions: LLM allow humans to digest large amounts of information, and arrange its extracted essence and knowledge into a project form meant to be used in the real-world.

In the spirit of hylomorphism, Hylé CLI helps humans act upon a compound of documents (raw matter), hence the name "hylé" which designates this mass of potency, may it be already structured or spread out and chaotic.
Hylé is a simple substrate manager in a world of *hylomorphic* emergent architecture.