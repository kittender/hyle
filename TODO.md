# Hylé TODO List
**Last updated:** 2026-05-02 (based on SUMMARY.md from 2026-04-29 + git commit c519d12)

---

## Core CLI Implementation

### Scaffolding (TODO 1-3)
- [x] TODO 1 — CLI stack scaffold (Bun, toolchain, CI matrix, release pipeline)
  - [x] `cli/package.json` + `bun.lock`
  - [x] `cli/tsconfig.json` configured
  - [x] GitHub workflows (`.github/workflows/ci.yml`, `release.yml`)
  - [x] Build pipeline (`cli/scripts/build-all.ts`)
  - [x] Binary release automation (release.yml)
  - [x] CI build:all sanity check

- [x] TODO 2 — hyle.yaml schema definition + TypeScript validation
  - [x] `schema/hyle.schema.json` created
  - [x] `cli/src/manifest.ts` validation module (403 lines)
  - [x] Test fixtures (`cli/tests/fixtures/invalid/traversal-dotdot.yaml`)
  - [x] JSON Schema enforcement in runtime (`loadManifest()`)
  - [x] Error message polish (validation errors printed on load)
  - [x] Validation call in `runInit` (P0-7)

- [x] TODO 3 — Monorepo structure (git, workspaces, web scaffold)
  - [x] `cli/` workspace set up with package.json
  - [x] `web/` structure exists with Next.js
  - [x] `.github/workflows/` for CI
  - [x] Workspace linking (root `package.json` monorepo config)
  - [x] Version sync (0.1.0 across packages)

### Commands (TODO 4-10)
- [x] TODO 4 — `hyle init` command
  - [x] `cli/src/commands/init.ts` (180 lines)
  - [x] Interactive setup + manifest generation
  - [x] Tests (`cli/tests/init.test.ts`, 138 lines)
  - [x] `.hyle` + `.hyleignore` auto-generation
  - [x] Reference injection workflow

- [x] TODO 5 — `.hyle` config system
  - [x] `cli/src/config.ts` stub (42 lines)
  - [x] Two-layer merge (global `~/.hyle` + local `.hyle`)
  - [x] Config validation
  - [x] Tests (`cli/tests/init.test.ts`, config subsection)

- [x] TODO 6 — `.hyleignore` parser
  - [x] `cli/src/ignore.ts` (gitignore-style pattern matching with micromatch)
  - [x] Exclusion during push/scan
  - [x] Tests (`cli/tests/ignore.test.ts`)

- [x] TODO 7 — File-scanning commands
  - [x] `hyle ontology [path]`
  - [x] `hyle craft [path]`
  - [x] `hyle identities [path]`
  - [x] `hyle ethics [path]`
  - [x] Dedup + respect ignore patterns
  - [x] Tests (`cli/tests/scan.test.ts`)

- [x] TODO 8 — Publish workflow
  - [x] `hyle snapshot` (patch bump, unstable)
  - [x] `hyle push` (minor bump, stable)
  - [x] `hyle release` (major bump, stable)
  - [x] Auto-versioning + bundling
  - [x] Checksum generation + upload

- [x] TODO 9 — `hyle pull` command
  - [x] Fetch substrate from registry
  - [x] Validate checksum
  - [x] Resolve dependencies (basic stub)
  - [x] Install + inject references

- [x] TODO 10 — Registry backend API
  - [x] SQLite + local filesystem integration
  - [x] Search endpoint
  - [x] Version resolution
  - [x] Dependency hints endpoint

---

## Extensions (LLM-powered, opt-in)

- [x] TODO 11 — `hyle watch` terminal UI
- [x] TODO 12 — `hyle watch --audit` GDPR audit log
- [x] TODO 13 — `hyle watch --split` context splitting
- [ ] TODO 14 — `hyle identities --structure` LLM topology
- [ ] TODO 15 — `hyle ontology --structure` LLM index
- [ ] TODO 16 — `hyle index` unified metadata
- [ ] TODO 17 — `hyle install <extension>`
- [ ] TODO 18 — `hyle search <query>`
- [ ] TODO 19 — `hyle deps check [name]`

---

## Web Frontend

