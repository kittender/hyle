# Registry API Documentation

Complete reference for the Hylé Registry backend API. See [Deployment guide](../deploy/production.md) for hosting options (Tier 1-3).

## Base URL

- **Production**: `https://registry.hylé.com`
- **Development**: `http://localhost:3001/api` (mock server)

## Authentication

All endpoints require OAuth2 + OIDC authentication. Tokens are passed via the `Authorization` header:

```
Authorization: Bearer <access-token>
```

Access tokens are obtained by:
1. **Public Registry** (`https://registry.hylé.com`): Use `hyle login` (GitHub OAuth)
2. **Self-Hosted Registry**: Use `hyle login --registry <custom-url>` (supports any OIDC provider)

Tokens are short-lived (expiry varies by provider). Use refresh tokens to obtain new access tokens automatically (CLI handles this transparently).

### Public Registry (GitHub SSO Only)

```bash
# Interactive login (GitHub device flow)
hyle login

# Token stored in ~/.hyle/auth.json
cat ~/.hyle/auth.json
```

### Self-Hosted Registry (Any OIDC Provider)

```bash
# Registry must expose OpenID Connect discovery
hyle login --registry https://company-registry.internal

# CLI auto-detects OIDC provider from registry's /.well-known/openid-configuration
# Supports GitHub Enterprise, GitLab, Keycloak, Auth0, Okta, or custom OIDC
```

## OpenID Connect Discovery

All registries expose a standard OpenID Connect discovery endpoint. CLI uses this to auto-detect OIDC provider configuration.

### Discovery Endpoint

**Endpoint**: `GET /.well-known/openid-configuration`

**Response** (200 OK):

```json
{
  "issuer": "https://registry.hylé.com",
  "authorization_endpoint": "https://github.com/login/oauth/authorize",
  "token_endpoint": "https://github.com/login/oauth/access_token",
  "jwks_uri": "https://registry.hylé.com/.well-known/jwks.json",
  "scopes_supported": ["read:user", "user:email"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"]
}
```

**Usage**:

```bash
# Public registry discovery
curl https://registry.hylé.com/.well-known/openid-configuration | jq .

# Self-hosted registry discovery
curl https://company-registry.internal/.well-known/openid-configuration | jq .
```

This endpoint is **unauthenticated** (no Authorization header needed). CLI auto-detects the OIDC provider from this endpoint and directs the user to the correct login flow.

## Core Endpoints

### Search Blueprints

**Endpoint**: `GET /search`

**Query Parameters**:
- `q` (string, required): Search query (name, author, tags, description)
- `limit` (integer, optional, default: 20): Max results to return
- `offset` (integer, optional, default: 0): Pagination offset
- `tag` (string, optional): Filter by tag
- `author` (string, optional): Filter by author

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_ACCESS_TOKEN" \
  "https://registry.hylé.com/search?q=auth&limit=10"
```

**Response** (200 OK):

```json
{
  "results": [
    {
      "name": "auth-middleware",
      "author": "kittender",
      "version": "1.2.0",
      "description": "OpenID Connect middleware blueprint",
      "tags": ["auth", "oidc"],
      "downloads": 1250,
      "stars": 42,
      "published_at": "2026-04-15T10:30:00Z",
      "homepage": "https://github.com/kittender/auth-middleware"
    }
  ],
  "total": 5,
  "has_more": false
}
```

### Get Blueprint Metadata

**Endpoint**: `GET /blueprints/:author/:name/:version`

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_ACCESS_TOKEN" \
  "https://registry.hylé.com/blueprints/kittender/auth-middleware/1.2.0"
```

**Response** (200 OK):

```json
{
  "name": "auth-middleware",
  "author": "kittender",
  "version": "1.2.0",
  "description": "OpenID Connect middleware blueprint",
  "homepage": "https://github.com/kittender/auth-middleware",
  "tags": ["auth", "oidc"],
  "recommendations": {
    "universal": [
      "anthropic/claude-sonnet-4-6",
      "openai/gpt-4o"
    ]
  },
  "dependencies": [
    {
      "manager": "npm",
      "pkg": "jsonwebtoken",
      "version": "^9.0.0"
    }
  ],
  "ontology": [
    {
      "path": "docs/architecture.md",
      "type": "documentation"
    }
  ],
  "craft": [
    {
      "path": "schema/auth.schema.json",
      "type": "schema"
    }
  ],
  "identities": [
    {
      "path": ".claude/agents/middleware.md",
      "type": "agent"
    }
  ],
  "ethics": [
    {
      "path": ".cedar/auth.cedar",
      "type": "policy"
    }
  ],
  "manifest_sha256": "abc123def456...",
  "bundle_sha256": "xyz789...",
  "size_bytes": 45678,
  "published_at": "2026-04-15T10:30:00Z",
  "downloads": 1250
}
```

