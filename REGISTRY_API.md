# Registry API Documentation

Complete reference for the Hylé Registry backend API (AWS Lambda + S3 + PostgreSQL).

## Base URL

- **Production**: `https://api.hyle.dev`
- **Development**: `http://localhost:3001/api` (mock server)

## Authentication

API keys are passed via the `Authorization` header:

```
Authorization: Bearer <api-key>
```

API keys are obtained by:
1. Registering on the Hylé website
2. Generating a key in your account settings
3. Never commit keys to version control (use environment variables)

## Core Endpoints

### Search Substrates

**Endpoint**: `GET /search`

**Query Parameters**:
- `q` (string, required): Search query (name, author, tags, description)
- `limit` (integer, optional, default: 20): Max results to return
- `offset` (integer, optional, default: 0): Pagination offset
- `tag` (string, optional): Filter by tag
- `author` (string, optional): Filter by author

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/search?q=auth&limit=10"
```

**Response** (200 OK):

```json
{
  "results": [
    {
      "name": "auth-middleware",
      "author": "kittender",
      "version": "1.2.0",
      "description": "OpenID Connect middleware substrate",
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

### Get Substrate Metadata

**Endpoint**: `GET /substrates/:author/:name/:version`

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/substrates/kittender/auth-middleware/1.2.0"
```

**Response** (200 OK):

```json
{
  "name": "auth-middleware",
  "author": "kittender",
  "version": "1.2.0",
  "description": "OpenID Connect middleware substrate",
  "homepage": "https://github.com/kittender/auth-middleware",
  "tags": ["auth", "oidc"],
  "models": {
    "primary": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "fallback": [
        {
          "provider": "openai",
          "model": "gpt-4o"
        }
      ]
    }
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

### Fetch Substrate Bundle

**Endpoint**: `GET /substrates/:author/:name/:version/bundle`

Downloads the complete substrate as a `.tar.gz` file.

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/substrates/kittender/auth-middleware/1.2.0/bundle" \
  -o substrate.tar.gz

# Verify checksum
sha256sum -c <<< "xyz789... substrate.tar.gz"
```

**Response** (200 OK):
- Content-Type: `application/gzip`
- Content-Length: bundle size in bytes
- Content-Disposition: `attachment; filename="auth-middleware-1.2.0.tar.gz"`

### Publish/Update Substrate

**Endpoint**: `POST /substrates/:author/:name`

**Headers**:
- `Authorization: Bearer <api-key>`
- `Content-Type: multipart/form-data`

**Body Parameters**:
- `manifest` (file, required): `hyle.yaml` manifest file
- `bundle` (file, required): `.tar.gz` bundle containing all referenced files
- `version` (string, required): Semantic version (x.y.z or x.y.z-snapshot)
- `stable` (boolean, optional, default: false): Mark as stable release

**Example**:

```bash
curl -X POST \
  -H "Authorization: Bearer $HYLE_API_KEY" \
  -F "manifest=@hyle.yaml" \
  -F "bundle=@substrate.tar.gz" \
  -F "version=1.2.0" \
  -F "stable=true" \
  "https://api.hyle.dev/substrates/kittender/auth-middleware"
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

**Endpoint**: `GET /substrates/:author/:name/:version/deps`

Returns dependency resolution hints (available versions, latest stable, etc.).

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/substrates/kittender/auth-middleware/1.2.0/deps"
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

**Endpoint**: `GET /substrates/:author/:name/versions`

List all published versions of a substrate.

**Query Parameters**:
- `stable_only` (boolean, optional, default: false): Return only stable versions

**Example**:

```bash
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/substrates/kittender/auth-middleware/versions?stable_only=true"
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
| `not_found` | 404 | Substrate or version does not exist |
| `unauthorized` | 401 | Invalid or missing API key |
| `forbidden` | 403 | Permission denied (not author of substrate) |
| `validation_failed` | 422 | Manifest or bundle validation failed |
| `version_conflict` | 409 | Version already published |
| `payload_too_large` | 413 | Bundle exceeds size limit (50MB) |
| `rate_limited` | 429 | Too many requests (10 req/min per key) |
| `internal_error` | 500 | Server error (retry with exponential backoff) |

## Rate Limiting

All endpoints are rate-limited to **10 requests per minute** per API key.

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
curl -s "https://api.hyle.dev/substrates/author/name/1.0.0" | \
  jq '.bundle_sha256' | \
  sha256sum -c -
```

## HTTPS & Security

- **All endpoints** require HTTPS (automatic upgrade from HTTP)
- **Localhost** (`127.0.0.1`, `[::1]`) allowed only with `HYLE_ALLOW_INSECURE=1`
- **API keys** never logged or cached in plaintext
- **CORS** restricted to `https://*.hyle.dev` and configured registries

## Changelog

### API v1.0.0 (Current)

- Initial stable API
- Endpoints: search, fetch, publish, resolve, versions
- Rate limiting: 10 req/min per key
- Bundle size limit: 50MB

## Examples

### Publish a Substrate

```bash
#!/bin/bash

# Build manifest and bundle
hyle push --dry-run > manifest.yaml
tar czf substrate.tar.gz \
  hyle.yaml \
  docs/ \
  src/ \
  schema/

# Get API key (set environment variable)
export HYLE_API_KEY="sk_live_..."

# Publish
curl -X POST \
  -H "Authorization: Bearer $HYLE_API_KEY" \
  -F "manifest=@manifest.yaml" \
  -F "bundle=@substrate.tar.gz" \
  -F "version=1.2.0" \
  -F "stable=true" \
  "https://api.hyle.dev/substrates/myauthor/mysubstrate"
```

### Search and Pull

```bash
#!/bin/bash

# Search for substrates
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/search?q=auth&tag=oidc"

# Get metadata
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/substrates/author/name/1.0.0"

# Download bundle
curl -H "Authorization: Bearer $HYLE_API_KEY" \
  "https://api.hyle.dev/substrates/author/name/1.0.0/bundle" \
  -o substrate.tar.gz
```

## Related Documentation

- [MANIFEST_EXAMPLES.md](MANIFEST_EXAMPLES.md) — Example `hyle.yaml` manifests
- [CONFIG_REFERENCE.md](CONFIG_REFERENCE.md) — Configuration reference
- [SECURITY.md](SECURITY.md) — Security best practices
- [CONTRIBUTING.md](CONTRIBUTING.md) — Development guidelines
