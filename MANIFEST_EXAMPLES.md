# Substrate Manifest Examples

Complete examples of valid `hyle.yaml` manifests for different use cases.

## Table of Contents

1. [Minimal Substrate](#minimal-substrate)
2. [Full-Featured Substrate](#full-featured-substrate)
3. [Agent Workflow](#agent-workflow)
4. [Data Pipeline](#data-pipeline)
5. [Cloud Infrastructure](#cloud-infrastructure)
6. [Extending a Substrate](#extending-a-substrate)

---

## Minimal Substrate

Bare minimum manifest with one model and single-category files.

**File**: `hyle.yaml`

```yaml
name: hello-world
author: example
version: 0.1.0
description: Minimal substrate example

models:
  primary:
    provider: anthropic
    model: claude-haiku-4-5

ontology:
  - path: README.md
```

**Usage**:

```bash
hyle init
# Answer prompts:
# Name: hello-world
# Author: example
# Description: Minimal substrate example
# Files: (empty)

# Manually create/add files
echo "# Hello World" > README.md
hyle ontology ./README.md

# Publish
hyle snapshot
hyle push
```

---

## Full-Featured Substrate

Complete manifest with fallback chains, dependencies, all four categories, and versioning constraints.

**File**: `hyle.yaml`

```yaml
name: ai-research-kit
author: anthropic
version: 2.1.0
description: |
  Complete research substrate for AI safety evaluations.
  Includes Claude models, LLM evaluation framework, benchmark datasets,
  and monitoring dashboards for production deployments.

homepage: https://github.com/anthropic-research/ai-research-kit
license: CC-BY-4.0

models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
    model_pin: claude-sonnet-4-6-20260115
    tags: [saas, paid, production]
    fallback:
      - provider: anthropic
        model: claude-opus-4-7
        tags: [saas, paid, high-cost]
      - provider: openai
        model: gpt-4o
        tags: [saas, paid, alternative]
      - provider: openai
        model: gpt-4o-mini
        tags: [saas, free-tier]
      - provider: ollama
        model: qwen2.5:32b
        tags: [local, free, offline]
  
  secondary:
    provider: anthropic
    model: claude-haiku-4-5
    tags: [saas, paid, lightweight]
    fallback:
      - provider: openai
        model: gpt-4o-mini
        tags: [saas, free-tier]
      - provider: ollama
        model: qwen2.5:7b
        tags: [local, free]

dependencies:
  # External tools
  - manager: npm
    pkg: "@anthropic-ai/sdk"
    version: "^1.15.0"
  
  - manager: npm
    pkg: "zod"
    version: "^3.22.0"
  
  # Python packages
  - manager: pip
    pkg: torch
    version: ">=2.0.0,<3.0.0"
  
  - manager: pip
    pkg: transformers
    version: "^4.35.0"
  
  # System tools
  - manager: homebrew
    pkg: jq
  
  # Script-based installation (must include sha256 for security)
  - manager: script
    pkg: custom-eval-tool
    url: https://github.com/anthropic-research/eval-tool/releases/download/v1.0.0/install.sh
    sha256: abc123def456789...

ontology:
  - path: docs/ARCHITECTURE.md
  - path: docs/EVALS.md
  - path: docs/SAFETY_GUIDELINES.md
  - path: docs/examples/
  - path: BENCHMARKS.md

craft:
  - path: schema/eval.schema.json
  - path: .github/workflows/benchmark.yml
  - path: package.json
  - path: tsconfig.json

identities:
  - path: .claude/agents/evaluator.md
  - path: .claude/agents/monitor.md
  - path: .claude/agents/summarizer.md

ethics:
  - path: .cedar/safety-policies.cedar
  - path: RESPONSIBLE_DISCLOSURE.md
  - path: PRIVACY_NOTICE.md

tags:
  - ai-safety
  - evaluations
  - benchmarking
  - research
  - anthropic

extends:
  - name: research-base
    author: kittender
    version: "^1.0.0"
```

**Key Features**:
- Multiple model fallback chains (Anthropic → OpenAI → Ollama)
- Model pinning for reproducibility (`model_pin`)
- Semantic version constraints for dependencies
- Script dependencies with SHA-256 verification
- Files organized by category (ontology, craft, identities, ethics)
- Inheritance via `extends` (pulls dependencies from parent substrate)
- Metadata (homepage, license, tags)

---

## Agent Workflow

Substrate designed for multi-agent workflows (Claude Code CLAUDE.md files + agent roles).

**File**: `hyle.yaml`

```yaml
name: customer-support-agents
author: startup-x
version: 1.3.0
description: |
  Multi-agent customer support system.
  Routes tickets → analysis agent → response agent → supervisor approval.

models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
    fallback:
      - provider: openai
        model: gpt-4o
      - provider: ollama
        model: qwen2.5:14b

dependencies:
  - manager: npm
    pkg: "@anthropic-ai/sdk"
    version: "^1.15.0"
  
  - manager: npm
    pkg: express
    version: "^4.18.0"
  
  - manager: npm
    pkg: pg
    version: "^8.10.0"

ontology:
  - path: docs/SYSTEM_ARCHITECTURE.md
  - path: docs/AGENT_CAPABILITIES.md
  - path: docs/API_ENDPOINTS.md
  - path: docs/EXAMPLES/

craft:
  - path: package.json
  - path: schema/ticket.schema.json
  - path: schema/response.schema.json
  - path: .env.example

identities:
  # Core agents
  - path: .claude/agents/router.md
  - path: .claude/agents/analyzer.md
  - path: .claude/agents/responder.md
  - path: .claude/agents/supervisor.md
  
  # Tools for agents
  - path: .claude/agents/tools/ticket-lookup.md
  - path: .claude/agents/tools/knowledge-base.md
  - path: .claude/agents/tools/email-sender.md

ethics:
  - path: .cedar/escalation-policy.cedar
  - path: DATA_RETENTION_POLICY.md
  - path: RESPONSIBLE_AI_PRACTICES.md

tags:
  - agents
  - customer-support
  - multi-turn
  - claude
```

**Directory Structure**:

```
.
├── hyle.yaml                    # Manifest (this file)
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md   # Agent communication flow
│   ├── AGENT_CAPABILITIES.md    # What each agent can do
│   └── EXAMPLES/
│       └── support-ticket.md    # Example conversation
├── schema/
│   ├── ticket.schema.json       # Input validation
│   └── response.schema.json     # Output validation
├── .claude/
│   ├── CLAUDE.md                # Main context + shared tools
│   └── agents/
│       ├── router.md            # Agent identity: Route tickets
│       ├── analyzer.md          # Agent identity: Analyze issues
│       ├── responder.md         # Agent identity: Draft responses
│       ├── supervisor.md        # Agent identity: Review & approve
│       └── tools/
│           ├── ticket-lookup.md  # Tool: Query ticket DB
│           ├── knowledge-base.md # Tool: Search FAQ/docs
│           └── email-sender.md   # Tool: Send response
├── .cedar/
│   └── escalation-policy.cedar  # Escalation rules
├── package.json                 # Dependencies
└── .env.example                 # Configuration template
```

---

## Data Pipeline

Substrate for ETL/data processing workflows with multiple model roles.

**File**: `hyle.yaml`

```yaml
name: data-quality-pipeline
author: data-team
version: 3.0.0
description: |
  Automated data quality checks and cleansing.
  Processes raw → validation → enrichment → export.

models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
    fallback:
      - provider: openai
        model: gpt-4o
  
  secondary:  # For lightweight validation tasks
    provider: anthropic
    model: claude-haiku-4-5
    fallback:
      - provider: ollama
        model: qwen2.5:7b

dependencies:
  - manager: npm
    pkg: dbt-core
    version: "^1.6.0"
  
  - manager: pip
    pkg: pandas
    version: "^2.0.0"
  
  - manager: pip
    pkg: pydantic
    version: "^2.0.0"
  
  - manager: npm
    pkg: airflow
    version: "^2.6.0"

ontology:
  - path: docs/PIPELINE_ARCHITECTURE.md
  - path: docs/DATA_DICTIONARY.md
  - path: docs/QUALITY_RULES.md
  - path: docs/SLAs.md

craft:
  - path: dbt/models/
  - path: dbt/tests/
  - path: schemas/
  - path: package.json
  - path: requirements.txt

identities:
  - path: .claude/agents/validator.md
  - path: .claude/agents/enricher.md
  - path: .claude/agents/monitor.md

ethics:
  - path: DATA_PRIVACY_POLICY.md
```

---

## Cloud Infrastructure

Substrate for infrastructure-as-code templates and DevOps automation.

**File**: `hyle.yaml`

```yaml
name: k8s-deployment-kit
author: devops-team
version: 2.5.0
description: |
  Kubernetes deployment automation.
  Includes Helm charts, RBAC policies, monitoring setup.

models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6

dependencies:
  - manager: homebrew
    pkg: kubectl
  
  - manager: homebrew
    pkg: helm
  
  - manager: homebrew
    pkg: kustomize

ontology:
  - path: docs/DEPLOYMENT_GUIDE.md
  - path: docs/CLUSTER_CONFIG.md
  - path: docs/TROUBLESHOOTING.md

craft:
  - path: helm/
  - path: k8s/
  - path: skaffold.yaml
  - path: Dockerfile

ethics:
  - path: RBAC_POLICIES.md
```

---

## Extending a Substrate

Substrate that inherits from a parent (via `extends`).

**File**: `hyle.yaml`

```yaml
name: my-research-fork
author: researcher-bob
version: 0.2.0
description: Fork of ai-research-kit with custom evals

# Inherit from parent substrate
extends:
  - name: ai-research-kit
    author: anthropic
    version: "^2.0.0"

# Override model choices (more cost-conscious)
models:
  primary:
    provider: anthropic
    model: claude-haiku-4-5
    fallback:
      - provider: ollama
        model: qwen2.5:7b

# Add custom dependencies
dependencies:
  - manager: pip
    pkg: my-eval-framework
    version: "^0.1.0"

# Add custom ontology files
ontology:
  - path: docs/MY_CUSTOM_EVALS.md

craft:
  - path: my_evals/
```

**How it Works**:
1. `hyle pull researcher-bob/my-research-fork@0.2.0` fetches the manifest
2. Manifest resolver detects `extends: [{name: ai-research-kit, author: anthropic}]`
3. Registry resolves to version `2.1.0` (latest matching `^2.0.0`)
4. Parent substrate files (ontology, craft, identities, ethics) are merged first
5. Child substrate fields override parent (e.g., primary model)
6. Final merged context passed to Claude Code

---

## Testing Manifests

Load examples into local projects:

```bash
# Create test project
mkdir -p test-projects/minimal
cd test-projects/minimal

# Copy example manifest
curl https://raw.githubusercontent.com/kittender/hyle/main/docs/examples/hyle-minimal.yaml \
  > hyle.yaml

# Validate
hyle validate hyle.yaml

# Pull and review
hyle pull example/hello-world --dry-run
```

## Validation Rules

All manifests must:
- Have `name`, `author`, `version`, `models` fields
- Use semantic versioning (`x.y.z` or `x.y.z-snapshot`)
- Have `name` and `author` ≤ 64 chars, lowercase alphanumeric + hyphens
- Reference existing files (relative paths, no `..` traversal)
- Include SHA-256 for script dependencies
- Respect `.hyleignore` patterns

## Related Documentation

- [CONFIG_REFERENCE.md](CONFIG_REFERENCE.md) — Field reference
- [REGISTRY_API.md](REGISTRY_API.md) — How to publish
- [SECURITY.md](SECURITY.md) — Trust model & best practices
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
