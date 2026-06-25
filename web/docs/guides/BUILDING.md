# Building Your Own Blueprint

Step-by-step guide: from "I have a working project" to "published blueprint."

---

## Step 1: Prepare Your Project

Blueprint = your existing project + packaging. No code changes needed yet.

### Requirements

- Git repository (local or GitHub)
- CLAUDE.md (even if minimal)
- At least one other file (AGENTS.md, ARCHITECTURE.md, package.json, etc.)

### Check prerequisites

```bash
cd your-project/

# Must have git
git status
# Output: On branch main / nothing to commit

# Must have committed code
git log --oneline | head -5
# Output: abc1234 latest commit / def5678 ...

# Must have at least one Claude-related file
ls -la CLAUDE.md AGENTS.md 2>/dev/null
# At least one should exist
```

**Not ready?** Create minimal files first:

```bash
# Minimal CLAUDE.md
cat > CLAUDE.md <<EOF
# Project Context

You are building [your-project]. Key info:
- Tech stack: Python / Node / Java
- Main file: src/main.py
- Key dependency: Framework X

Your job: [describe role]
EOF

git add CLAUDE.md
git commit -m "docs: add Claude context"
```

---

## Step 2: Organize Into Four Domains

Categorize your files into: **ontology, craft, identities, ethics**.

### Domain breakdown

| Domain | What | Examples |
|--------|------|----------|
| **Ontology** | Knowledge: what, why, specs | CLAUDE.md, spec.md,<br>features.md, EXAMPLES.md |
| **Craft** | Technical: how, practices, tools | ARCHITECTURE.md, package.json,<br>pom.xml, docker-compose.yml,<br>.mcp.json |
| **Identities** | Personas: who, agent roles | AGENTS.md,<br>.claude/agents/analyzer.md,<br>.claude/agents/responder.md |
| **Ethics** | Constraints: limits, compliance | policies/*.cedar, audit.md,<br>PRIVACY.md, compliance/*.md |

### Organize your files

Repo structure:

```
your-project/
├── CLAUDE.md                 # Ontology
├── AGENTS.md                 # Identities
├── ARCHITECTURE.md           # Craft
├── package.json              # Craft
├── docs/
│   ├── features.md           # Ontology
│   ├── examples.md           # Ontology
│   └── setup.md              # Craft
├── .claude/agents/
│   ├── analyzer.md           # Identities
│   └── responder.md          # Identities
├── policies/
│   ├── data-handling.cedar   # Ethics
│   └── logging.cedar         # Ethics
└── .hyleignore               # (create)
```

**Tip:** Don't reorganize — Hylé scans your structure as-is. Just categorize mentally.

---

## Step 3: Add .hyleignore

Prevent accidental secret leaks.

```bash
cat > .hyleignore <<EOF
# Environment
.env
.env.local
.env.*.local

# Secrets
*.pem
*.key
*.p12
credentials.json
secrets/
.aws/
.gcloud/

# Local configs
config/local.*
.vscode/
.idea/

# Build / logs
node_modules/
dist/
build/
*.log
EOF

git add .hyleignore
git commit -m "chore: add .hyleignore"
```

---

## Step 4: Initialize Blueprint

```bash
hyle init
```

Follow prompts:

- **Blueprint name:** `my-cool-project` (lowercase, hyphens, unique on registry)
- **Author:** `jane-doe` (your GitHub username or Hylé handle)
- **Description:** "What does this blueprint provide?" (one sentence)
- **License:** `MIT` (or CC-BY-4.0, Apache-2.0, etc.)

Output: `hyle.yaml` at project root.

```yaml
name: my-cool-project
author: jane-doe
version: 0.1.0
description: My AI project with Claude
license: MIT

blueprint:
  ontology: []
  craft: []
  identities: []
  ethics: []
```

---

## Step 5: Auto-Scan & Populate Domains

Hylé finds files matching patterns in each domain:

```bash
# Scan all domains
hyle ontology
hyle craft
hyle identities
hyle ethics

# Or point to specific paths
hyle ontology docs/ CLAUDE.md
hyle craft .
hyle identities .claude/agents/
hyle ethics policies/
```

Hylé updates `hyle.yaml` with file paths:

```yaml
blueprint:
  ontology:
    - CLAUDE.md
    - docs/features.md
    - docs/examples.md
  craft:
    - ARCHITECTURE.md
    - package.json
    - docs/setup.md
  identities:
    - AGENTS.md
    - .claude/agents/analyzer.md
    - .claude/agents/responder.md
  ethics:
    - policies/data-handling.cedar
    - policies/logging.cedar
```

**Review & edit manually** if needed:

```bash
# Edit to remove unimportant files
vim hyle.yaml

# Or add specific patterns
blueprint:
  ontology:
    - CLAUDE.md
    - docs/**/*.md          # Glob pattern
  craft:
    - package.json
    - src/**/*.config.*     # Tech-specific configs
```

---

## Step 6: Declare Models

### No recommendations yet

```yaml
# (no recommendations section — users try any model)
```

### With recommendations (tested models)

```yaml
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

**Decision tree:**

- First version? **Skip recommendations for now**
- Tested with multiple models? **Add recommendations block**
- Want budget-conscious users to find it? **List in budget category**
- Want discoverability by model? **Use tags** (e.g., `claude`, `gemini`, `ollama`, `qwen`, `codex`, `local`, `hermes`, `bedrock`)

---

## Step 7: Declare Dependencies

What external tools does this blueprint require?

```yaml
dependencies:
  - name: node
    version: ">=18.0"
    url: https://nodejs.org
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar
```

**Common dependencies:**

