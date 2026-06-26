# Hylé Release Checklist

Steps to ship the **first public release** (target `v0.2.0`). Hylé is pre-release today
(CLI `0.1.0`, unreleased) — this is the gate to clear before that changes. See
[SECURITY_AUDIT.md](SECURITY_AUDIT.md) for security findings and [DEPLOYMENT.md](DEPLOYMENT.md) for ops readiness.

---

## Pre-Release: Critical Fixes

**BLOCKING:** Must fix before shipping. **Effort: ~3 hours.**

| Issue | File:Line | Problem | Fix | Status |
|-------|-----------|---------|-----|--------|
| **P0: Auth interceptor logic** | web/src/app/interceptors/auth.interceptor.ts:12 | Bearer token leaked to ANY `/api` request | Add parentheses: `if (token && (req.url.includes('localhost:3000') \|\| req.url.includes('/api')))` | — |
| **P1: Hardcoded API URL** | web/src/app/app.config.ts:16 | Localhost hardcoded; fails in production | Use `environment.ts` pattern with `window.location.origin.replace(/:\d+/, ':3000')` | — |
| **P2: CORS wildcard default** | registry/src/server.ts:19 | Allows any origin to POST; CSRF risk | Fail-fast if `HYLE_WEB_ORIGIN` not set; console.error + exit(1) | — |
| **P3: JWT secret default** | registry/src/server.ts:10 | Uses hardcoded "dev-secret-key"; tokens forgeable | Fail-fast if `JWT_SECRET` not in env; console.error + exit(1) | — |
| **P4: Async security scan** | registry/src/handlers/publish.ts:161 | Malicious blueprints published before scan complete | Block manifest scan (sync). Async only on bundle content. | — |
| **P6: OAuth via URL params** | cli/src/commands/login.ts:17 | Token in query string; exposed in logs/history | Change callback to POST with body; return token in response | — |

**Implementation order** (dependencies matter):
1. P3 + P2 (2 min each, no deps)
2. P0 (15 min, test with Postman)
3. P1 (30 min, add environment.ts)
4. P4 (60 min, refactor publish handler)
5. P6 (60 min, change OAuth flow)

---

## Release Sign-Off

**After fixes pass, verify:**

| Item | Command | Expected |
|------|---------|----------|
| Tests pass | `bun test` | 102+ tests ✅ |
| Lint clean | `bun run lint` | 0 warnings |
| Audit clean | `bun audit --production` | No vulnerabilities |
| Web smoke test | `ng test --run` | app.spec.ts ✅ |
| CLI binary builds | `cd cli && bun run build` | dist/hyle created, executable |

**Pass all above → proceed to staging**

---

## Deployment to Staging

1. Merge branch to `develop`
2. Tag: `git tag v0.2.0-rc1`
3. Push: `git push origin v0.2.0-rc1`
4. CI auto-builds binaries
5. Deploy to `staging.registry.hylé.com` (or test env)

**Smoke tests on staging (30 min):**
```bash
# Set env vars (see DEPLOYMENT.md)
hyle login
hyle search test
hyle pull org/test-blueprint
hyle init && hyle push  # test publish

# Check logs for errors
curl https://staging.registry.hylé.com/health
```

---

## Production Deployment

**Timeline: Next day (after staging validation).**

1. Merge to `main`
2. Tag: `git tag v0.2.0`
3. Push: `git push origin v0.2.0`
4. Deploy to `registry.hylé.com` (zero-downtime if possible)
5. Monitor for 24h (error rate, latency, scans)

**Announce only after 24h stable.**

---

## Deferred to v0.3+ (Post-Ship)

| Item | Effort | Blocking |
|------|--------|----------|
| P5: Keytar token storage (or docs warning) | 1 day | NO |
| P7: HTTPS enforcement soft check | 30 min | NO |
| P8: CSP security headers | 1 hour | NO |
| P9: Read-side rate limiting | 2 hours | NO |
| P10: Manifest schema validation (Zod) | 1 day | NO |
| Windows/Linux native binaries | 2 days | NO — Homebrew sufficient for beta |
| Private registry support | 3 days | NO — Post-v0.2 |

---

## Success Metrics (First 6 weeks)

| Metric | Target |
|--------|--------|
| Uptime | 99.5%+ |
| Search latency (p99) | <500ms |
| Publish latency | <2s |
| Security incidents | 0 |
| False positive scans | <5% |
| User signups | 100+ |
| Blueprints published | 50+ |

---

## Incident Response (See DEPLOYMENT.md)

If production breaks:
1. Page oncall
2. Identify severity (P0-P3 = immediate rollback)
3. Follow runbook (malicious blueprint / auth compromise / database / DDoS)
4. Post-mortem within 24h

---

## Sign-Off

- [ ] All P0-P6 fixes merged and tested
- [ ] Staging validation passed
- [ ] Release notes drafted (see git log)
- [ ] Team notified of deployment window
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

**Approved by:** [Name]  
**Date:** [Date]  
**Version:** v0.2.0
