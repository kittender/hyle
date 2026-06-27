# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Hylé, please **do not** open a public issue. Instead, follow this responsible disclosure process:

1. **Email Security Report**: Send a detailed report to **security@kittender.com** with:
   - Title: Brief description of the vulnerability
   - Description: Detailed explanation of the issue
   - Steps to Reproduce: Clear reproduction steps or proof-of-concept
   - Impact Assessment: Severity, affected versions, and potential impact
   - Suggested Fix: If you have one (optional)

2. **Response Timeline**:
   - Initial acknowledgment: Within 48 hours
   - Status update: Within 1 week
   - Fix release: Within 30 days (or interim mitigation if fix requires longer)

3. **Embargo Period**: 
   - Vulnerabilities will be embargoed for 30 days or until a fix is released and widely deployed
   - Coordinated disclosure date will be agreed upon with you before publication

## Supported Versions

| Version | Support Status | End of Life |
|---------|---|---|
| 0.x.y   | Security updates only | TBD |

## Security Considerations

### Trust Model

Hylé blueprints are **trusted by intent**: pulling a blueprint means you trust the author. Always review `hyle.yaml` before pulling a blueprint, especially the:
- `dependencies` block (external tools and scripts)
- `recommendations` block (LLM providers the author tested with)
- File paths (ontology, craft, identities, ethics)

### Path Traversal Prevention

Hylé strictly validates all file paths to prevent directory traversal attacks:
- Paths must be relative (no `/` or `~` prefix)
- Paths containing `..` are rejected
- All paths are normalized before resolution

### Dependency Security

- Package manager commands (`brew`, `apt`, `npm`, etc.) are executed only with user confirmation
- Script installations require explicit `sha256` hash in the manifest (supply-chain safety)
- No shell string interpolation is performed on dependency names or URLs

### Registry Interaction & File Integrity

- **Blueprint files live on GitHub**: Registry stores only manifests and per-file SHA-256 checksums; actual files are downloaded directly from publishers' GitHub repos via `raw.githubusercontent.com`
- **Per-file checksums**: Each declared file has an individually verified SHA-256 hash. Mismatches are rejected with an explicit error
- **Git tags as version refs**: Blueprint versions are tied to git tags (e.g., `v1.0.0`) on the publisher's repo; checksums are computed at that specific tag
- All registry connections use HTTPS by default
- Registry uniqueness checks are **advisory only** (server-side validation is authoritative)
- HTTP registries require explicit `HYLE_ALLOW_INSECURE=1` environment variable
- Localhost registries require explicit `HYLE_ALLOW_INSECURE=1` for development

### User Accounts & Email Notifications

- User accounts are optional (needed for stars, reviews, portfolios, email notifications)
- GitHub OAuth used for sign-in (no password storage by Hylé; GitHub handles OAuth securely)
- Email notifications sent via Resend (third-party provider); verify privacy policy
- Users can disable email notifications in account settings (`email_on_stars`, `email_on_reviews`, etc.)
- Email addresses are never sold or shared with third parties

### Manifest Validation & Security Scans

All manifests are validated against a strict schema on load:
- Required fields: `name`, `author`, `version`
- Slugs: Lowercase alphanumeric with hyphens, max 64 chars
- Versions: Semantic versioning (x.y.z or x.y.z-snapshot)
- Semver ranges: For dependencies, versions must be valid semver ranges

**Registry security scan** (runs async on publish):
- Scans manifest JSON only; file contents never reach the registry
- Detects behavioral red flags in instruction files (CLAUDE.md, AGENTS.md): hardcoded credentials, suspicious network calls, skip-confirmation flags
- Flags suspicious file paths: traversal patterns, absolute paths
- No false negatives from missing files (registry never sees actual file content)

## Known Limitations

1. **Supply Chain Verification**: While dependencies include sha256 hashes for script installation, verification happens at install time only. Scripts are not sandboxed.

2. **Manifest Execution**: Hylé does not execute code in manifests. All operations are data-driven and non-malicious by design.

3. **Authentication**: OAuth2 + OIDC (no API keys):
   - GitHub OAuth (web UI): Tokens stored securely by browser (OAuth redirects)
   - CLI Auth: `hyle login` uses OAuth2 device flow; short-lived access tokens + offline refresh tokens stored in `~/.hyle/auth.json` (user-readable, not encrypted)
   - Self-hosted Registries: Support any OIDC provider (GitHub Enterprise, GitLab, Keycloak, Auth0, Okta, custom)
   - Refresh tokens stored locally; treat like passwords
   - Automatic token refresh before expiry

## Pre-Release Audit (2026-05-20)

Full-stack audit found 6 critical issues, all fixed before release: auth-interceptor
logic error (credential leak to third-party domains), hardcoded API URL, CORS wildcard
default, JWT secret default, async (non-blocking) security scan, OAuth code passed via
URL parameter. 4 lower-severity items (plaintext token storage, missing CSP headers,
no read-side rate limiting, manifest not schema-validated) are tracked as known debt —
see [backlog.md](../contribute/backlog.md#known-debts-tracked-not-blocking).

## Security Best Practices

For Hylé users:

1. **Review Before Pull**: Always inspect `hyle.yaml` before pulling it
2. **Use HTTPS**: Configure registry URLs with `https://` (default)
3. **Version Pinning**: Pin model versions in `hyle.yaml` for reproducibility
4. **Offline Mode**: Use `hyle --offline` when working without network access

For Hylé maintainers:

1. **Dependency Scanning**: Run `bun audit --production` in CI/CD
2. **Code Review**: All pull requests require security-conscious review
3. **Release Signing**: Releases should be signed with GPG keys
4. **Changelog**: Security fixes should be documented in release notes

## Security Headers & Policies

- **Hylé CLI**: No network access without explicit user action or `--offline` flag
- **Registry**: HTTPS-only by default; HTTP requires explicit opt-in
- **Refresh Tokens**: Stored in plain text locally; use file permissions (`chmod 600 ~/.hyle/auth.json`) to restrict access

## Questions?

For security-related questions (not vulnerability reports), open a discussion on GitHub or contact the maintainers.

---

**Last Updated**: 2026-06-27 (folded pre-release audit history into this policy)
**Version**: 1.2
