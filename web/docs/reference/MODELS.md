# Tested Models (Recommendations)

Optional `recommendations` block in `hyle.yaml`: which LLMs the author tested. Feedback, not enforcement — users can run any model.

---

## Categories (freeform)

- `universal` — Tested with any capable LLM
- `budget` — Works with cheap/small models
- `offline` — Works with local models (Ollama, etc.)
- `advanced` — Requires capable model (Sonnet+)
- `harness` — Platform-specific (Bedrock, Cursor, Hermès)

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

**If no `recommendations` block:** blueprint has no recommendations yet (users discover via trial).

See [Configuration](CONFIG.md) for the full field reference.

---

## Complement with Tags

Add LLM provider tags (`claude`, `anthropic`, `openai`, `gemini`, `ollama`, etc.) so users can search:

```bash
hyle search claude java           # Find blueprints tagged with both claude + java
hyle search openai security      # OpenAI-friendly blueprints with security focus
hyle search ollama offline       # Local/offline blueprints using Ollama
```

---

## Real-World Example

**Enterprise scenario**: 100+ developers, microservices, QA automation. Author tested across cloud, budget, and local setups:

```yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6  # Architecture reviews, security audits
    - openai/gpt-4o
    - ollama/qwen2.5:14b
  budget:
    - anthropic/claude-haiku-4-5   # Test generation, formatting, summaries
    - openai/gpt-4o-mini
    - ollama/qwen2.5:7b
  offline:
    - ollama/qwen2.5:14b
```

---

## FAQ

**Q: Can't afford Anthropic/OpenAI models?**
A: List budget/offline recommendations instead:
```yaml
recommendations:
  budget:
    - openai/gpt-4o-mini
  offline:
    - ollama/qwen2.5:14b
```
Users then find it: `hyle search --tag budget`.

**Q: Can I recommend different providers?**
A: Yes — mix and match within a category:
```yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
    - ollama/qwen2.5:14b
```

**Q: How do users choose which model to use?**
A: Freely — recommendations are feedback, not a gate. If they want guidance, point them to your README or the recommendations block.

**Q: My blueprint fails with a small/budget model — what's wrong?**
A: Likely chosen from the wrong category (e.g. `budget` for a blueprint that needs `advanced` reasoning), or author never tested with that tier. See [Troubleshooting](../guides/TROUBLESHOOTING.md#model-selection--recommendations).