```yaml
# Node.js
- name: node
  version: ">=18.0"
  url: https://nodejs.org

# Python
- name: python
  version: ">=3.9"
  url: https://python.org

# Java
- name: java
  version: ">=11"
  url: https://adoptopenjdk.net

# Docker
- name: docker
  version: ">=20.0"
  url: https://www.docker.com

# Cedar (policy language)
- name: cedar
  version: ">=3.0"
  url: https://github.com/cedar-policy/cedar
```

**On pull:** Hylé checks each tool exists + version matches. If not, warns user.

---

## Step 8: Review & Test Locally

```bash
# Verify manifest is correct
hyle verify

# Check what will be published
hyle push --dry-run
# Output: Shows files + checksums

# Try pulling the draft locally
hyle pull <your-name>/<your-blueprint> --dry-run
# (Only works if already published; skip this step for first publish)
```

**Common issues:**

- File path wrong → `hyle verify` catches it
- Secret leaked → `hyle verify` warns
- Large files → increase size limits in `.hyle`
- Missing dependency → `hyle verify` lists them

---

## Step 9: Commit & Push to GitHub

Blueprint must be on GitHub to publish.

```bash
# Ensure all blueprint files are committed
git add hyle.yaml .hyleignore CLAUDE.md AGENTS.md ARCHITECTURE.md
git commit -m "feat: package as Hylé blueprint"
git push origin main
```

---

## Step 10: Publish to Registry

### First time: create + publish

```bash
hyle push 0.1.0
# Publishes v0.1.0 as stable (listed in registry)

# Or, for WIP/testing:
hyle snapshot
# Publishes v0.1.0-snapshot (not listed as stable)
```

### Check registry

```bash
hyle search <your-blueprint-name>
# Should appear in results within ~30s

# View on web
open https://registry.hylé.com/u/<your-author>
```

---

## Step 11: Iterate & Update

### Bug fix or minor improvement

```bash
# Make changes
vim CLAUDE.md
git add CLAUDE.md
git commit -m "fix: clarify agent context"
git push

# Auto-increment version (0.1.0 → 0.2.0)
hyle push

# Users can upgrade
# hyle upgrade org/blueprint
```

### Major refactor or breaking change

```bash
# Changes to agent interface, removed files, etc.
git add . && git commit -m "breaking: restructure agents"
git push

# Major version bump (0.1.0 → 1.0.0)
hyle release

# Users must consciously upgrade
# hyle pull org/blueprint@1.0.0
```

### Work-in-progress sharing

```bash
# Share draft with team before finalizing
hyle snapshot
# Publishes v0.1.0-snapshot (no SLA, may be overwritten)
# Users pull: hyle pull org/blueprint@0.1.0-snapshot
```

---

## Step 12: Promote & Share

### Add badge to GitHub profile

```markdown
[![Hylé blueprints](https://registry.hylé.com/badge/u/your-username)](https://registry.hylé.com/u/your-username)
```

### Link from README

```markdown
## Installation via Hylé

```bash
hyle pull <your-author>/<your-blueprint>
```

See [Hylé blueprint guide](https://registry.hylé.com/docs) for details.
```

### Get reviewed

Post to community:
- GitHub Discussions: "I published a new blueprint"
- Twitter/LinkedIn: Link to registry
- Local AI meetups: Share & present

---

## Common Patterns

### Pattern: Team Library

```yaml
name: team-lib
author: acme-platform
# Multiple teams can depend on this base

blueprint:
  ontology:
    - docs/standards.md
  ethics:
    - policies/*.cedar
```

Other teams extend it:

```yaml
# In their project
extends:
  - acme-platform/team-lib@1.0.0
```

### Pattern: Language-Specific Starter

```yaml
name: claude-python-fastapi
author: your-name
tags: [python, fastapi, claude, agents]

dependencies:
  - name: python
    version: ">=3.10"
    url: https://python.org
  - name: pip
    version: ">=21"
    url: https://pip.pypa.io

blueprint:
  ontology:
    - CLAUDE.md
  craft:
    - ARCHITECTURE.md
    - pyproject.toml
    - requirements.txt
  identities:
    - AGENTS.md
```

### Pattern: Enterprise with Compliance

```yaml
name: secure-agent-base
author: mycompany-platform

blueprint:
  ontology:
    - docs/compliance.md
  craft:
    - ARCHITECTURE.md
  identities:
    - AGENTS.md
  ethics:
    - policies/data-handling.cedar
    - policies/logging.cedar
    - PRIVACY.md
```

---

## Troubleshooting

### "name + author already exists"

Someone else published a blueprint with same name. Choose different name:

```yaml
name: my-awesome-project-v2
# or
name: my-awesome-project-template
```

### "[flagged] — contains hardcoded credentials"

Security scan detected secrets:

```bash
# Find & remove
grep -r "sk-" . --include="*.md" --include="*.yaml"

# Add to .hyleignore
echo "*.key" >> .hyleignore

# Recommit & re-publish
git add . && git commit -m "security: remove secrets"
git push
hyle push  # New version not flagged
```

### "Git remote not found"

```bash
# Add GitHub repo as remote
git remote add origin https://github.com/you/your-project
git push -u origin main

# Re-publish
hyle push
```

---

## Next Steps

1. **Read:** [PUBLISHING.md](PUBLISHING.md) — advanced publishing (versioning strategy, security considerations)
2. **Share:** Post on GitHub / Twitter with `#HyléBlueprint`
3. **Iterate:** Update when your project evolves
4. **Inspire:** Others will fork + extend your blueprint

---

## See Also

- [CONFIG.md](../reference/CONFIG.md) — All config options + patterns
- [PUBLISHING.md](PUBLISHING.md) — Publishing strategy & best practices
- [FAILURE_MODES.md](FAILURE_MODES.md) — Edge cases when things go wrong
