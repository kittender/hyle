# Hylé TODO List
**Last updated:** 2026-05-05 (cleaned: removed completed items TODO 1-19, P0 fixes, CSS refactoring, tests)

---

## Completed (MVP 0.1.0)

✅ **Core CLI (TODO 1-10)** — All commands (init, config, pull, push, snapshot, release, validate)
✅ **Extensions (TODO 11-19)** — watch, audit, split, structure, index, install, search, deps-check
✅ **Web CSS (P1-P4)** — All page refactoring complete
✅ **Security (P0-1 to P0-10)** — trust model, path traversal, TOCTOU, offline, validation
✅ **Testing & Quality** — benchmarks, coverage gates (≥75%), biome.json, CodeQL, Windows CI

---

## Distribution & Packaging (Post-MVP)

### Overview
Post-MVP expansion (0.2–0.3): Multi-platform binary distribution, registry UI/UX, and community features. Unblocks adoption beyond macOS/Homebrew early adopters.

**Timeline estimate:** 4–6 weeks (parallel tracks)

**Phases:**
1. **Phase 1 (Weeks 1–2):** Windows + Linux CLI packaging
2. **Phase 2 (Weeks 2–3):** Web UI (search, browser, diffs)
3. **Phase 3 (Weeks 3–4):** Registry safety features
4. **Phase 4 (Weeks 4–6):** Community/social features

---

### TODO 20 — Windows Support (Chocolatey, WinGet)

**Goal:** Distribute `hyle` binary on Windows via Chocolatey and WinGet. Expand from current Homebrew-only distribution.

**Subtasks:**
- [ ] Create Chocolatey package manifest (`hyle.nuspec`)
  - Package metadata, icon, license
  - Binary verification + SHA256 pinning
  - Dependencies (Bun runtime? Node? None?)
  - Post-install scripts (PATH registration, version check)
- [ ] Set up WinGet package (`microsoft.hyle.yaml`)
  - Windows Package Manager community repo submission
  - Installer verification (MSIX or standalone .exe)
  - Auto-update configuration
- [ ] Update CI pipeline for Windows .exe signing
  - Code signing certificate (Windows Publisher) or Windows Sandbox sign option
  - `release.yml` integration for multi-artifact signing
- [ ] Test on Windows 10/11 + sandbox env
  - Verify binary paths, PATH env var, version --help
  - Rollback/uninstall scenarios
- [ ] Document Windows install path in `CONTRIBUTING.md`
  - WinGet usage example
  - Chocolatey usage example
  - Troubleshooting (UAC, antivirus false positives)

**Dependencies:** None (independent of TODO 21, 22)

**Effort:** 2–3 days

**Success criteria:**
- `winget install microsoft.hyle` works end-to-end
- `choco install hyle` works end-to-end
- Package updates propagate within 1–2 days of release
- No UAC/signing failures on Windows test matrix

---

### TODO 21 — Linux Packages (.deb, .rpm, Snap)

**Goal:** Distribute `hyle` via native Linux package managers (.deb for Debian/Ubuntu, .rpm for RHEL/Fedora, Snap for universal).

**Subtasks:**
- [ ] Create .deb package (Debian/Ubuntu)
  - `debian/control` (metadata, dependencies)
  - `debian/install` (binary placement, `/usr/local/bin/hyle`)
  - `debian/postinst` (post-install: version check, completion setup)
  - `debian/prerm` (pre-removal: cleanup)
  - Build via `dpkg-buildpackage` in CI
- [ ] Create .rpm package (RHEL/Fedora/CentOS)
  - `.spec` file (name, version, dependencies, scriptlets)
  - Binary packaging + signature (GPG signing for security)
  - Build via `rpmbuild` in CI
  - Test on CentOS 7, RHEL 8, Fedora 39
- [ ] Create Snap package (universal Linux)
  - `snapcraft.yaml` (name, version, base, parts, services)
  - Confinement mode (strict vs classic)
  - Auto-update configuration (stable channel + candidate for testing)
  - Publish to Snap Store
