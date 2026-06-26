# Real Example: Java Spring Boot + Angular Monorepo

Complete walkthrough of packaging a production Java/Spring Boot + Angular project as a Hylé blueprint.

---

## Project Overview

**What we're packaging:**
- Backend: Java Spring Boot REST API (product catalog service)
- Frontend: Angular web app (admin dashboard)
- Agents: Claude agents for product recommendations + customer support
- Policies: CEDAR access control for API endpoints
- Tech stack: Maven, Node.js, Docker

---

## Step 1: Organize Files Into Domains

### Current project structure

```
acme-product-service/
├── README.md
├── pom.xml                          # Maven deps (backend)
├── src/
│   └── main/java/com/acme/...      # Spring Boot code
├── frontend/
│   ├── package.json                 # Angular deps
│   ├── angular.json
│   └── src/app/...                 # Angular components
├── docs/
│   ├── api-spec.md                 # OpenAPI + examples
│   ├── architecture.md              # System design
│   └── deployment.md                # K8s setup
├── agents/
│   ├── recommender.md               # Agent: ML recommendations
│   ├── support-bot.md               # Agent: customer support
│   └── .claude/agents/
│       ├── recommender.md           # Agent definitions
│       └── support-bot.md
├── policies/
│   ├── api-access.cedar             # Who can call which endpoints
│   ├── data-handling.cedar          # PII protection rules
│   └── audit.md                     # Compliance policy
├── docker-compose.yml               # Local dev environment
├── .env.example
└── .git/
```

### Categorize into 4 domains