### Fetch Blueprint Bundle

**Endpoint**: `GET /blueprints/:author/:name/:version/bundle`

Downloads the complete blueprint as a `.tar.gz` file.

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_ACCESS_TOKEN" \
  "https://registry.hylé.com/blueprints/kittender/auth-middleware/1.2.0/bundle" \
  -o blueprint.tar.gz

# Verify checksum
sha256sum -c <<< "xyz789... blueprint.tar.gz"
```

**Response** (200 OK):
- Content-Type: `application/gzip`
- Content-Length: bundle size in bytes
- Content-Disposition: `attachment; filename="auth-middleware-1.2.0.tar.gz"`

### Publish/Update Blueprint

**Endpoint**: `POST /blueprints/:author/:name`

**Headers**:
- `Authorization: Bearer <access-token>` (OAuth2/OIDC access token)
- `Content-Type: multipart/form-data`

**Body Parameters**:
- `manifest` (file, required): `hyle.yaml` manifest file
- `bundle` (file, required): `.tar.gz` bundle containing all referenced files
- `version` (string, required): Semantic version (x.y.z or x.y.z-snapshot)
- `stable` (boolean, optional, default: false): Mark as stable release

**Example**:

```bash
# Get access token
hyle login
TOKEN=$(jq -r '.access_token' ~/.hyle/auth.json)

curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "manifest=@hyle.yaml" \
  -F "bundle=@blueprint.tar.gz" \
  -F "version=1.2.0" \
  -F "stable=true" \
  "https://registry.hylé.com/blueprints/kittender/auth-middleware"
```

**Response** (201 Created):

```json
{
  "name": "auth-middleware",
  "author": "kittender",
  "version": "1.2.0",
  "manifest_sha256": "abc123def456...",
  "bundle_sha256": "xyz789...",
  "published_at": "2026-04-15T10:30:00Z"
}
```

**Error Responses**:

- **400 Bad Request**: Missing fields, invalid manifest format, bundle size > 50MB
- **409 Conflict**: Version already exists
- **413 Payload Too Large**: Bundle exceeds size limit
- **422 Unprocessable Entity**: Manifest validation failed

### Resolve Dependencies

**Endpoint**: `GET /blueprints/:author/:name/:version/deps`

Returns dependency resolution hints (available versions, latest stable, etc.).

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_ACCESS_TOKEN" \
  "https://registry.hylé.com/blueprints/kittender/auth-middleware/1.2.0/deps"
```

**Response** (200 OK):

```json
{
  "dependencies": [
    {
      "manager": "npm",
      "pkg": "jsonwebtoken",
      "version": "^9.0.0",
      "available_versions": ["9.0.0", "9.0.1", "9.0.2"],
      "latest": "9.0.2"
    }
  ],
  "warnings": []
}
```

### Version History

**Endpoint**: `GET /blueprints/:author/:name/versions`

List all published versions of a blueprint.

**Query Parameters**:
- `stable_only` (boolean, optional, default: false): Return only stable versions

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_ACCESS_TOKEN" \
  "https://registry.hylé.com/blueprints/kittender/auth-middleware/versions?stable_only=true"