- [ ] Update CI for multi-distro testing
  - GitHub Actions matrix: ubuntu-latest, fedora-latest, debian-latest, centos-7
  - Verify installation + basic `hyle --version` on each
- [ ] Set up package signing + repository infrastructure
  - GPG key rotation policy for .deb/.rpm signatures
  - PPA (Personal Package Archive) for Ubuntu (optional, lower priority)
  - Repository hosting (GitHub Releases + APT/YUM mirrors)
- [ ] Document Linux install paths in `CONTRIBUTING.md`
  - `sudo apt install hyle` (Debian/Ubuntu)
  - `sudo dnf install hyle` (Fedora)
  - `snap install hyle` (universal)
  - Verify PATH + shell completions (bash, zsh)

**Dependencies:** None (independent of TODO 20, 22)

**Effort:** 3–4 days

**Success criteria:**
- `apt install hyle` works on Ubuntu 20.04, 22.04
- `dnf install hyle` works on Fedora 39, RHEL 8
- `snap install hyle` works on any Linux
- Packages auto-update on new releases
- No signed package verification failures

---

### TODO 22 — Website (Registry Search UI, Substrate Browser, Diffs)

**Goal:** Build web UI for substrate discovery, preview, and version comparisons. Extends current registry API with user-facing frontend.

**Subtasks:**
- [ ] Design + wireframe
  - Search UI (filter: name, author, tags, rating)
  - Substrate detail page (files, README, versions, authors, deps)
  - Version diff viewer (side-by-side: manifest, file list, ontology changes)
  - Portfolio view (author: substrates, stats, social links)
- [ ] Frontend: Search page
  - Next.js `web/src/app/pages/search` (refactor existing to use registry API)
  - Query params: `?q=`, `?author=`, `?tag=`
  - Pagination + sorting (popularity, recency, rating)
  - Faceted filters (language, platform, model provider)
- [ ] Frontend: Detail page
  - Manifest display (YAML + formatted)
  - File tree (ontology, craft, identities, ethics)
  - Version history (timeline, changelogs, install link)
  - Dependencies visualization (interactive DAG)
  - Author info + portfolio link
- [ ] Frontend: Diff viewer
  - Side-by-side or unified diff for `hyle.yaml` changes
  - File additions/deletions highlighting
  - Visual diff for manifest structure changes
  - Copy-to-clipboard for install commands
- [ ] Backend: API extensions
  - `GET /substrates/{name}@{version}/diff?base={base_version}` (return changeset)
  - `GET /authors/{author_id}` (portfolio, substrates, rating aggregates)
  - `GET /trending` (sorted by stars/installs/recent)
  - `GET /tags` (autocomplete for search filters)
- [ ] Styling + UX
  - Reuse `web/src/styles.css` patterns from landing/detail pages
  - Dark mode support (existing theme system)
  - Responsive mobile layout
  - A11y: ARIA labels, keyboard nav
- [ ] Analytics (optional, lower priority)
  - Track search queries + popular terms
  - Install button clicks (no PII)
  - Substrate view counts (not user-tracking, aggregate only)

**Dependencies:** Partial dependency on TODO 23 (checksums, safety flags)

**Effort:** 4–5 days

**Success criteria:**
- Search finds substrates by name/author/tag within 500ms
- Detail pages load + render all manifest sections
- Diff viewer shows version changes clearly
- Mobile layout passes responsive tests
- Performance: LCP <2.5s, CLS <0.1

---

### ✅ TODO 23 — Registry Safety (Auto-Scan, Flags, Diffs, Checksums)

**Status:** Complete (core features implemented).

