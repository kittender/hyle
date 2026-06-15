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

**Guidance**: Recommend capable models in your `recommendations` block. Users choose which to use.

---

## Lightweight Tasks

Some tasks don't need complex reasoning:
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

**Guidance**: If you tested with cheaper/faster models for these tasks, list them in recommendations (e.g., budget category).

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

## Model Recommendations (Optional)

Share which LLMs and harnesses you tested. Helps users discover working setups. (This is feedback, not enforcement — users can try any model.)

```yaml
recommendations:
  universal:                    # Tested with capable models
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
    - ollama/qwen2.5:14b
  
  budget:                       # Tested with small/cheap models
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
    - ollama/qwen2.5:7b
  
  offline:                      # Tested with local models
    - ollama/qwen2.5:14b
  
  harness:                      # Tested on specific harnesses
    - bedrock/anthropic.claude-3-sonnet
    - cursor/claude-sonnet-4-6
```

**Complement with tags:** Also add LLM provider tags (`claude`, `anthropic`, `openai`, `gemini`, `ollama`, etc.) so users can search:
```bash
hyle search claude java           # Find blueprints tagged with both claude + java
hyle search openai security      # OpenAI-friendly blueprints with security focus
hyle search ollama offline       # Local/offline blueprints using Ollama
```

**If no `recommendations` block:** Blueprint has no recommendations yet (users discover via trial).

See [Configuration](CONFIG.md) for full recommendations docs.

---

## Real-World Example

**Enterprise scenario**: 100+ developers, microservices, QA automation.

```yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6  # For architecture reviews, security audits
    - openai/gpt-4o
    - ollama/qwen2.5:14b
  budget:
    - anthropic/claude-haiku-4-5   # For test generation, formatting, summaries
    - openai/gpt-4o-mini
    - ollama/qwen2.5:7b
  offline:
    - ollama/qwen2.5:14b
```

**Guidance for teams**: Sonnet for complex reasoning, Haiku/Ollama for simple tasks. Choose from recommendations matching your budget/setup.

---

## Token Consumption Tips

1. **Use secondary for batch work**: Formatting 50 test files → route to Haiku
2. **Reserve primary for reasoning**: "Does this design follow SOLID?" → Sonnet
3. **Declare compatibility**: Help users choose appropriate LLMs for their budget/setup

---

## FAQ

**Q: Should I always use primary for safety-critical code?**
A: Not necessarily. For *reviewing* security policy (requires judgment), use primary. For *formatting* policy code, use secondary. Route based on task, not domain.

**Q: What if I can't afford Anthropic models?**
A: Declare budget recommendations:
```yaml
recommendations:
  budget:
    - openai/gpt-4o-mini
    - ollama/qwen2.5:14b
```

Users can then find it: `hyle search --category budget`

**Q: Can I recommend different providers?**
A: Yes! Mix and match in recommendations:
```yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6  # Your main choice
    - openai/gpt-4o
    - ollama/qwen2.5:14b           # Offline option
```

**Q: How do users choose which model to use?**
A: Users decide freely (recommendations are just feedback). If they want guidance, check your README or recommendations section.