### CSS Refactoring
- [x] CSS P1 (16 items) — Replace inline styles with existing classes
  - [x] detail page cleanup
  - [x] enterprise page cleanup
  - [x] landing page cleanup
  - [x] navigation component
  - [x] search page cleanup

- [x] CSS P2 (14 rules) — Add reusable patterns to `styles.css`
  - [x] auth pages (login, register, forgot-password)
  - [x] badges
  - [x] meta items
  - [x] buttons consistency

- [x] CSS P3 (~80 classes) — Per-component CSS organization
  - [x] `web/src/app/components/nav/nav.css`
  - [x] `web/src/app/pages/detail/detail.css`
  - [x] `web/src/app/pages/enterprise/enterprise.css`
  - [x] `web/src/app/pages/landing/landing.css`
  - [x] `web/src/app/pages/login/login.css`
  - [x] `web/src/app/pages/register/register.css`
  - [x] `web/src/app/pages/search/search.css`
  - [x] `web/src/app/pages/forgot-password/forgot-password.css`
  - [x] `web/src/app/pages/profile/profile.css`
  - [x] `web/src/app/pages/docs/docs.css`

- [x] CSS P4 (5 fixes) — `styles.css` consistency
  - [x] Logo size standardization
  - [x] QS title padding
  - [x] Section header alignment
  - [x] Code-inline utility
  - [x] Badge-latest display

---

## Critical Fixes (P0)

- [x] P0-1 — Fix `dep.install` trust model → structured format (`{ manager, pkg, url, sha256 }`)
- [x] P0-2 — Fix `isUnsafePath` bypass → normalize paths + reject `".."`
- [x] P0-3 — Fix `checkRegistry` TOCTOU → read from `.hyle` remote_url, advisory-only
- [x] P0-4 — Add `--offline` flag + hermetic tests
- [x] P0-5 — Fix `SLUG_RE` duplication → export from manifest.ts, import in init.ts
- [x] P0-6 — Read version from package.json (not hardcoded)
- [x] P0-7 — Call `validateManifest` in `runInit`
- [x] P0-8 — Add `hyle validate <file>` command + JSON output
- [x] P0-9 — Add `bun audit` to CI
- [x] P0-10 — Add `SECURITY.md` + responsible disclosure

---

## Testing & Quality

- [x] Add `.hyleignore` support tests
- [x] Add offline mode tests (`--offline` flag)
- [x] Add path traversal tests (`.."` bypass)
- [x] Add unbounded fallback depth tests
- [x] Verify `validateManifest` in `runInit`
- [ ] Add benchmark infrastructure
- [x] Coverage threshold: ≥75% line, ≥65% branch, 100% critical paths
- [x] Add `biome.json` with security rules
- [x] CodeQL SAST integration
- [x] Windows test runner in CI
- [x] `bun audit` gate on severity

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

### TODO 23 — Registry Safety (Auto-Scan, Flags, Diffs, Checksums)

**Goal:** Add security & transparency features: supply chain scanning, trust badges, checksums, version diffs.

**Subtasks:**
- [ ] Auto-scan substrates on publish
  - Integration with SBOM scanner (Syft) or supply-chain tool (Trivy)
  - Scan manifest for suspicious patterns (eval, exec, `file://` in URLs)
  - Scan bundled files for known vulnerabilities (CVE database)
  - Store scan results in registry DB (cached, re-scan on push)
- [ ] Trust badges + flags
  - "Verified author" badge (manual approval, linked GitHub/email verification)
  - "Security scanned" badge (auto-scan passed, no critical vulns)
  - "Popular" badge (>100 installs or >5 stars)
  - Red flags: new author, no verified email, suspicious deps, unsigned
  - Display on UI + API metadata
- [ ] Checksum verification improvements
  - Include `substrate.tar.gz.sig` (GPG signature) on publish
  - Verify publisher GPG key on pull (warn if unsigned)
  - Display checksums on detail page (user copy for verification)
  - API: `GET /substrates/{name}@{version}/checksums` (SHA256, GPG signature)
