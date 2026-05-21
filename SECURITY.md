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

Hylé substrates are **trusted by intent**: pulling a substrate means you trust the author. Always review `hyle.yaml` before pulling a substrate, especially the:
- `dependencies` block (external tools and scripts)
- `models` block (API providers and credentials)
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

### Registry Interaction

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

### Manifest Validation

All manifests are validated against a strict schema on load:
- Required fields: `name`, `author`, `version`, `models`
- Slugs: Lowercase alphanumeric with hyphens, max 64 chars
- Versions: Semantic versioning (x.y.z or x.y.z-snapshot)
- Semver ranges: For dependencies, versions must be valid semver ranges

## Known Limitations

1. **Supply Chain Verification**: While dependencies include sha256 hashes for script installation, verification happens at install time only. Scripts are not sandboxed.

2. **Manifest Execution**: Hylé does not execute code in manifests. All operations are data-driven and non-malicious by design.

3. **Authentication**: Two methods:
   - GitHub OAuth (web UI): Tokens stored securely by browser (OAuth redirects)
   - CLI Auth: `hyle login` uses OAuth device flow; tokens stored in `~/.hyle/auth.json` (user-readable, not encrypted)
   - API Keys: Legacy method; passed via environment variables (never commit)
   - Never share auth tokens; treat them like passwords

## Security Best Practices

For Hylé users:

1. **Review Before Pull**: Always inspect `hyle.yaml` in a substrate before pulling it
2. **Use HTTPS**: Configure registry URLs with `https://` (default)
3. **Version Pinning**: Pin model versions in `hyle.yaml` for reproducibility
4. **Audit Logging**: Use `hyle watch --audit` to generate hash-chained audit logs
5. **Offline Mode**: Use `hyle --offline` when working without network access

For Hylé maintainers:

1. **Dependency Scanning**: Run `bun audit --production` in CI/CD
2. **Code Review**: All pull requests require security-conscious review
3. **Release Signing**: Releases should be signed with GPG keys
4. **Changelog**: Security fixes should be documented in release notes

## Security Headers & Policies

- **Hylé CLI**: No network access without explicit user action or `--offline` flag
- **Registry**: HTTPS-only by default; HTTP requires explicit opt-in
- **Credentials**: Never logged, never cached in plaintext

## Questions?

For security-related questions (not vulnerability reports), open a discussion on GitHub or contact the maintainers.

---

**Last Updated**: 2026-05-21 (Phase 4: added OAuth, email, user account security notes)  
**Version**: 1.1
