# Known Limitations & Constraints

Current version: **v0.2.0**

This page documents what works, what doesn't, and what's planned. **Shipping with these constraints is intentional** — they don't block the core use case (publish/pull blueprints), and Phase 5+ will address them.

---

## Current Constraints (Working As Designed)

These are **not bugs**; they're deliberate trade-offs baked into v0.2.0:

### 1. Registry trust model is partial
**What:** Manifest scan flags behavioral keywords (eval, exfiltrate, webhook). Doesn't block publish immediately.

**Why:** Phase 5D will make blocking mandatory + add diff preview. For now, scanning is async + warns on pull.

**Workaround:** Review manifest diff before pulling (`hyle pull <name> --dry-run`). Author tiers + community flags mitigate risk.

**Roadmap:** [Phase 5D — Advanced Security](../ROADMAP.md)

---

### 2. Compatibility categories are author-declared, not enforced
**What:** Author declares `compatibility.budget` but doesn't actually test with budget models. Users select from category + face surprises.

**Why:** Hylé doesn't force testing; category labels are advisory. Author responsibility.

**Workaround:** Thoroughly test each compatibility category before publishing. Be honest in declarations — delete categories you didn't validate.

---

### 3. Inheritance depth limited to 2 levels (parent → child)
**What:** `extends` field supports only one parent blueprint. No grandparent chains.

**Why:** Prevents opaque dependency chains + circular inheritance. Design constraint.

**Workaround:** Use 2-level hierarchy: corporate base + project-specific child.

**Roadmap:** [Phase 5C](../ROADMAP.md) — Substrate composition (final design)

---

## Resolved in v0.2.0 ✅

These limitations **no longer apply**:

| Item | Resolution |
|------|-----------|
| Model-pin notification | Implemented as CLI warning on push + `hyle outdated` command |
| Private blueprints | Private GitHub repos = private blueprints (by design) |
| Drift detection | `hyle.lock` + `hyle outdated` + `hyle upgrade` + `hyle verify` |
| CI/CD integration | `hyle verify` with exit codes (0 = clean, 1 = drift) |
| Substrate composition | `extends` field implemented (v0.2.0) |

---

## Not Planned (Out of Scope)

These features are explicitly **not on the roadmap**:

- **Mobile app** — no user demand yet; web UI sufficient
- **GraphQL API** — REST sufficient; add if community requests
- **Substrate marketplace** — registry search covers use case
- **Paid tiers / monetization** — beta free forever
- **GitHub Actions integration** — GitHub marketplace later (low priority)
- **Slack/Discord bots** — lower priority; CLI primary
- **Offline CLI cache** — online-first model acceptable for beta
- **Substrate signing/verification** — cryptographic signing; nice-to-have, not essential
- **Supply chain SBOMs** — too early; no demand

---

## Quick Reference: What Works Now

### Core commands (stable, v0.2.0):
- ✅ `hyle init` — scaffold blueprint
- ✅ `hyle pull / push / snapshot / release` — manage versions
- ✅ `hyle verify` — check for drift
- ✅ `hyle outdated` — list out-of-date blueprints
- ✅ `hyle upgrade` — apply updates
- ✅ `hyle search` — find blueprints

### Web UI (stable, v0.2.0):
- ✅ Blueprint search + filtering
- ✅ Detail pages + version diffs
- ✅ Star ratings + reviews
- ✅ Author portfolios + trust tiers
- ✅ Community flags (factual warnings)
- ✅ GitHub OAuth login

---

## Escalation

Found a bug or limitation not listed here? Report at:
- **GitHub:** [kittender/hyle/issues](https://github.com/kittender/hyle/issues)
- **Security vulnerability:** [SECURITY.md](../security/SECURITY.md)

Before filing, check:
- This page (might be known + planned)
- [ROADMAP.md](../ROADMAP.md) (phase timeline)
- [SECURITY_AUDIT.md](../security/SECURITY_AUDIT.md) (security findings)