- [ ] Manifest + file diffs
  - Track `hyle.yaml` deltas per version (stored as JSON patches)
  - File-level diffs (ontology/craft changes highlighted)
  - Warn on breaking changes (e.g., model version bump, new required dependency)
  - Changelog auto-generation from diffs + commit messages
- [ ] Security report
  - API: `GET /substrates/{name}@{version}/security-report`
  - Return: scan results, CVE count, flags, unsigned warning, author verification status
  - Display on UI in prominent card
- [ ] Registry abuse policies
  - Rate limits on publish (1 per hour per author, burst cap)
  - Spam detection (very small/empty substrates auto-flagged)
  - Author takedown workflow (contact + review)

**Dependencies:** TODO 22 (UI to display flags/scans)

**Effort:** 3–4 days

**Success criteria:**
- Scans run on 100% of published substrates
- Checksums stored + verified on pull
- Security report populated for all versions
- No false positives on safe substrates
- Scan latency <2 min per publish

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

## Documentation

- [x] `SECURITY.md` — vulnerability disclosure policy
- [x] `CONTRIBUTING.md` — contribution guidelines
- [x] Local testing guide (from SUMMARY.md) → `LOCAL_TESTING.md`
- [x] API docs for registry backend → `REGISTRY_API.md`
- [x] Substrate manifest examples → `MANIFEST_EXAMPLES.md`
- [x] Configuration reference → `CONFIG_REFERENCE.md`

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

---

## Status Summary

| Category | Status | Gap |
|----------|--------|-----|
| Specification | ✅ Complete | — |
| Monorepo scaffold | ✅ Complete | — |
| CLI scaffold | ✅ Complete | — |
| Schema validation | ✅ Complete | — |
| `hyle init` | ✅ Complete | All subtasks done |
| Config system | ✅ Complete | Two-layer merge done |
| Core commands | ✅ Mostly complete | pull, push, snapshot, release, validate all implemented |
| Registry API | ⏳ Not started | Full backend |
| Security fixes | ✅ Complete | All P0-1–P0-10 done |
| Testing & Quality | ✅ Complete | 81 tests, biome.json, CodeQL, coverage gates, Windows CI |
| Web frontend CSS | ✅ Complete | P1–P4 refinements done |
| Packaging | ⏳ Not started | 5 platforms |
| Extensions | 🟡 In Progress | 3/9 complete (watch 11-13), 6 pending |
| Docs | ✅ Complete | SECURITY.md, CONTRIBUTING.md, LOCAL_TESTING.md, REGISTRY_API.md, MANIFEST_EXAMPLES.md, CONFIG_REFERENCE.md |

## Analysis

### Obsolete (delete):

PLAN.md — Narrative version of TODO.md. Redundant; TODO.md is live source.
SUMMARY.md — Restates PLAN.md + TODO.md. No new info.
todo-1.md, todo-2.md, todo-3.md, todo-4.md — Detailed implementation specs (1083 lines). Belong in code comments, ADRs, or GitHub issues, not persistent docs.
REVIEW.md — Design feedback without clear resolution. Either: (a) feed issues into backlog w/ links, or (b) fold unresolved items into ARCHITECTURE.md.

### Keep (actively used):

README.md — Product overview. Needed for context.
CONFIG_REFERENCE.md — Technical reference for hyle.yaml schema. Essential when editing config logic.
CONTRIBUTING.md — Dev setup. Needed for onboarding.
LOCAL_TESTING.md — Testing workflow with mock registry. Practical.
MANIFEST_EXAMPLES.md — Quick reference for users/devs.
REGISTRY_API.md — Backend API reference. Needed for API work.
SECURITY.md — Responsible disclosure + best practices. Required.
TODO.md — Live status. Keep but trim: add brief rationale inline as comments.
CLAUDE.md — Project instructions.
Optional consolidation:

GUIDE.md (AWS deployment) — Niche audience. Either keep as-is or move to /docs/deployment/ and link from README.
Delete first, then optionally split refs from REVIEW.md into GitHub issues w/ labels.

### TODO

- [ ] Move "GUIDE.md" like stated: "move to /docs/deployment/ and link from README."
- [ ] Regarding REVIEW.md proceed with option (b)
- [ ] Delete obsolete files and move to code comments anything useful.

