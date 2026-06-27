# Blueprint Metadata

_Tags & Model Recommendations_

How to make a blueprint discoverable: `tags` (searchable keywords) and `recommendations`
(LLMs you tested, feedback not enforcement) in `hyle.yaml`. Field syntax: [Configuration
reference](../publish/config.md#tags--search-discoverability).

---

## Model Recommendations

```yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
    - ollama/qwen2.5:14b
  budget:
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
  offline:
    - ollama/qwen2.5:14b
  harness:
    - bedrock/anthropic.claude-3-sonnet
    - cursor/claude-sonnet-4-6
```

Categories (`universal`, `budget`, `offline`, `advanced`, `harness`) are freeform — define
as needed. No block = no recommendations yet; users discover via trial. Users search by
category: `hyle search --tag budget`.

**Model fails for a user?** Likely the wrong category (e.g. `budget` for a blueprint that
needs `advanced` reasoning) — see [Troubleshooting](../troubleshooting.md#model-selection--recommendations).

---

## LLM Provider Tags

Use provider name, not exact model versions — users search `claude`, not
`anthropic/claude-sonnet-4-6`.

| Group | Tags |
|---|---|
| Anthropic | `anthropic`, `claude` |
| OpenAI | `openai`, `gpt`, `gpt-4`, `gpt-4o`, `gpt-4-turbo` |
| Google | `google`, `gemini`, `gemma`, `palm` |
| Meta | `meta`, `llama`, `llama-2`, `llama-3` |
| Open source / local | `ollama`, `offline`, `local`, `open-source`, `huggingface` |
| Cloud platforms | `bedrock`, `sagemaker`, `azure`, `vertex-ai` |
| Specialized | `multimodal`, `vision`, `code-specialized`, `instruction-tuned` |

---

## Tech Stack Tags

| Group | Tags |
|---|---|
| Backend | `python`, `java`, `typescript`, `javascript`, `rust`, `go`, `csharp`, `kotlin`, `scala`, `elixir`, `ruby`, `php` |
| Frontend | `react`, `angular`, `vue`, `svelte`, `nextjs`, `nuxt` |
| Data & ML | `sql`, `pandas`, `tensorflow`, `pytorch`, `scikit-learn` |
| Web frameworks | `fastapi`, `flask`, `django`, `spring-boot`, `express`, `rails`, `laravel` |
| Databases | `postgresql`, `mongodb`, `redis`, `elasticsearch`, `dynamodb`, `firestore` |
| Deployment & infra | `docker`, `kubernetes`, `terraform`, `aws`, `gcp`, `azure`, `vercel`, `heroku`, `cloudflare` |
| Testing | `pytest`, `jest`, `junit`, `rspec`, `vitest`, `cypress`, `playwright`, `selenium` |

---

## Capability Tags

| Group | Tags |
|---|---|
| Approach | `tdd`, `bdd`, `ddd`, `agile`, `microservices`, `monolithic`, `serverless` |
| AI/ML | `agents`, `rag`, `vector-db`, `embeddings`, `fine-tuning`, `prompt-engineering`, `function-calling` |
| Code quality | `testing`, `linting`, `formatting`, `refactoring`, `best-practices`, `clean-code` |
| Security & compliance | `security`, `auth`, `oauth`, `jwt`, `encryption`, `compliance`, `gdpr`, `pii` |
| Performance | `performance`, `caching`, `cdn`, `optimization`, `scalability` |
| Use case | `e-commerce`, `saas`, `api`, `rest-api`, `graphql`, `grpc`, `cms`, `blog`, `social`, `analytics`, `data-pipeline`, `etl` |
| Team & scale | `startup`, `enterprise`, `team`, `multi-tenant`, `scaling` |
| Repo shape | `monorepo`, `workspace`, `multi-repo`, `submodules` |

---

## Using Tags Well

- **5-20 tags.** Fewer hurts discoverability; more dilutes relevance. Sweet spot: 8-15.
- **Mix categories** — tech + LLM provider + capability, e.g. `python, fastapi, anthropic, claude, tdd`.
- **Avoid:** typos/variants (`claudeai` instead of `claude`), overly specific versions
  (`python-3-11` instead of `python`), marketing language (`awesome`, `best`), unsearchable
  abbreviations (`mgmt` instead of `management`).

---

## Examples by Blueprint Type

**Claude Java Spring Boot starter:**
```yaml
tags: [java, spring-boot, claude, anthropic, rest-api, testing, tdd, docker]
recommendations:
  universal: [anthropic/claude-sonnet-4-6]
  budget: [anthropic/claude-haiku-4-5]
```

**Python FastAPI + OpenAI agent:**
```yaml
tags: [python, fastapi, openai, gpt, agents, rag, api, function-calling]
recommendations:
  universal: [openai/gpt-4o]
  budget: [openai/gpt-4o-mini]
```

**React + Next.js + Gemini:**
```yaml
tags: [typescript, react, nextjs, gemini, google, web, api, ssr]
```

**Offline Ollama + Python:**
```yaml
tags: [python, ollama, offline, local, llama, rag, embeddings]
recommendations:
  offline: [ollama/qwen2.5:14b]
```

**Enterprise Java + Anthropic:**
```yaml
tags: [java, spring-boot, kubernetes, claude, anthropic, enterprise, security, compliance, oauth, testing]
recommendations:
  universal: [anthropic/claude-sonnet-4-6, openai/gpt-4o, ollama/qwen2.5:14b]
  budget: [anthropic/claude-haiku-4-5, openai/gpt-4o-mini, ollama/qwen2.5:7b]
```

Update both as your blueprint evolves — e.g. add `ollama, offline` tags + an `offline`
recommendations entry once you've tested a local-model fallback.
