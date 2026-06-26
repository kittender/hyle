# Known Limitations & Constraints

Status: **pre-release** — CLI `0.1.0`, unreleased (no installers or hosted registry yet;
see [README](../../../README.md) and [BACKLOG.md](../BACKLOG.md)).

This page documents what the code does and doesn't do today. **These constraints are
intentional** — they don't block the core use case (publish/pull blueprints).

---

## Current Constraints (Working As Designed)

These are **not bugs**; they're deliberate trade-offs:

### 1. Registry trust model is partial
**What:** Manifest scan flags behavioral keywords (eval, exfiltrate, webhook). Doesn't block publish immediately.

**Why:** Scanning is async + warns on pull. Mandatory blocking + diff preview are on the [backlog](../BACKLOG.md).

**Workaround:** Review manifest diff before pulling (`hyle pull <name> --dry-run`). Author tiers + community flags mitigate risk.

---

### 2. Recommendation categories are author-declared, not enforced
**What:** Author declares `recommendations.budget` but doesn't actually test with budget models. Users select from category + face surprises.

**Why:** Hylé doesn't force testing; category labels are advisory. Author responsibility.

**Workaround:** Thoroughly test each compatibility category before publishing. Be honest in declarations — delete categories you didn't validate.

---

### 3. Inheritance depth limited to 2 levels (parent → child)
**What:** `extends` field supports only one parent blueprint. No grandparent chains.

**Why:** Prevents opaque dependency chains + circular inheritance. Design constraint.

**Workaround:** Use 2-level hierarchy: corporate base + project-specific child.

**Status:** Implemented, unreleased — permanent design choice, not slated to change.

---

## Already Implemented ✅

Built and working in the codebase (pre-release):

| Item | How |
|------|-----|
| Model-pin notification | CLI warning on push + `hyle outdated` command |
| Private blueprints | Private GitHub repos = private blueprints (by design) |
| Drift detection | `hyle.lock` + `hyle outdated` + `hyle upgrade` + `hyle verify` |
| CI/CD integration | `hyle verify` with exit codes (0 = clean, 1 = drift) |
| Blueprint composition | `extends` field |

---

## Out of Scope

These features are explicitly **out of scope** (see [BACKLOG.md](../BACKLOG.md)):

- **Mobile app** — no user demand yet; web UI sufficient
- **GraphQL API** — REST sufficient; add if community requests
- **Blueprint marketplace** — registry search covers use case
- **Paid tiers / monetization** — beta free forever
- **GitHub Actions integration** — GitHub marketplace later (low priority)
- **Slack/Discord bots** — lower priority; CLI primary
- **Offline CLI cache** — online-first model acceptable for beta
- **Blueprint signing/verification** — cryptographic signing; nice-to-have, not essential
- **Supply chain SBOMs** — too early; no demand

---

## Quick Reference: What Works Now

### Core commands (implemented):
- ✅ `hyle init` — scaffold blueprint
- ✅ `hyle pull / push / snapshot / release` — manage versions
- ✅ `hyle verify` — check for drift
- ✅ `hyle outdated` — list out-of-date blueprints
- ✅ `hyle upgrade` — apply updates
- ✅ `hyle search` — find blueprints

### Web UI (implemented):
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
- This page (might be a known constraint)
- [BACKLOG.md](../BACKLOG.md) (possible evolutions)
- [SECURITY_AUDIT.md](../security/SECURITY_AUDIT.md) (security findings)