**Implemented:**
- ✅ Auto-scan substrates on publish
  - ✅ Pattern scanner (eval, exec, file://, http://, IP-based URLs)
  - ✅ Spam detection (tiny bundles with no files auto-flagged)
  - ✅ Async scan on publish via `queueMicrotask()`
  - ✅ Store results in `security_scans` table
  - ❌ CVE database — out of scope (requires external service)
- ✅ Trust badges + flags
  - ✅ Computed badges (security_scanned, security_warning, security_flagged)
  - ✅ Badge variants + labels for UI
  - ✅ Returned in SecurityReport + optional on SubstrateResponse
  - ❌ Verified author badge — depends on GitHub/email verification system
  - ❌ Popular badge — depends on star/install count (TODO 24)
- ✅ Checksum verification improvements
  - ✅ API: `GET /substrates/{author}/{name}@{version}/checksums`
  - ✅ Returns SHA256 hash
  - ❌ GPG signatures — out of scope (requires key infrastructure)
- ⏳ Manifest + file diffs
  - Diffs already exist in TODO 22; breaking-change warnings deferred
- ✅ Security report
  - ✅ API: `GET /substrates/{author}/{name}@{version}/security-report`
  - ✅ Returns: scan results, badges, checksum, substrate metadata
- ✅ Registry abuse policies
  - ✅ Rate limiting: 10 publishes/hour per author (configurable)
  - ✅ Spam detection: auto-flag empty tiny bundles
  - ❌ Author takedown workflow — requires policy + moderation (future)

**New files:**
- `registry/src/scan.ts` — pattern detection logic + tests
- `registry/src/handlers/checksums.ts` — checksums API
- `registry/src/handlers/security.ts` — security report API + badge computation

**Modified files:**
- `registry/src/types.ts` — added ScanFinding, ScanResult, Badge, SecurityReport, ChecksumsResponse
- `registry/src/db.ts` — security_scans + publish_rate_limits tables; 5 new methods
- `registry/src/handlers/publish.ts` — rate limit check, spam detection, async scan trigger
- `registry/src/router.ts` — registered 2 new routes

**Test coverage:**
- `registry/tests/scan.test.ts` — 5 tests (pattern detection) ✅
- `registry/tests/db-security.test.ts` — 3 tests (DB + scan integration) ✅

**Out of scope (requires other work):**
- CVE database scanning → requires Trivy/Syft integration
- Verified author badge → requires GitHub OAuth + email verification (TODO 24 social features)
- Popular badge → requires star/install aggregates (TODO 24)
- GPG signature validation → requires key infrastructure + signing process
- Breaking-change warnings in diffs → part of TODO 22 UI
- Author takedown workflow → moderation system (future feature)

---

### TODO 24 — Registry Social (Stars, Reviews, Portfolios, Emails)

**Goal:** Build community features: user profiles, substrate ratings, reviews, author portfolios.

**Subtasks:**
- [ ] User accounts + authentication
  - OAuth via GitHub (minimal friction for devs)
  - Username/email profile setup
  - Profile page: avatar, bio, website, email (optional, private by default)
  - API token generation (for programmatic `hyle push`)
- [ ] Stars + ratings
  - Star a substrate (requires auth)
  - Rate substrate (1–5 stars, optional review text)
  - Aggregates: total stars, avg rating, trend (trending this week)
  - Display on detail page + search results (sort by rating)
  - API: `GET /substrates/{name}/stars/count`, `POST /substrates/{name}/stars` (auth)
- [ ] Reviews
  - Text review per user per substrate (edit/delete own)
  - Display recent reviews on detail page
  - Flag/report abusive reviews (spam, slurs)
  - Moderator approval optional (depends on abuse volume)
- [ ] Author portfolios
  - Portfolio page: all substrates, rating/star aggregates, bio
  - Verified badge (email verified + active contributions)
  - Follow author (optional, for notifications)
  - Stats: total substrates, avg rating, total installs
  - Featured substrates (author can highlight top 3)
- [ ] Email notifications (opt-in)
  - Substrate you subscribed to has a new version
  - Author you follow published a new substrate
  - Your substrate received a review
  - Frequency: daily digest or real-time (user pref)
  - Unsubscribe link in all emails (required by CAN-SPAM/GDPR)
- [ ] Badges + community milestones
  - "Popular" badge (1000+ installs)
  - "Maintainer" badge (author with 5+ active substrates)
  - "Community choice" (top rated in category)
  - Display on detail + portfolio pages
- [ ] Analytics dashboard for authors
  - Install trends (chart: last 30 days)
  - Rating distribution (bar: 1★–5★)
  - Review sentiment (if ML tool available; optional)
  - Top referrers (if trackable)

**Dependencies:** TODO 22 (UI framework), TODO 23 (author verification)

**Effort:** 4–5 days (including email infrastructure)

**Success criteria:**
- User registration + OAuth works
- Star/rate UI responsive + persists correctly
- Email delivery >99% (SLA monitoring)
- Portfolio pages load <1s
- No false-positive review flags
- GDPR compliance verified (privacy policy, consent, data export)

---

### Rollout Strategy

**Phase 1 (Weeks 1–2):** Windows + Linux CLI (parallel)
- No API changes; distribution-only
- Both can ship independently
- Enables 50% new user acquisition (non-macOS)

**Phase 2 (Weeks 2–3):** Web UI core
- Depends on existing registry API
- Can launch without social features
- Enables substrate discovery at scale

**Phase 3 (Weeks 3–4):** Registry safety
- Supports Phase 2 UI (checksum display, badges)
- Independent backend work
- Improves trust posture before social launch

**Phase 4 (Weeks 4–6):** Social features
- Last to launch (lowest risk, highest engagement)
- Can be iterated post-launch
- Drives retention + community

---

### Risk & Mitigations

| Risk | Mitigation |
|------|-----------|
| Windows code-signing delays | Pre-apply for cert in Week 0; use test cert in CI |
| .deb/.rpm packaging complexity | Use `cargo-deb` / `cargo-rpm` crate (if available for Bun) or FPM (Effing Package Manager) |
| Web UI performance regression | Lighthouse CI gate (LCP <2.5s, CLS <0.1) in CI |
| Abuse/spam on ratings | Rate limit (1 review per user per substrate), auto-flag new accounts |
| Email deliverability | Monitor bounce rates; use SES or SendGrid (not custom SMTP) |

---

### Success Metrics

- **Windows downloads:** 20% of total within 4 weeks
- **Linux downloads:** 30% of total within 4 weeks
- **Web search traffic:** 2000+ searches/month (from GA)
- **Substrate ratings:** Avg 4.2+ stars (quality filter)
- **Email engagement:** >15% open rate (industry baseline)
- **Author retention:** 70%+ publish a second version within 6 months



---

## Open Questions (Decisions Pending)

1. How aggressive should SSRF protection be?
2. Content-addressable vs path-addressable substrates?
3. Model-pin update strategy (email, CLI, CI gate)?
4. `hyle pull` behavior on conflicts (--force, --merge)?
5. Keep `hyle watch --split` or replace with `--budget`?
6. Default `hyle watch --audit` behavior (opt-in vs required)?
7. Hash mismatch strategy for script dependencies?
8. Support `.hyleignore` negation patterns?
9. Max fallback chain depth (5 reasonable?)?
10. `hyle index` weight strategy (remove LLM noise)?
11. Substrate inheritance depth (max 2 levels?)?
12. Private registry: self-hosted only or SaaS?
13. `extends` overrides representation?
14. Binary size limit?
15. Benchmark artifact storage?

---

## Critical Path (MVP — 0.1.0)

**Blocking (required before ship):**
1. ✅ TODO 1–3 — CLI scaffold + schema
2. ✅ Fix P0 items 1–10 (security, config, validation)
3. ✅ TODO 4–9 — Core commands (init, pull, push, snapshot, release, validate)
4. ⏳ TODO 10 — Registry API
5. ⏳ Package to Homebrew, WinGet, apt/rpm, Snap

**Post-MVP (0.2+):**
- Extensions (TODO 11–16)
- Website (TODO 22)
- Private registry
- Advanced registry features (TODO 23–24)