Applied to this repo (general rule: [Four domains](../CONCEPTS.md#four-domains-what-goes-where)):

| File(s) | Domain | Why |
|---------|--------|-----|
| CLAUDE.md | Ontology | Project context for Claude |
| README.md, docs/api-spec.md | Ontology | What this service does |
| docs/architecture.md | Craft | How it's built technically |
| pom.xml, frontend/package.json | Craft | Build + dependencies |
| docker-compose.yml | Craft | How to run locally |
| agents/*.md, .claude/agents/ | Identities | Agent personas + specs |
| policies/*.cedar | Ethics | Access control + compliance |

---

## Step 2: Create CLAUDE.md (Ontology)

Project context for Claude agents.

```markdown
# ACME Product Service — Claude Context

## What This Project Does

REST API for product catalog management. Serves mobile + web clients.
Handles: product queries, recommendations, customer support.

## Tech Stack

- **Backend**: Spring Boot 3.2, Java 17, Maven
- **Frontend**: Angular 18
- **Database**: PostgreSQL (via Spring Data JPA)
- **Auth**: OAuth2 + JWT (Spring Security)
- **Deployment**: Docker + Kubernetes (minikube locally)

## Key Files

- `src/main/java/com/acme/ProductController.java` — REST endpoints
- `frontend/src/app/` — Angular components
- `docs/api-spec.md` — OpenAPI specification

## Your Role: Claude AI Agent

You assist with:
1. **Code generation** — Spring Boot endpoints, Angular components
2. **Documentation** — API specs, architecture decisions
3. **Testing** — Unit tests (JUnit 5), integration tests
4. **Customer support** — Answer questions about API usage

## Important Constraints

- Spring Security: all endpoints protected by OAuth2 scope (see policies/api-access.cedar)
- PII (user data): never log, always encrypted at rest (see policies/data-handling.cedar)
- Changes to ProductController must be reviewed by security team
- No external API calls without explicit webhook URL

## Example Workflows

### Add a new endpoint

```
User: "Add GET /api/products/{id}/recommendations"
You: Generate Spring endpoint that:
  1. Validates productId against database
  2. Calls recommender agent (see agents/recommender.md)
  3. Returns JSON list of recommendations
  4. Logs access (see audit.md)
```

### Support bot response

```
User: "Customer asks: Can I export my purchase history?"
You: (1) Check policies/data-handling.cedar for export rules
     (2) Generate response using support-bot agent
     (3) Ensure PII is redacted
```

## References

- **Agent specs**: see agents/ and .claude/agents/
- **API design**: docs/api-spec.md
- **Architecture**: docs/architecture.md
- **Deployment**: docs/deployment.md
```

---

## Step 3: Create AGENTS.md (Identities)

Define agent personas.

```markdown
# Agents

## Agent 1: Recommender

**Purpose**: Suggest products based on customer history.

**Input**: Customer ID, browsing history, purchase history
**Output**: JSON list of 5 recommended products (name, price, description)

**Primary model**: Claude Haiku (fast, cost-effective) for simple recommendations
**Also compatible with**: Ollama local (free) for budget setup

**Example**:
```
User history: [Product A, Product B, ...]
Agent output:
[
  { id: 1, name: "Product X", reason: "Complements Product A" },
  { id: 2, name: "Product Y", reason: "Trending in your category" },
  ...
]
```

## Agent 2: Support Bot

**Purpose**: Answer customer support questions about products/orders.

**Input**: Customer question (text)
**Output**: Response (text) + suggested actions (JSON)

**Model**: Claude Sonnet (more nuanced) for complex support tickets
**Constraints**:
  - Never share customer data (name, email, phone)
  - If question about refund/payment, escalate to human
  - Always cite relevant documentation

**Example**:
```
Customer: "Can I return a product after 30 days?"
Agent output:
{
  "response": "Most items can be returned within 60 days if unused.",
  "action": "PROVIDE_RETURN_LINK",
  "escalate": false
}
```

## Integration

See .claude/agents/ for agent definitions + system prompts.
See docker-compose.yml for how agents are invoked via Python workers.
```

---

## Step 4: Create pom.xml Fragment (Craft)

Show key dependencies.

```xml
<!-- pom.xml excerpt -->
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.acme</groupId>
    <artifactId>product-service</artifactId>
    <version>1.0.0</version>

    <properties>
        <java.version>17</java.version>
        <spring-boot.version>3.2.0</spring-boot.version>
        <anthropic-sdk.version>0.7.0</anthropic-sdk.version>
    </properties>

    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Claude SDK -->
        <dependency>
            <groupId>com.anthropic</groupId>
            <artifactId>anthropic-java</artifactId>
            <version>${anthropic-sdk.version}</version>
        </dependency>

        <!-- Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

---

## Step 5: Create ARCHITECTURE.md (Craft)

Technical design.

```markdown
# Architecture

## System Design

```
┌─────────────┐
│   Angular   │
│   Frontend  │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────────────────────────┐
│  Spring Boot API                │
│  ProductController              │
│  - GET /api/products            │
│  - POST /api/recommendations    │
│  - POST /api/support            │
└──────┬──────────────────────────┘
       │
       ├─────► PostgreSQL (data)
       │
       └─────► Claude Agents
               - Recommender
               - Support Bot
```

## Key Design Decisions

1. **Agents as external service** — Not in JVM. Called via REST (loose coupling).
2. **CEDAR policies** — Enforce at API gateway (Spring Security). See policies/api-access.cedar.
3. **Audit logging** — All requests logged (who, what, when). See audit.md.

## Scalability

- Stateless Spring Boot: scales horizontally
- Agents: async processing (fire-and-forget or webhook callback)
- Database: PostgreSQL replicas for read scale
```

---

## Step 6: Create policies/api-access.cedar (Ethics)

Access control.

```cedar
// CEDAR policy: who can access what?

// Policy 1: Admin-only endpoints
@principal("admin"),
@action("POST"),
@resource("POST:/api/products")
allow;

// Policy 2: Customers can view products
@principal("customer"),
@action("GET"),
@resource("GET:/api/products")
allow;

// Policy 3: Support team can access support endpoint
@principal("support_agent"),
@action("POST"),
@resource("POST:/api/support")
allow;

// Deny by default
deny;
```

---

## Step 7: Create .hyleignore

Exclude secrets.

```
.env                    # Never publish local env
*.pem                   # SSH keys
*.key                   # Certificates
secrets/
config/local.*
docker-compose.override.yml
```

---

## Step 8: Initialize Blueprint

```bash
hyle init
```

Answers:
- **Name**: `acme-product-service`
- **Author**: `acme-platform-team`
- **Description**: "Java Spring Boot product API with Claude agents (recommender, support bot) + CEDAR policies"
- **License**: `Apache-2.0`

---

## Step 9: Auto-Scan & Populate

```bash
hyle ontology    # Finds CLAUDE.md, README.md, docs/
hyle craft       # Finds pom.xml, docker-compose.yml, ARCHITECTURE.md
hyle identities  # Finds AGENTS.md, .claude/agents/
hyle ethics      # Finds policies/*.cedar
```

Result: `hyle.yaml` populated.

---

## Step 10: Complete hyle.yaml

```yaml
name: acme-product-service
author: acme-platform-team
version: 1.0.0
description: Java Spring Boot product API with Claude agents (recommender, support bot) + CEDAR policies
license: Apache-2.0
url: https://github.com/acme-corp/product-service
tags: [java, spring, angular, claude, cedar, tdd, api]

recommendations:
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
  budget:
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
    - ollama/qwen2.5:7b
  offline:
    - ollama/qwen2.5:7b

dependencies:
  - name: java
    version: ">=17"
    url: https://adoptopenjdk.net
  - name: maven
    version: ">=3.8"
    url: https://maven.apache.org
  - name: node
    version: ">=18"
    url: https://nodejs.org
  - name: docker
    version: ">=20"
    url: https://www.docker.com
  - name: cedar
    version: ">=3.0"
    url: https://github.com/cedar-policy/cedar

blueprint:
  ontology:
    - CLAUDE.md
    - README.md
    - docs/api-spec.md
    - docs/architecture.md
  craft:
    - ARCHITECTURE.md
    - pom.xml
    - frontend/package.json
    - frontend/angular.json
    - docker-compose.yml
  identities:
    - AGENTS.md
    - .claude/agents/recommender.md
    - .claude/agents/support-bot.md
  ethics:
    - policies/api-access.cedar
    - policies/data-handling.cedar
    - docs/audit.md
```

---

## Step 11: Verify & Publish

```bash
# Verify locally
hyle verify
# ✓ All dependencies found
# ✓ No secrets detected
# ✓ Models available

# Commit
git add hyle.yaml .hyleignore
git commit -m "feat: package as Hylé blueprint"
git push origin main

# Publish
hyle push
# Published: acme-product-service@1.0.0

# View on registry
hyle search acme-product-service
# → https://registry.hylé.com/u/acme-platform-team
```

---

## How Others Use This Blueprint

### Step 1: Pull

```bash
hyle pull acme-platform-team/acme-product-service
```

### Step 2: Review diff

```bash
git diff HEAD origin/main
# Shows: CLAUDE.md, AGENTS.md, policies/, etc.
```

### Step 3: Install dependencies

```bash
hyle verify  # Checks Maven, Node, Docker, Cedar
# Install missing: brew install cedar (etc.)
```

### Step 4: Adapt for their project

```bash
# Copy CLAUDE.md as template
cp CLAUDE.md CLAUDE.md.template

# Edit for their context
vim CLAUDE.md

# Add their agent specs
vim .claude/agents/custom-agent.md

# Re-publish under their name
hyle push my-org/product-service
```

---

## Cost Estimate

**Assumptions:**
- 1000 API calls/day
- 800 calls use Recommender (basic, Haiku: cheap)
- 200 calls use Support Bot (advanced, Sonnet: expensive)

**Daily cost:**
```
Recommender: 800 × $0.0004 = $0.32 (Haiku)
Support Bot: 200 × $0.0035 = $0.70 (Sonnet)
Total: ~$1.00/day = ~$30/month
```

**Or with Ollama (compatible budget option):**
```
Same queries via Ollama (free): $0/day
```

---

## Lessons Learned

1. **CLAUDE.md is essential** — Agents perform better with clear context
2. **Agents as separate service** — Decouples from main app, scales independently
3. **CEDAR policies** — Centralize access control (easier to audit + maintain)
4. **Dependencies declared** — Users know what to install upfront
5. **Cost tagging** — Basic model for cheap tasks, advanced for complex ones
