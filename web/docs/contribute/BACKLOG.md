# Backlog

Possible evolutions for Hylé. **Not commitments** — no dates, no SLA. Ordered roughly
by interest.

## Distribution

- Native installers beyond source build: Homebrew, Chocolatey/WinGet, `.deb`/`.rpm`, Snap.
- Publish the CLI to npmjs / a private registry (Artifactory).

## Private & org registries

- Reference registry server packaged as image/binary with SQLite **or** PostgreSQL.
- Org namespaces (`hyle pull @acme/name`), per-org ACLs, private (unlisted) blueprints.
- Auth via OAuth/OIDC connectors or API tokens; `hyle login --registry <url>`.

## Security hardening

- Make manifest keyword scan **blocking** on critical findings (today: async + warn).
- Author trust tiers (unverified / community / verified) shown in UI.
- Quorum community flagging (N independent flags, not 1) to prevent abuse.
- Sandboxed plaintext diff preview of instruction files before apply.

## Discovery & graph

- User-declared priority weights instead of generated scores; better relevance ranking.
- `extends` chain visualization (DAG) on the detail page; cycle/breaking-change detection.
- Stack-aware blueprint recommendations.
- Semantic (not text-only) breaking-change detection with migration hints.

## Known debts (tracked, not blocking)

| Item | Note |
|------|------|
| Keytar token storage | Docs warning sufficient for now |
| CSP security headers | Angular mitigates most XSS |
| Read-side rate limiting | Add if load demands |
| Manifest schema validation (Zod) | Defensive parsing in place |
| PostgreSQL / Redis / S3 | SQLite + local disk sufficient at current scale |
| Multi-node HA deployment | Single-node fine for now |

