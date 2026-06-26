# Suggested Tags for Blueprint Discovery

Comprehensive list of recommended tags to help users find blueprints by LLM provider, tech stack, and capabilities.

---

## LLM Providers

Use provider name, not exact model versions. Users search for `claude` or `anthropic`, not `anthropic/claude-sonnet-4-6`.

### Anthropic

- `anthropic` — Any Anthropic model
- `claude` — Claude family (recommended primary tag)

### OpenAI

- `openai` — Any OpenAI model
- `gpt` — GPT family
- `gpt-4` — Advanced reasoning
- `gpt-4o` — Vision + reasoning
- `gpt-4-turbo` — Legacy model

### Google

- `google` — Any Google model
- `gemini` — Gemini family
- `gemma` — Lightweight Gemma family
- `palm` — Legacy PaLM

### Meta

- `meta` — Meta models
- `llama` — Llama family
- `llama-2` — Llama 2 series
- `llama-3` — Llama 3 series

### Open Source / Local

- `ollama` — Ollama (local inference)
- `offline` — Works without internet
- `local` — Runs locally
- `open-source` — Community/open-source model
- `huggingface` — HuggingFace models

### AWS / Cloud

- `bedrock` — AWS Bedrock
- `sagemaker` — AWS SageMaker
- `azure` — Azure OpenAI
- `vertex-ai` — Google Vertex AI

### Specialized

- `multimodal` — Vision + text
- `vision` — Image understanding
- `code-specialized` — Optimized for code
- `instruction-tuned` — Fine-tuned for instructions

---

## Programming Languages

### Backend

- `python` — Python ecosystem
- `java` — Java ecosystem
- `typescript` — TypeScript/Node.js
- `javascript` — JavaScript
- `rust` — Rust
- `go` — Go/Golang
- `csharp` — C#/.NET
- `kotlin` — Kotlin
- `scala` — Scala
- `elixir` — Elixir
- `ruby` — Ruby
- `php` — PHP

### Frontend

- `react` — React.js
- `angular` — Angular
- `vue` — Vue.js
- `svelte` — Svelte
- `nextjs` — Next.js
- `nuxt` — Nuxt.js

### Data & ML

- `sql` — SQL databases
- `pandas` — Pandas data processing
- `tensorflow` — TensorFlow
- `pytorch` — PyTorch
- `scikit-learn` — Scikit-learn

---

## Frameworks & Platforms

### Web Frameworks

- `fastapi` — FastAPI
- `flask` — Flask
- `django` — Django
- `spring-boot` — Spring Boot
- `express` — Express.js
- `rails` — Ruby on Rails
- `laravel` — Laravel

### Data & Databases

- `postgresql` — PostgreSQL
- `mongodb` — MongoDB
- `redis` — Redis
- `elasticsearch` — Elasticsearch
- `dynamodb` — DynamoDB
- `firestore` — Firestore

### Deployment & Infrastructure

- `docker` — Docker
- `kubernetes` — Kubernetes
- `terraform` — Terraform
- `aws` — AWS
- `gcp` — Google Cloud Platform
- `azure` — Azure
- `vercel` — Vercel
- `heroku` — Heroku
- `cloudflare` — Cloudflare

### Testing & Quality

- `pytest` — Pytest (Python)
- `jest` — Jest (JavaScript)
- `junit` — JUnit (Java)
- `rspec` — RSpec (Ruby)
- `vitest` — Vitest
- `cypress` — Cypress E2E testing
- `playwright` — Playwright
- `selenium` — Selenium

---

## Capabilities & Features

### Development Approach

- `tdd` — Test-driven development
- `bdd` — Behavior-driven development
- `ddd` — Domain-driven design
- `agile` — Agile methodology
- `microservices` — Microservices architecture
- `monolithic` — Monolithic architecture
- `serverless` — Serverless/FaaS

### AI & ML Specific

- `agents` — AI agents
- `rag` — Retrieval-augmented generation
- `vector-db` — Vector databases
- `embeddings` — Embedding models
- `fine-tuning` — Model fine-tuning
- `prompt-engineering` — Prompt optimization
- `function-calling` — Tool use / function calling

### Code Quality