```

**Response** (200 OK):

```json
{
  "name": "auth-middleware",
  "author": "kittender",
  "versions": [
    {
      "version": "1.2.0",
      "published_at": "2026-04-15T10:30:00Z",
      "stable": true,
      "downloads": 1250
    },
    {
      "version": "1.1.0",
      "published_at": "2026-04-10T14:20:00Z",
      "stable": true,
      "downloads": 850
    }
  ]
}
```

## Error Handling

All error responses follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error description",
  "details": {
    "field": "reason for failure"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `not_found` | 404 | Blueprint or version does not exist |
| `unauthorized` | 401 | Invalid or missing access token |
| `forbidden` | 403 | Permission denied (not author of blueprint) |
| `validation_failed` | 422 | Manifest or bundle validation failed |
| `version_conflict` | 409 | Version already published |
| `payload_too_large` | 413 | Bundle exceeds size limit (50MB) |
| `rate_limited` | 429 | Too many requests (10 req/min per token) |
| `internal_error` | 500 | Server error (retry with exponential backoff) |

## Rate Limiting

All endpoints are rate-limited to **10 requests per minute** per access token.

Response headers include:
- `X-RateLimit-Limit`: 10
- `X-RateLimit-Remaining`: requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Pagination

Endpoints that return lists support pagination via:
- `limit` (1–100, default: 20)
- `offset` (0–based index)

Response includes:
- `total`: total number of results
- `has_more`: boolean indicating if more results exist

## Checksums & Integrity

All artifacts are published with SHA-256 checksums:

```bash
# Verify manifest checksum
sha256sum manifest.tar.gz

# Verify bundle matches published checksum
curl -s "https://registry.hylé.com/blueprints/author/name/1.0.0" | \
  jq '.bundle_sha256' | \
  sha256sum -c -
```

## HTTPS & Security

- **All endpoints** require HTTPS (automatic upgrade from HTTP)
- **Localhost** (`127.0.0.1`, `[::1]`) allowed only with `HYLE_ALLOW_INSECURE=1`
- **Access tokens** never logged or cached in plaintext
- **CORS** restricted to `https://*.hylé.com` and configured registries

### Stars & Community Features

**Toggle Star**

**Endpoint**: `POST /blueprints/:author/:name/stars`

**Headers**: `Authorization: Bearer <auth-token>`

**Body**:
```json
{ "starred": true }
```

**Response** (200 OK):
```json
{ "starred": true, "total_stars": 42 }
```

---

**Get Blueprint Reviews**

**Endpoint**: `GET /blueprints/:author/:name/reviews`

