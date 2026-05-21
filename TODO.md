# Hylé Roadmap & TODO List
**Last updated:** 2026-05-21 (Phase 4 complete; v0.2.0 ready for release)

---

## Released (v0.2.0 – Ready for Production)

✅ **Core CLI** — All commands: init, config, pull, push, snapshot, release, validate, verify, outdated, upgrade
✅ **Registry Backend** — Publish, fetch, search, security scans, diffs, trending, checksums, author info
✅ **Web UI** — Search, detail pages, diff viewer, responsive mobile layout, dark mode
✅ **User Accounts** — GitHub OAuth, token management, profile pages, portfolio display
✅ **Stars & Reviews** — Star substrates, 1–5 ratings, text reviews, display aggregates
✅ **Community Badges** — Verified (hyle-org/anthropic), Popular (1000+ stars), Community Loved (100+/4.0+), Security (scanned/warning/flagged)
✅ **Email Notifications** — Triggers for stars, reviews, new versions; user preferences; Resend integration
✅ **CLI Authentication** — OAuth device flow, token storage (`~/.hyle/auth.json`), logout
✅ **Security** — Path traversal guards, SSRF protection, rate limiting, checksum validation, manifest validation
✅ **Drift Detection** — hyle.lock generation, `hyle outdated` detection, `hyle upgrade` with diff, `hyle verify` validation
✅ **Testing & Quality** — 102+ CLI tests, CI/CD gates, CSS budget compliance, TypeScript strict mode

---

## Phase 5: Platform Distribution & Enterprise (Next 4–6 weeks)

### Phase 5A: Multi-Platform Binaries (Ready to Ship)

**Status:** Work complete; ready for publishing

- ✅ **Windows** — Chocolatey + WinGet manifests, code signing in CI
- ✅ **Linux** — .deb (Debian/Ubuntu), .rpm (RHEL/Fedora), Snap (universal)
- ✅ **macOS** — Already on Homebrew

**Next step:** Publish to package managers (1–2 days effort)

**Success criteria:**
- `winget install microsoft.hyle` works
- `choco install hyle` works
- `apt install hyle` works (Ubuntu/Debian)
- `dnf install hyle` works (Fedora/RHEL)
- `snap install hyle` works
- Downloads split: ~30% Windows, ~30% Linux, ~40% macOS within 4 weeks

---

### Phase 5B: Private/Org Registry (Enterprise Blocker)

**Goal:** Enable self-hosted registries for companies with internal AI conventions, compliance requirements.

**Subtasks:**
- [ ] Reference registry server (self-hosted binary or Docker image)
  - Same API as public registry
  - SQLite or PostgreSQL backend (user choice)
  - Optional OAuth connector (GitHub, Okta, etc.)
- [ ] Org namespace support
  - `hyle pull @acme/java-springboot` (org-scoped substrates)
  - Access control per team/org
  - Private visibility within org
- [ ] Config support
  ```yaml
  # .hyle
  remote_url: https://substrates.internal.corp.com
  remote_token: ${HYLE_TOKEN}  # env var, never hardcoded
  ```

**Effort:** 3–4 days  
**Blocking:** Enterprise adoption (no private registry = non-starter for companies)

---

### Phase 5C: Substrate Inheritance/Composition

**Goal:** Enable base corporate substrate + project-specific layers (eliminates copy-paste, enforces consistency).

**Design:**
```yaml
# hyle.yaml
extends: ["hyle-org/base-config@2.0.0"]  # parent substrate

# Merged result: parent files + project overrides
substrate:
  ontology:
    - CLAUDE.md              # overrides parent
    - project-specific.md    # added
  ethics:
    - policies.cedar         # overrides parent
```

**Subtasks:**
- [ ] Update manifest schema: `extends` field with version pins
- [ ] Pull logic: fetch parent first, merge with child
- [ ] Conflict resolution: `override: true` per file
- [ ] Inheritance depth limit: 2 levels only (parent → child)
- [ ] `hyle pull` shows merged diff (parent + child effective result)
- [ ] Lock file tracks inheritance chain

**Effort:** 3–4 days  
**Blocking:** Enterprise adoption (needed for multi-team governance)

---

### Phase 5D: Advanced Registry Features

**Lower priority; ship after distribution + inheritance:**

- [ ] Behavioral keyword scanning (regex flags: `ignore previous instructions`, `do not ask`, `exfiltrate`, `webhook`)
- [ ] Sandboxed diff preview (CLAUDE.md/AGENTS.md shown as plain text, never passed to LLM during pull)
- [ ] Author trust tiers (unverified → community → verified with OAuth)
- [ ] Quorum community flagging (3+ independent users required to flag, not 1)
- [ ] Dependency vulnerability scanning (integrate Trivy/Syft for CVEs)

**Effort:** 2–3 days per feature  
**Not blocking:** Nice-to-have for v0.3+

---

## Phase 6: AI-Powered Features (Post-v0.3)

- [ ] Advanced hyle.json indexing (better weight algorithm, avoid LLM noise)
- [ ] Dependency graph visualization (interactive DAG on detail pages)
- [ ] Substrate recommendations (smart search filtering)
- [ ] Breaking-change detection improvements (semantic diff analysis)

---

## Known Architecture Debts (Tracked in ARCHITECTURE.md)

1. **Registry trust model** — Behavioral keywords missing; needs sandboxed diff preview
2. **Client lock-in** — Docs mention non-Claude clients, but CLI scan defaults don't find them
3. **GDPR audit trail** — Should be enterprise extension only, not core
4. **Model-pin email** — Should be CLI warning on push, not monthly email
5. **hyle.json weight** — User-declared priority needed, not LLM-generated
6. **No private registry** — Blocks enterprise adoption (Phase 5B addresses)
7. **No drift detection** — RESOLVED (hyle.lock + outdated + upgrade + verify complete)
8. **No composition** — RESOLVED (extends field implemented in Phase 4)

**See PRODUCTION_READINESS_REVIEW.md for detailed status on all known issues.**

---

## Release Timeline

| Version | Date | Features | Status |
|---------|------|----------|--------|
| 0.1.0 | TBD (current) | Core CLI + registry basics | Ready ✅ |
| 0.2.0 | TBD (+2 weeks) | Web UI, social, community | Ready ✅ |
| 0.3.0 | TBD (+6 weeks) | Multi-platform, private registry, inheritance | Phase 5 |
| 0.4.0 | TBD (+10 weeks) | Advanced features, AI indexing | Roadmap |
| 1.0.0 | TBD (+16 weeks) | Stable API, enterprise SLA | Future |

---

## Success Metrics (Post-v0.2 Launch)

**Within 4 weeks of v0.2.0 release:**
- Windows downloads: 20%+ of total
- Linux downloads: 30%+ of total
- Web search traffic: 2000+ searches/month
- Substrate ratings: Avg 4.2+ stars
- User registration: 100+ accounts

**Within 8 weeks:**
- Author retention: 70%+ publish second version
- Email engagement: >15% open rate
- Private registry inquiries: 10+ companies
- Inheritance adoption: 5+ corporate substrates published
