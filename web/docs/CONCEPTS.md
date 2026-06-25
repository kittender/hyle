# Core Concepts

Visual guides to key Hylé concepts.

---

## User Journey: Search → Pull → Apply

How blueprints flow from registry to your project.

```mermaid
graph LR
    Search["🔍 Search<br/>hyle search java"]
    Registry["📦 Registry"]
    Results["📋 Results<br/>Pick blueprint"]
    DryRun["🔎 Preview<br/>hyle pull --dry-run"]
    Review["👁️ Review<br/>Inspect diff"]
    Apply["✅ Apply<br/>hyle pull"]
    Verify["🔐 Verify<br/>Deps & checksums"]
    Done["✨ Ready<br/>Blueprint loaded"]
    
    Search -->|query| Registry
    Registry -->|matches| Results
    Results -->|select| DryRun
    DryRun -->|show| Review
    Review -->|approve| Apply
    Apply -->|run| Verify
    Verify -->|ok| Done
    
    style Registry fill:#90a4ae
    style Apply fill:#4caf50
    style Verify fill:#2196f3
    style Done fill:#4caf50
```

**Key moments:**
- `hyle search` — queries registry metadata (fast, local cache)
- `hyle pull --dry-run` — shows diff WITHOUT applying (inspect before committing)
- `git diff` — see exact changes (git history preserved)
- `hyle verify` — sanity check (deps, checksums, models available)

---

## Trust Tiers: How Authors Build Credibility

```mermaid
graph TD
    New["🆕 Unverified"]
    Time["⏳ 6mo history"]
    Pulls["📥 50+ pulls"]
    NoFlags["✅ No flags"]
    Community["✅ Community"]
    Email["📧 Request"]
    Manual["🛡️ Verified"]
    
    New -->|publish| Time
    Time -->|also| Pulls
    Pulls -->|and| NoFlags
    NoFlags -->|auto| Community
    New -->|or| Email
    Email -->|team review| Manual
    
    style New fill:#ff9800
    style Community fill:#2196f3
    style Manual fill:#4caf50
```

**What unlocks at each tier:**

| Tier | Requirements | Means |
|------|---|---|
| 🆕 **Unverified** | New author | No history; assume caution |
| ✅ **Community** | 50+ pulls + 6mo + no flags | Auto-promoted; trusted by community |
| 🛡️ **Verified** | OAuth + manual Hylé team review | Official endorsement |

---

## Four Domains: What Goes Where?

Blueprint splits files into 4 orthogonal categories. Each file belongs to exactly one.

```mermaid
graph TB
    Blueprint["📦 Blueprint"]
    
    Ontology["📚 Ontology<br/>Knowledge: What"]
    Craft["🔧 Craft<br/>Technical: How"]
    Identities["👤 Identities<br/>Personas: Who"]
    Ethics["🔐 Ethics<br/>Constraints: Limits"]
    
    Blueprint --> Ontology
    Blueprint --> Craft
    Blueprint --> Identities
    Blueprint --> Ethics
    
    style Ontology fill:#e8f5e9
    style Craft fill:#e3f2fd
    style Identities fill:#fff3e0
    style Ethics fill:#fce4ec
```

**Decision matrix: Where does each file go?**

| File | Domain | Why |
|------|--------|-----|
| CLAUDE.md | Ontology | Describes project context (knowledge) |
| AGENTS.md | Identities | Defines agent roles + personas |
| ARCHITECTURE.md | Craft | Technical design (how to build) |
| package.json | Craft | Dependencies + build config (how) |
| .cedar policies | Ethics | Access control + constraints (limits) |
| spec.pdf | Ontology | Domain knowledge (what) |
| .mcp.json | Craft | Tool integration (how to wire) |
| PRIVACY.md | Ethics | Data handling policy (limits) |

**Key principle:** Domains are **orthogonal** — no overlap. A file goes in ONE place.

---

## Model Compatibility: Choosing Your LLM

Blueprint declares recommended LLMs (tested, not enforced). Users choose which to use.

```mermaid
graph LR
    Blueprint["📋 Blueprint"]
    Universal["Universal<br/>Any LLM"]
    Budget["Budget<br/>Small models"]
    Offline["Offline<br/>Local"]
    Harness["Harness<br/>Bedrock"]
    
    User["👤 User picks"]
    Cost["💰 Cost"]
    Privacy["🔒 Privacy"]
    Setup["⚙️ Setup"]
    
    Blueprint --> Universal
    Blueprint --> Budget
    Blueprint --> Offline
    Blueprint --> Harness
    
    User --> Cost
    User --> Privacy
    User --> Setup
    
    Cost -.->|budget| Budget
    Privacy -.->|local| Offline
    Setup -.->|cloud| Harness
    
    style Blueprint fill:#90a4ae
    style Universal fill:#4caf50
    style Budget fill:#2196f3
    style Offline fill:#ff9800
    style Harness fill:#9c27b0
```

**How to declare:**

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

**Search & filter:**
```bash
hyle search --tag budget       # Only blueprints tagged budget-friendly
hyle search --tag bedrock      # Only blueprints tagged Bedrock-compatible
```

**If no `recommendations` block:** Assumes `universal` (works everywhere).

---

## Publish Decision Tree: snapshot vs push vs release

When should you use each command?

```mermaid
graph TD
    Start["Ready?"]
    Stable{"Stable &<br/>tested?"}
    Breaking{"Breaking<br/>changes?"}
    
    No["❌ Not ready"]
    Snapshot["snapshot<br/>patch WIP"]
    
    Yes["✅ Stable"]
    NoBreaking["✅ Compatible"]
    Push["push<br/>minor"]
    
    HasBreaking["❌ Breaking"]
    Release["release<br/>major"]
    
    Start --> Stable
    Stable -->|No| No
    No --> Snapshot
    
    Stable -->|Yes| Yes
    Yes --> Breaking
    Breaking -->|No| NoBreaking
    NoBreaking --> Push
    
    Breaking -->|Yes| HasBreaking
    HasBreaking --> Release
    
    style Snapshot fill:#ff9800
    style Push fill:#4caf50
    style Release fill:#2196f3
```

**Quick checklist:**

```
Only docs changed? → hyle push (minor)
New feature, old code works? → hyle push (minor)
Removed/renamed agent? → hyle release (major)
Still testing? → hyle snapshot (patch, WIP)
```

---

## See Also

- [CONFIG.md](reference/CONFIG.md) — Domains explained in detail + patterns
- [PUBLISHING.md](guides/PUBLISHING.md) — Publishing strategy + trust model
- [PUBLISHING_QUICKSTART.md](guides/PUBLISHING_QUICKSTART.md) — Step-by-step walkthrough
