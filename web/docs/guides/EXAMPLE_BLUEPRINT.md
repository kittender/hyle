# Example Blueprint: Angular + Java Microservices

Real-world example: shared AI workflows for an enterprise mono-repo (frontend + backend services).

---

## Project Structure

```
my-enterprise-ai/
├── hyle.yaml                    # Blueprint manifest
├── .hyle                        # Project config (overrides ~/.hyle)
├── .hyleignore                  # Exclude secrets
├── CLAUDE.md                    # AI agent instructions (ontology)
├── ARCHITECTURE.md              # How the project is organized (craft)
├── .cursorrules                 # Cursor AI rules (ontology)
├── frontend/
│   ├── angular.json
│   ├── src/
│   └── README.md                # Frontend setup (craft)
├── backend/
│   ├── pom.xml                  # Maven config (craft)
│   ├── src/
│   └── README.md                # Backend setup (craft)
├── .cedar/
│   ├── auth-policy.cedar        # Access control (ethics)
│   └── data-handling.cedar      # Data policy (ethics)
├── .claude/
│   ├── agents/
│   │   ├── frontend-expert.md   # Frontend agent persona (identities)
│   │   ├── backend-expert.md    # Backend agent persona (identities)
│   │   └── qa-specialist.md     # QA agent persona (identities)
├── evals/
│   ├── trulens.yaml             # TruLens evaluation config (ethics)
│   └── test-data.csv            # Test cases (ethics)
└── docs/
    ├── SECURITY.md              # Security guidelines (ethics)
    └── API.md                   # API reference (craft)
```

---

## hyle.yaml Manifest

```yaml
name: enterprise-ai-workflows
author: acme-corp
version: 1.0.0
description: "Shared AI agent workflows: frontend, backend, QA"
license: MIT
tags: [angular, java, microservices, tdd, cedar, ai]

# Models: primary for architecture decisions, secondary for lightweight tasks
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
    tags: [saas, paid]
  secondary:
    provider: anthropic
    model: claude-haiku-4-5
    tags: [saas, paid]

# External tools required
dependencies:
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar
  - name: node
    version: ">=18.0"
    url: https://nodejs.org/
  - name: java
    version: ">=17"
    url: https://www.oracle.com/java/

# Four domains: what, how, who, limits
blueprint:
  # Ontology: knowledge, specifications, features
  ontology:
    - CLAUDE.md
    - .cursorrules
    - docs/*.md
    - ARCHITECTURE.md
  
  # Craft: technical structure, recipes, configs
  craft:
    - angular.json
    - frontend/README.md
    - backend/pom.xml
    - backend/README.md
  
  # Identities: AI agent personas and behavior specs
  identities:
    - .claude/agents/*.md
  
  # Ethics: policies, compliance, evals
  ethics:
    - .cedar/*.cedar
    - evals/trulens.yaml
    - docs/SECURITY.md
```

---

## .hyle — Project Config

```yaml
# Override home ~/.hyle settings for this project
remote_url: https://registry.hyle.dev

# When pulling this blueprint, auto-add reference to CLAUDE.md
auto_inject: true

# Model to use for extension commands (hyle watch, hyle index, etc.)
default_llm: primary

# Don't upload these patterns to registry
scan:
  ontology: [.md, .cursorrules]
  craft: [angular.json, pom.xml, README.md]
  identities: [.md]
  ethics: [.cedar, trulens.yaml]
```

---

## .hyleignore

```
# Secrets
.env
.env.local
*.pem
*.key
.aws/
.gcloud/

# Build artifacts (not needed in blueprint)
node_modules/
target/
dist/
build/

# IDE
.vscode/local.*
.idea/local.*

# Private docs
docs/private/
docs/internal-strategy.md
```

---

## CLAUDE.md (AI Instructions)

