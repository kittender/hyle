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

- [ ] TODO 11 — `hyle watch` terminal UI
- [ ] TODO 12 — `hyle watch --audit` GDPR audit log
- [ ] TODO 13 — `hyle watch --split` context splitting
- [ ] TODO 14 — `hyle identities --structure` LLM topology
- [ ] TODO 15 — `hyle ontology --structure` LLM index
- [ ] TODO 16 — `hyle index` unified metadata
- [ ] TODO 17 — `hyle install <extension>`
- [ ] TODO 18 — `hyle search <query>`
- [ ] TODO 19 — `hyle deps check [name]`

---

## Web Frontend

### CSS Refactoring
- [ ] CSS P1 (16 items) — Replace inline styles with existing classes
  - [ ] detail page cleanup
  - [ ] enterprise page cleanup
  - [ ] landing page cleanup
  - [ ] navigation component
  - [ ] search page cleanup

- [ ] CSS P2 (14 rules) — Add reusable patterns to `styles.css`
  - [ ] auth pages (login, register, forgot-password)
  - [ ] badges
  - [ ] meta items
  - [ ] buttons consistency

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

- [ ] CSS P4 (5 fixes) — `styles.css` consistency
  - [ ] Logo size standardization
  - [ ] QS title padding
  - [ ] Section header alignment
  - [ ] Code-inline utility
  - [ ] Badge-latest display

---

## Critical Fixes (P0)

- [ ] P0-1 — Fix `dep.install` trust model → structured format (`{ manager, pkg, url, sha256 }`)
- [ ] P0-2 — Fix `isUnsafePath` bypass → normalize paths + reject `".."`
- [ ] P0-3 — Fix `checkRegistry` TOCTOU → read from `.hyle` remote_url, advisory-only
- [ ] P0-4 — Add `--offline` flag + hermetic tests
- [ ] P0-5 — Fix `SLUG_RE` duplication → export from manifest.ts, import in init.ts
- [ ] P0-6 — Read version from package.json (not hardcoded)
- [ ] P0-7 — Call `validateManifest` in `runInit`
- [ ] P0-8 — Add `hyle validate <file>` command + JSON output
- [ ] P0-9 — Add `bun audit` to CI
- [ ] P0-10 — Add `SECURITY.md` + responsible disclosure

---

## Testing & Quality

- [ ] Add `.hyleignore` support tests
- [ ] Add offline mode tests (`--offline` flag)
- [ ] Add path traversal tests (`.."` bypass)
- [ ] Add unbounded fallback depth tests
- [ ] Verify `validateManifest` in `runInit`
- [ ] Add benchmark infrastructure
- [ ] Coverage threshold: ≥75% line, ≥65% branch, 100% critical paths
- [ ] Add `biome.json` with security rules
- [ ] CodeQL SAST integration
- [ ] Windows test runner in CI
- [ ] `bun audit` gate on severity

---

## Distribution & Packaging (Post-MVP)

- [ ] TODO 20 — Windows support (Chocolatey, WinGet)
- [ ] TODO 21 — Linux packages (.deb, .rpm, Snap)
- [ ] TODO 22 — Website (registry search UI, substrate browser, diffs)
- [ ] TODO 23 — Registry safety (auto-scan, flags, diffs, checksums)
- [ ] TODO 24 — Registry social (stars, reviews, portfolios, emails)

---

## Documentation

- [ ] `SECURITY.md` — vulnerability disclosure policy
- [ ] `CONTRIBUTING.md` — contribution guidelines
- [ ] Local testing guide (from SUMMARY.md)
- [ ] API docs for registry backend
- [ ] Substrate manifest examples
- [ ] Configuration reference

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
1. ✅ TODO 1–3 — CLI scaffold + schema (IN PROGRESS)
2. ⏳ Fix P0 items 1–8 (security, config, validation)
3. ⏳ TODO 4–9 — Core commands (init, pull, push, snapshot, release, validate)
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
| Config system | ⏳ TODO 5 | Two-layer merge |
| Core commands | ⏳ Mostly pending | 5 commands (pull, push, snapshot, release, validate) |
| Registry API | ⏳ Not started | Full backend |
| Security fixes | 🟡 In Progress | 7 critical items (P0-1,2,3,4,5,6,8,9,10 pending) |
| Testing | 🟡 In Progress | Coverage + benchmarks |
| Web frontend CSS | 🟡 In Progress | P1–P4 refinements |
| Packaging | ⏳ Not started | 5 platforms |
| Extensions | ⏳ Not started | 9 commands |
| Docs | ⏳ Mostly pending | SECURITY.md, CONTRIBUTING.md |