- `testing` — Testing setup/strategies
- `linting` — Code linting
- `formatting` — Code formatting
- `refactoring` — Refactoring patterns
- `best-practices` — Best practices guide
- `clean-code` — Clean code principles

### Security & Compliance

- `security` — Security best practices
- `auth` — Authentication setup
- `oauth` — OAuth implementation
- `jwt` — JWT tokens
- `encryption` — Data encryption
- `compliance` — Compliance requirements
- `gdpr` — GDPR compliance
- `pii` — PII handling

### Performance

- `performance` — Performance optimization
- `caching` — Caching strategies
- `cdn` — CDN usage
- `optimization` — General optimization
- `scalability` — Scaling patterns

---

## Use Case Categories

### Domain Specific

- `e-commerce` — E-commerce platforms
- `saas` — SaaS applications
- `api` — API development
- `rest-api` — REST APIs
- `graphql` — GraphQL APIs
- `grpc` — gRPC APIs
- `cms` — Content management
- `blog` — Blogging platform
- `social` — Social network
- `analytics` — Analytics platform
- `data-pipeline` — Data pipelines
- `etl` — ETL processes

### Team & Scale

- `startup` — Startup-ready
- `enterprise` — Enterprise setup
- `team` — Team collaboration
- `multi-tenant` — Multi-tenant system
- `scaling` — Scalable architecture

### Documentation

- `documentation` — Docs/knowledge base
- `openapi` — OpenAPI specifications
- `storybook` — Storybook (UI docs)

---

## Deployment & Environment

- `offline` — Works without internet
- `local` — Local development
- `docker` — Docker support
- `kubernetes` — Kubernetes deployment
- `cloud-native` — Cloud-native design
- `edge` — Edge computing
- `mobile` — Mobile app support
- `web` — Web application

---

## Repository Patterns

- `monorepo` — Monorepo setup
- `workspace` — Workspace configuration
- `multi-repo` — Multiple repositories
- `submodules` — Git submodules

---

## How to Use These Tags

### Good Tag Combinations

```yaml
tags:
  # Backend + LLM combo
  - python
  - fastapi
  - anthropic
  - claude
  - testing
  - tdd

  # Full-stack
  - typescript
  - react
  - nextjs
  - openai
  - api
  - rag

  # Data pipeline
  - python
  - pandas
  - postgresql
  - offline
  - ollama
  - etl

  # Enterprise
  - java
  - spring-boot
  - security
  - compliance
  - kubernetes
  - anthropic
```

### Pick 5-20 Most Relevant Tags

- Too few (<5): Poor discoverability
- Too many (>20): Dilutes relevance
- Sweet spot: 8-15 tags

### Avoid

- Typos or non-standard variants (`claudeai` instead of `claude`)
- Overly specific versions (`python-3-11` instead of `python`)
- Marketing language (`awesome`, `amazing`, `best`)
- Abbreviations no one searches for (`mgmt` instead of `management`)

---

## Examples by Blueprint Type

### Claude Java Spring Boot Starter

```yaml
tags:
  - java
  - spring-boot
  - claude
  - anthropic
  - rest-api
  - testing
  - tdd
  - docker
```

### Python FastAPI + OpenAI Agent

```yaml
tags:
  - python
  - fastapi
  - openai
  - gpt
  - agents
  - rag
  - api
  - function-calling
```

### React + Next.js + Gemini

```yaml
tags:
  - typescript
  - react
  - nextjs
  - gemini
  - google
  - web
  - api
  - ssr
```

### Offline Ollama + Python

```yaml
tags:
  - python
  - ollama
  - offline
  - local
  - llama
  - rag
  - embeddings
```

### Enterprise Java + Anthropic

```yaml
tags:
  - java
  - spring-boot
  - kubernetes
  - claude
  - anthropic
  - enterprise
  - security
  - compliance
  - oauth
  - testing
```

---

## Tag Updates Over Time

Update tags as you add support for new LLMs or frameworks:

```yaml
# Initial release
tags: [python, fastapi, openai, gpt]

# Later: Add Anthropic support
tags: [python, fastapi, openai, gpt, anthropic, claude]

# Later: Add offline option
tags: [python, fastapi, openai, gpt, anthropic, claude, ollama, offline]
```