```markdown
<!-- hyle-blueprint: acme-corp/enterprise-ai-workflows@1.0.0 — see hyle.yaml for models, .hyle for config -->

# Enterprise AI Workflows

AI agent instructions for full-stack development (frontend + backend + QA).

## Frontend Development

- **Models**: React 18, Angular 17, TypeScript strict mode
- **Process**: Atomic components → stories → tests → integration
- **Standards**: Accessibility (WCAG 2.1), i18n first, mobile-first CSS
- **AI Tasks**: Generate components, suggest optimizations, lint accessibility

## Backend Development

- **Models**: Spring Boot 3.2, JPA, Maven
- **Process**: TDD (write test first), service layer → repository → controller
- **Standards**: REST principles, error handling, logging, security headers
- **AI Tasks**: Generate service interfaces, suggest design patterns, code review

## QA & Evaluation

- **Models**: Jest + React Testing Library (frontend), JUnit 5 + Mockito (backend)
- **Process**: Unit → integration → E2E
- **Standards**: 80%+ coverage, no flaky tests, reproducible
- **AI Tasks**: Generate test cases, suggest edge cases, analyze coverage gaps

## Security & Compliance

- See SECURITY.md for data handling, auth, and compliance requirements.
```

---

## .claude/agents/frontend-expert.md (Identity)

```markdown
# Frontend Expert Agent

**Role**: Generate React/Angular components, optimize performance, ensure accessibility.

**Knowledge**:
- React 18 hooks, Context API, and next patterns
- Angular 17 standalone components, RxJS patterns
- TypeScript best practices
- Testing: React Testing Library, Jest
- Accessibility: ARIA, screen reader compatibility
- Styling: Tailwind, BEM, CSS-in-JS

**Rules**:
1. Always generate components with TypeScript strict mode
2. Include tests in every component
3. Use semantic HTML (button, nav, main, etc.)
4. Ask for design tokens before writing styles
5. Avoid prop drilling; use Context or state management

**Refusals**: 
- Don't generate components without unit tests
- Don't bypass accessibility checks
- Don't use inline styles
```

---

## .cedar/auth-policy.cedar (Ethics/Policy)

```cedar
permit (
    principal == User::"alice",
    action == Action::"read",
    resource == Document::"report-2025"
)
when { resource.classification == "internal" };

forbid (
    principal,
    action == Action::"delete",
    resource == Document::"archived_*"
)
when { principal.role == "viewer" };
```

---

## Usage: Publishing This Blueprint

```bash
cd my-enterprise-ai/
hyle init                    # Already has hyle.yaml, skip
hyle ontology               # Verify CLAUDE.md, docs/ picked up
hyle craft                  # Verify angular.json, pom.xml picked up
hyle identities             # Verify .claude/agents/*.md picked up
hyle ethics                 # Verify .cedar, trulens.yaml picked up
hyle push                   # Publish v1.0.1 (minor bump, stable)
```

---

## Usage: Pulling This Blueprint

```bash
cd new-project/
hyle pull acme-corp/enterprise-ai-workflows
# ✓ Shows diff of what will be added
# ✓ Checks for required tools (cedar, node, java)
# ✓ Verifies checksums (SHA-256)
# ✓ Adds blueprint reference to CLAUDE.md (if auto_inject: true)
# ✓ Extracts files: CLAUDE.md, ARCHITECTURE.md, .claude/agents/, .cedar/, etc.
```

Then developers get:
- CLAUDE.md with full AI workflow instructions
- Agent personas (.claude/agents/) pre-configured
- Security policies (.cedar files) ready to review
- Eval configs to measure quality (TruLens)
- Shared README files documenting setup

---

## Key Takeaways

**Ontology** = "What is the project?" Answer in docs, specs, instructions.
- CLAUDE.md, .cursorrules, architecture diagrams, feature specs

**Craft** = "How do we build it?" Answer in config, recipes, package managers.
- angular.json, pom.xml, Dockerfile, package.json, setup docs

**Identities** = "Who are the AI agents?" Answer with personas, behavior specs.
- Agent markdown files describing role, knowledge, rules, refusals

**Ethics** = "What are the limits?" Answer with policies, compliance, evals.
- .cedar files, security guidelines, test configs, data handling policies

A well-designed blueprint answers all four questions, so pulling teams inherit the whole context, not just code.
