# Model Configuration

Understanding `primary` and `secondary` models, and when to use each.

---

## Quick Answer

- **Primary**: Complex work (code design, architecture decisions, security reviews)
- **Secondary**: Lightweight work (summaries, formatting, simple classifications)
- **Why split?** Save tokens and cost; use right tool for task; better latency

---

## Primary Model

Complex, high-intelligence tasks that need:
- Deep reasoning
- Code architecture & design
- Security/compliance analysis
- Multi-step problem solving

**Examples**:
- "Design a microservices architecture for authentication"
- "Review this code for security vulnerabilities"
- "Refactor this class to use dependency injection"

**Model choice**: Use most capable model available
```yaml
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6    # Most capable
```

---

## Secondary Model

Lightweight, deterministic tasks that don't need complex reasoning:
- Text summarization
- Code formatting/linting
- Test case generation from template
- JSON parsing/transformation
- Counting tokens
- Filtering/classification

**Examples**:
- "Summarize this 500-line document in 1 paragraph"
- "Extract function names from this Python file"
- "Format this JSON with 2-space indent"
- "Is this email spam? (yes/no)"

**Model choice**: Use cheaper, faster model
```yaml
models:
  secondary:
    provider: anthropic
    model: claude-haiku-4-5     # Cheaper, faster
```

---

## Cost & Token Impact

### Example: Token Usage Comparison

**Task**: Generate 100 unit tests + review architecture

Without split (all primary):
- Primary model processes 100k tokens × 2 tasks = 200k tokens
- Cost: high (premium model used for simple formatting tasks)

With split (task routing):
- Complex (architecture review): 50k tokens with primary (Sonnet)
- Lightweight (test formatting): 50k tokens with secondary (Haiku)
- Cost: ~40% lower (secondary is cheaper per token)

### Latency Benefit

Secondary models are smaller → faster inference:
- Primary (Sonnet): ~1-2 sec per 500-token response
- Secondary (Haiku): ~300ms per 500-token response

For summarization or formatting, Haiku answers just as accurately and ~5× faster.

---

## Decision Matrix

| Task | Primary? | Why |
|------|----------|-----|
| "Design REST API schema" | ✓ | Requires architectural reasoning |
| "Format this JSON" | ✗ | Deterministic transformation |
| "Refactor for readability" | ✓ | Subjective, requires taste |
| "Extract function names" | ✗ | Simple pattern matching |
| "Debug this crash" | ✓ | Complex analysis needed |
| "Add comments to this code" | ✗ | Mechanical insertion |
| "Write a security policy" | ✓ | High stakes, requires expertise |
| "Summarize meeting notes" | ✗ | Extractive, not synthetic |

---

## Configuration

### Minimal (No Secondary)

If all your tasks need complex reasoning, use only primary:
```yaml
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
```

Extensions (`hyle watch`, `hyle index`) fall back to primary.

---

### Full (Primary + Secondary)

If you want to optimize cost:
```yaml
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
  secondary:
    provider: anthropic
    model: claude-haiku-4-5
```

---

## Fallback Chains (Optional)

Add alternative models if primary/secondary unavailable (e.g., API quota hit, network down).

```yaml
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
    fallback:
      - provider: openai
        model: gpt-4o              # If Claude unavailable
      - provider: ollama
        model: qwen2.5:14b         # If OpenAI unavailable (local)
  secondary:
    provider: anthropic
    model: claude-haiku-4-5
    fallback:
      - provider: ollama
        model: qwen2.5:7b
```

Hylé tries each in order. Last entry (local Ollama) is tried last. See [Configuration](CONFIG.md) for full fallback docs.

---

## Model Pinning

Optional: pin exact model checkpoint for reproducibility.

```yaml
models:
  primary:
    model: claude-sonnet-4-6              # Always latest
    model_pin: claude-sonnet-4-6-20260115 # Exact checkpoint
```

**When to pin**:
- Compliance/audit requirements (reproducible results)
- Published research (fixed baseline for comparisons)
- Otherwise: leave unpinned (get improvements automatically)

When you pin, Hylé emails you monthly if a newer checkpoint is available.

---

## Real-World Example

**Enterprise scenario**: 100+ developers, microservices, QA automation.

```yaml
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6      # Architecture reviews, security audits
    fallback:
      - provider: openai
        model: gpt-4o             # Fallback if Claude quota hit
      - provider: ollama
        model: qwen2.5:14b        # Local Ollama for offline work
  secondary:
    provider: anthropic
    model: claude-haiku-4-5       # Test generation, formatting, summaries
    fallback:
      - provider: ollama
        model: qwen2.5:7b
```

**Token savings**: ~40% over using primary for all tasks.
**Developer experience**: Fast responses (Haiku latency for simple tasks), smart decisions (Sonnet for complex work).

---

## Token Consumption Tips

1. **Use secondary for batch work**: Formatting 50 test files → route to Haiku
2. **Reserve primary for reasoning**: "Does this design follow SOLID?" → Sonnet
3. **Set up fallbacks**: Prevents quota-related delays during peak hours
4. **Monitor actual usage**: `hyle watch` (extension) shows token breakdown

---

## FAQ

**Q: Should I always use primary for safety-critical code?**
A: Not necessarily. For *reviewing* security policy (requires judgment), use primary. For *formatting* policy code, use secondary. Route based on task, not domain.

**Q: What if I can't afford Anthropic models?**
A: Set fallback to OpenAI free-tier or local Ollama:
```yaml
models:
  primary:
    provider: openai
    model: gpt-4o-mini
    fallback:
      - provider: ollama
        model: qwen2.5:14b
```

**Q: Can I use different providers for primary and secondary?**
A: Yes! Mix and match:
```yaml
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
  secondary:
    provider: ollama
    model: qwen2.5:7b          # Offline secondary for privacy
```

**Q: How does Hylé decide which model to use?**
A: You configure it in `hyle.yaml`. Tools specify which model they need (primary/secondary), Hylé loads that config.