**Query Parameters**:
- `limit` (integer, optional, default: 10)
- `offset` (integer, optional, default: 0)
- `sort` (string, optional): `recent`, `helpful`, `rating` (default: `recent`)

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "id": "rev_123",
      "author": "user_456",
      "rating": 5,
      "text": "Excellent blueprint!",
      "created_at": "2026-05-20T10:00:00Z",
      "helpful_count": 3
    }
  ],
  "avg_rating": 4.7,
  "total_reviews": 12,
  "has_more": false
}
```

---

**Submit Review**

**Endpoint**: `POST /blueprints/:author/:name/reviews`

**Headers**: `Authorization: Bearer <auth-token>`

**Body**:
```json
{
  "rating": 5,
  "text": "Great blueprint, highly recommended!"
}
```

**Response** (201 Created):
```json
{
  "id": "rev_123",
  "rating": 5,
  "text": "Great blueprint, highly recommended!",
  "created_at": "2026-05-20T10:00:00Z"
}
```

---

### User Accounts & Authentication

**GitHub OAuth Callback**

**Endpoint**: `POST /auth/github/callback`

**Body**:
```json
{ "code": "github_auth_code_from_oauth_flow" }
```

**Response** (200 OK):
```json
{
  "token": "auth_token_for_api_requests",
  "user": {
    "id": "user_123",
    "username": "example-user",
    "avatar": "https://github.com/example-user.png",
    "email": "user@example.com"
  }
}
```

---

**Get User Profile**

**Endpoint**: `GET /accounts/me`

**Headers**: `Authorization: Bearer <auth-token>`

**Response** (200 OK):
```json
{
  "id": "user_123",
  "username": "example-user",
  "email": "user@example.com",
  "avatar": "https://github.com/example-user.png",
  "bio": "Blueprint author",
  "website": "https://example.com",
  "verified": true,
  "created_at": "2026-05-01T00:00:00Z"
}
```

---

**Get Author Portfolio**

**Endpoint**: `GET /authors/:username`

**Response** (200 OK):
```json
{
  "username": "author-name",
  "avatar": "https://github.com/author-name.png",
  "bio": "Creator of cool blueprints",
  "website": "https://author.com",
  "verified": true,
  "blueprints": [
    {
      "name": "java-springboot",
      "version": "1.0.0",
      "stars": 150,
      "avg_rating": 4.8,
      "downloads": 5000,
      "published_at": "2026-04-01T00:00:00Z"
    }
  ],
  "total_blueprints": 5,
  "total_stars": 500,
  "avg_rating": 4.6
}
```

---

**Notification Preferences**

**Endpoint**: `PUT /accounts/me/notification-prefs`

**Headers**: `Authorization: Bearer <auth-token>`

**Body**:
```json
{
  "email_on_stars": true,
  "email_on_reviews": true,
  "email_on_new_versions": true,
  "email_digest_frequency": "daily"
}
```

**Response** (200 OK):
```json
{
  "email_on_stars": true,
  "email_on_reviews": true,
  "email_on_new_versions": true,
  "email_digest_frequency": "daily"
}
```

---

### Security & Badges

**Get Security Report**

**Endpoint**: `GET /blueprints/:author/:name/:version/security-report`

**Response** (200 OK):
```json
{
  "version": "1.0.0",
  "scanned_at": "2026-05-20T10:00:00Z",
  "security_status": "passed",
  "findings": [],
  "badges": [
    {
      "name": "security_scanned",
      "label": "Security Scanned",
      "description": "Automated security scan passed"
    },
    {
      "name": "verified_author",
      "label": "Verified Author",
      "description": "Author identity verified"
    },
    {
      "name": "popular",
      "label": "Popular",
      "description": "1000+ installations"
    }
  ]
}
```

---

**Get Checksums**

**Endpoint**: `GET /blueprints/:author/:name/:version/checksums`

**Response** (200 OK):
```json
{
  "manifest_sha256": "abc123...",
  "bundle_sha256": "xyz789..."
}
```

---

## Changelog

### API v2.0.0 (Current)

- All core endpoints from v1.0.0
- **New**: Stars, reviews, ratings
- **New**: User accounts + GitHub OAuth
- **New**: Author portfolios
- **New**: Email notifications
- **New**: Security badges + reports
- Rate limiting: per-endpoint (search/publish 10 req/min, general 30 req/min)
- Bundle size limit: 50MB

### API v1.0.0 (Legacy)

- Initial stable API
- Endpoints: search, fetch, publish, resolve, versions
- Rate limiting: 10 req/min per key

## Examples

### Publish a Blueprint

Using the CLI (recommended):

```bash
# Login (GitHub OAuth device flow)
hyle login

# Push blueprint (CLI handles auth automatically)
hyle push --version 1.2.0
```

Using the API directly:

```bash
#!/bin/bash

# Build manifest and bundle
hyle push --dry-run > manifest.yaml
tar czf blueprint.tar.gz \
  hyle.yaml \
  docs/ \
  src/ \
  schema/

# Login to get access token (if not already logged in)
hyle login --registry https://registry.hylé.com

# Get access token from stored auth
TOKEN=$(jq -r '.access_token' ~/.hyle/auth.json)

# Publish via API
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "manifest=@manifest.yaml" \
  -F "bundle=@blueprint.tar.gz" \
  -F "version=1.2.0" \
  -F "stable=true" \
  "https://registry.hylé.com/blueprints/myauthor/myblueprint"
```

### Search and Pull

Using the CLI (recommended):

```bash
# Search for blueprints
hyle search auth --tag oidc

# Pull blueprint (CLI handles auth automatically)
hyle pull author/name@1.0.0
```

Using the API directly:

```bash
#!/bin/bash

# Login to get access token
hyle login

# Get access token from stored auth
TOKEN=$(jq -r '.access_token' ~/.hyle/auth.json)

# Search for blueprints
curl -H "Authorization: Bearer $TOKEN" \
  "https://registry.hylé.com/search?q=auth&tag=oidc"

# Get metadata
curl -H "Authorization: Bearer $TOKEN" \
  "https://registry.hylé.com/blueprints/author/name/1.0.0"

# Download bundle
curl -H "Authorization: Bearer $TOKEN" \
  "https://registry.hylé.com/blueprints/author/name/1.0.0/bundle" \
  -o blueprint.tar.gz
```
