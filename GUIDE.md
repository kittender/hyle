# Hylé — AWS Deployment & Global CLI Distribution Guide

> **Who this is for:** You have an AWS free-tier account and have never deployed anything to AWS.
> This guide walks you from zero to a live website + globally installable CLI.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Cost Tiers at a Glance](#2-cost-tiers-at-a-glance)
3. [Prerequisites](#3-prerequisites)
4. [Part A — Deploy the Website (Angular SPA)](#part-a--deploy-the-website-angular-spa)
   - [A1. Build the Angular app](#a1-build-the-angular-app)
   - [A2. Create an S3 bucket](#a2-create-an-s3-bucket)
   - [A3. Upload the build](#a3-upload-the-build)
   - [A4. Enable static website hosting](#a4-enable-static-website-hosting)
   - [A5. Add CloudFront CDN](#a5-add-cloudfront-cdn)
   - [A6. Custom domain with Route 53](#a6-custom-domain-with-route-53)
   - [A7. Free HTTPS certificate (ACM)](#a7-free-https-certificate-acm)
5. [Part B — Host CLI Binaries on AWS](#part-b--host-cli-binaries-on-aws)
   - [B1. Build all platform binaries](#b1-build-all-platform-binaries)
   - [B2. Upload binaries to S3](#b2-upload-binaries-to-s3)
   - [B3. Write the install script](#b3-write-the-install-script)
6. [Part C — Substrate Registry Backend (required)](#part-c--substrate-registry-backend-required)
7. [Part D — CI/CD with GitHub Actions](#part-d--cicd-with-github-actions)
8. [Part E — Distribute the CLI Globally](#part-e--distribute-the-cli-globally)
   - [E1. Homebrew (macOS / Linux)](#e1-homebrew-macos--linux)
   - [E2. Chocolatey (Windows)](#e2-chocolatey-windows)
   - [E3. Scoop (Windows)](#e3-scoop-windows)
   - [E4. WinGet (Windows)](#e4-winget-windows)
   - [E5. APT / DEB (Ubuntu / Debian)](#e5-apt--deb-ubuntu--debian)
   - [E6. RPM / YUM (Fedora / RHEL / Amazon Linux)](#e6-rpm--yum-fedora--rhel--amazon-linux)
   - [E7. Snap (Ubuntu universal)](#e7-snap-ubuntu-universal)
   - [E8. Raw install script (universal fallback)](#e8-raw-install-script-universal-fallback)
9. [Appendix — AWS Glossary for Beginners](#appendix--aws-glossary-for-beginners)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                 https://hyle.dev (or *.cloudfront.net)          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   CloudFront    │  CDN — caches & serves globally
                    │   (AWS CDN)     │  Free SSL certificate via ACM
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   S3 Bucket     │  Stores built Angular files
                    │  (static files) │  (HTML, JS, CSS, assets)
                    └─────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                    SUBSTRATE REGISTRY (required)                  │
│                                                                  │
│   hyle push/pull  →  API Gateway (api.hyle.dev)                  │
│                            │                                     │
│                     Lambda (auth + routing)                       │
│                      ├──► S3 (substrate files)                   │
│                      └──► DynamoDB (metadata + versions)         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       CLI DISTRIBUTION                           │
│                                                                  │
│   GitHub Release ──► S3 Bucket (binaries)                        │
│         │                                                        │
│         ├──► Homebrew tap (macOS/Linux)                          │
│         ├──► Chocolatey package (Windows)                        │
│         ├──► Scoop bucket (Windows)                              │
│         ├──► WinGet manifest (Windows)                           │
│         ├──► .deb package (Ubuntu/Debian)                        │
│         ├──► .rpm package (Fedora/RHEL)                          │
│         ├──► Snap (Ubuntu universal)                             │
│         └──► curl install.sh (universal fallback)               │
└──────────────────────────────────────────────────────────────────┘
```

**Why this stack?**
- S3 + CloudFront is the industry standard for static sites — effectively free at small scale.
- No servers to manage, no OS patches, auto-scaling built-in.
- Binary-first CLI means no runtime (Node, Python, etc.) needed on user machines.

---

## 2. Cost Tiers at a Glance

> All prices in USD/month. Free Tier benefits apply for the first 12 months after account creation.

| Tier | Monthly cost | S3 | CloudFront | Route 53 | Backend API | Best for |
|------|-------------|-----|-----------|----------|-------------|----------|
| **Free** | ~$0 | ✅ 5 GB storage, 20K PUT, 20K GET | ✅ 1 TB transfer, 10M requests | ❌ no custom domain | ✅ Lambda + API GW free tier (1M req/mo) + DynamoDB 25 GB free | Testing, personal use |
| **Starter** | ~$1–3 | ✅ same + ~$0.02/GB extra | ✅ same | ✅ $0.50/hosted zone + ~$12/yr domain | ✅ same free tier (sufficient under ~50 users) | Early launch, small traffic |
| **Growth** | ~$10–30 | ✅ ~$0.023/GB/month | ~$0.008–0.02/GB | ✅ included | ✅ Lambda + API GW ~$3.50/1M req + DynamoDB on-demand | Active product, public users |
| **Scale** | ~$50–150 | ✅ | ✅ + WAF $5/mo | ✅ | ✅ Lambda + DynamoDB provisioned or RDS Serverless v2 | Thousands of daily users |
| **Enterprise** | $150+ | Multi-region replication | Custom price point | ✅ Advanced routing | ECS Fargate or EKS + RDS Multi-AZ | Commercial product |

> **The registry (Part C) is required at every tier.** GitHub is not used as a registry backend — only for source control and CI/CD.

**What you actually pay after free tier ends:**
- S3 storage: $0.023/GB/month (substrate files are tiny — fractions of a cent at small scale)
- CloudFront: $0.0085–$0.02/GB egress (~$0.85 per 100 GB)
- Route 53: $0.50/month per hosted zone + domain registration cost
- Lambda (registry API): first 1 million requests/month free forever (not just 12 months)
- DynamoDB: 25 GB storage + 25 WCU/RCU free forever

**Recommendation for launch:** Use the **Starter** tier. Total cost stays under $3/month for a real custom domain, HTTPS, global CDN, and a fully functional registry backend.

---

## 3. Prerequisites

### Accounts you need

| What | Where | Cost |
|------|-------|------|
| AWS account | [aws.amazon.com](https://aws.amazon.com) | Free (credit card required for identity verification) |
| GitHub account | [github.com](https://github.com) | Free |
| Domain name | Route 53, Namecheap, or Cloudflare | ~$10–15/year |

### Tools to install on your machine

```bash
# 1. AWS CLI — talks to AWS from your terminal
# macOS
brew install awscli

# Ubuntu / Debian
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o aws.zip
unzip aws.zip && sudo ./aws/install

# Windows (PowerShell as Administrator)
winget install Amazon.AWSCLI

# Verify
aws --version   # should print: aws-cli/2.x.x ...

# 2. Bun — to build the CLI
curl -fsSL https://bun.sh/install | bash

# 3. Node / npm — to build the Angular website
# Download from https://nodejs.org (LTS version)
node --version  # should print v20.x.x or higher
```

### Configure AWS CLI with your credentials

1. Log in to [console.aws.amazon.com](https://console.aws.amazon.com)
2. Click your name (top right) → **Security credentials**
3. Scroll to **Access keys** → **Create access key**
4. Choose **CLI** → download the CSV file (keep it safe — you cannot retrieve it again)
5. In your terminal:

```bash
aws configure
# AWS Access Key ID:     <paste from CSV>
# AWS Secret Access Key: <paste from CSV>
# Default region name:   us-east-1
# Default output format: json
```

> **Why us-east-1?** CloudFront SSL certificates must be created in `us-east-1` regardless of where your users are. Start there for simplicity.

---

## Part A — Deploy the Website (Angular SPA)

### A1. Build the Angular app

```bash
cd web

# Install dependencies (first time only)
npm install

# Production build — outputs to web/dist/hyle-registry/browser/
npm run build
```

After the build, verify the output exists:

```bash
ls dist/hyle-registry/browser/
# Should show: index.html, main-XXXX.js, styles-XXXX.css, assets/, ...
```

### A2. Create an S3 bucket

> An **S3 bucket** is like a cloud hard drive folder. Files stored there can optionally be served publicly as a website.

```bash
# Replace "hyle-web-prod" with a globally unique name (no spaces, no uppercase)
aws s3api create-bucket \
  --bucket hyle-web-prod \
  --region us-east-1

# Allow public read (needed for static website hosting)
aws s3api delete-public-access-block \
  --bucket hyle-web-prod

aws s3api put-bucket-policy \
  --bucket hyle-web-prod \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hyle-web-prod/*"
    }]
  }'
```

### A3. Upload the build

```bash
# Sync the built files to S3
# --delete removes files from S3 that no longer exist locally
aws s3 sync web/dist/hyle-registry/browser/ s3://hyle-web-prod/ \
  --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html"

# Upload index.html separately with no cache (so new deploys are instant)
aws s3 cp web/dist/hyle-registry/browser/index.html s3://hyle-web-prod/index.html \
  --cache-control "no-cache,no-store,must-revalidate" \
  --content-type "text/html"
```

> **Why two separate upload commands?** Hashed JS/CSS files (e.g. `main.abc123.js`) never change their content — cache them forever. `index.html` is the entry point and must always be fresh so users get the latest app version.

### A4. Enable static website hosting

```bash
aws s3api put-bucket-website \
  --bucket hyle-web-prod \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'
```

> **Why `index.html` as error document?** Angular is a Single Page Application. All routes (e.g. `/search`, `/profile/123`) are handled by the JavaScript router, not by real files on the server. When S3 can't find `/profile/123`, it falls back to `index.html` and Angular takes over.

Your site is now reachable at:
`http://hyle-web-prod.s3-website-us-east-1.amazonaws.com`

(HTTP only, no custom domain yet — next steps fix that.)

### A5. Add CloudFront CDN

> **CloudFront** is AWS's global CDN. It has ~600 edge locations worldwide — your files are copied to the one closest to each visitor, making the site fast everywhere.

```bash
# Create a CloudFront distribution
# Save the full output — you need the "Id" and "DomainName" values
aws cloudfront create-distribution --distribution-config '{
  "CallerReference": "hyle-web-'$(date +%s)'",
  "Comment": "Hyle web platform",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-hyle-web-prod",
      "DomainName": "hyle-web-prod.s3-website-us-east-1.amazonaws.com",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-hyle-web-prod",
    "ViewerProtocolPolicy": "redirect-to-https",
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true,
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 403,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 0
    }]
  },
  "Enabled": true,
  "HttpVersion": "http2and3",
  "PriceClass": "PriceClass_100"
}'
```

> **PriceClass_100** covers North America + Europe. Use `PriceClass_All` for global coverage (slightly higher cost).

CloudFront takes 5–15 minutes to deploy globally. Your site will then be at:
`https://XXXXXXXXXXXX.cloudfront.net`

### A6. Custom domain with Route 53

> Skip this step if you don't have a domain yet. Your `*.cloudfront.net` URL works fine for early testing.

```bash
# Register a domain (or skip if you already have one elsewhere)
aws route53domains register-domain \
  --domain-name hyle.dev \
  --duration-in-years 1 \
  --admin-contact file://contact.json \
  --registrant-contact file://contact.json \
  --tech-contact file://contact.json \
  --auto-renew

# Create a hosted zone for DNS records
aws route53 create-hosted-zone \
  --name hyle.dev \
  --caller-reference "hyle-$(date +%s)"
# Note the "Id" in the output: /hostedzone/XXXXXXXXXX
```

If your domain is registered **outside AWS** (Namecheap, Cloudflare, etc.), copy the 4 nameservers from the hosted zone output and paste them into your registrar's DNS settings.

### A7. Free HTTPS certificate (ACM)

> **Must be done in us-east-1** even if your users are elsewhere.

```bash
# Request a certificate — MUST be us-east-1 for CloudFront
aws acm request-certificate \
  --domain-name hyle.dev \
  --subject-alternative-names "*.hyle.dev" \
  --validation-method DNS \
  --region us-east-1
# Note the "CertificateArn" in the output

# Get the DNS validation record to add to Route 53
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions'
```

Add the CNAME record shown in the output to Route 53. ACM auto-validates within minutes and the certificate auto-renews every year.

Then update your CloudFront distribution in the AWS console:
1. Go to **CloudFront** → your distribution → **Edit**
2. **Alternate domain names (CNAMEs):** add `hyle.dev` and `www.hyle.dev`
3. **Custom SSL certificate:** select the ACM certificate you just created
4. Save and wait ~5 minutes for deploy

Add a Route 53 A record pointing `hyle.dev` to your CloudFront domain:

```bash
aws route53 change-resource-record-sets \
  --hosted-zone-id XXXXXXXXXX \
  --change-batch '{
    "Changes": [{
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "hyle.dev",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "XXXXXXXXXXXX.cloudfront.net",
          "EvaluateTargetHealth": false
        }
      }
    }]
  }'
```

> `Z2FDTNDATAQYW2` is CloudFront's fixed hosted zone ID — always the same for everyone.

Your site is now live at `https://hyle.dev` with HTTPS and a global CDN.

---

## Part B — Host CLI Binaries on AWS

The CLI compiles to self-contained executables — no runtime needed. Users download one file and run it.

### B1. Build all platform binaries

```bash
cd cli

# Build for all 5 targets (requires Bun installed)
bun run build:all

# Verify outputs
ls -lh dist/
# hyle-linux-x64       (~10–15 MB)
# hyle-linux-arm64
# hyle-macos-x64
# hyle-macos-arm64
# hyle-windows-x64.exe
```

### B2. Upload binaries to S3

Use a separate S3 bucket for releases. Versioned paths let users pin to a specific version.

```bash
# Create bucket for releases
aws s3api create-bucket --bucket hyle-releases --region us-east-1
aws s3api delete-public-access-block --bucket hyle-releases
aws s3api put-bucket-policy \
  --bucket hyle-releases \
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hyle-releases/*"
    }]
  }'

# Upload versioned release (replace 0.1.0 with actual version)
VERSION="0.1.0"
aws s3 cp cli/dist/ s3://hyle-releases/releases/v${VERSION}/ \
  --recursive \
  --acl public-read

# Also upload as "latest" (overwritten on each release)
aws s3 cp cli/dist/ s3://hyle-releases/releases/latest/ \
  --recursive \
  --acl public-read
```

Binary URLs will be:
```
https://hyle-releases.s3.amazonaws.com/releases/latest/hyle-linux-x64
https://hyle-releases.s3.amazonaws.com/releases/latest/hyle-macos-arm64
https://hyle-releases.s3.amazonaws.com/releases/latest/hyle-windows-x64.exe
```

Or via CloudFront for speed: create a second CloudFront distribution pointing to `hyle-releases` and use `https://releases.hyle.dev/releases/latest/hyle-linux-x64`.

### B3. Write the install script

Create `install.sh` — the universal "one-liner" installer:

```bash
cat > install.sh << 'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

VERSION="${HYLE_VERSION:-latest}"
INSTALL_DIR="${HYLE_INSTALL_DIR:-/usr/local/bin}"
BASE_URL="https://hyle-releases.s3.amazonaws.com/releases/${VERSION}"

detect_platform() {
  OS=$(uname -s | tr '[:upper:]' '[:lower:]')
  ARCH=$(uname -m)

  case "${OS}" in
    linux)
      case "${ARCH}" in
        x86_64)  echo "hyle-linux-x64" ;;
        aarch64) echo "hyle-linux-arm64" ;;
        *)       echo "Unsupported architecture: ${ARCH}" >&2; exit 1 ;;
      esac
      ;;
    darwin)
      case "${ARCH}" in
        x86_64)  echo "hyle-macos-x64" ;;
        arm64)   echo "hyle-macos-arm64" ;;
        *)       echo "Unsupported architecture: ${ARCH}" >&2; exit 1 ;;
      esac
      ;;
    *)
      echo "Unsupported OS: ${OS}" >&2
      echo "For Windows, visit: https://hyle.dev/install" >&2
      exit 1
      ;;
  esac
}

BINARY=$(detect_platform)
URL="${BASE_URL}/${BINARY}"

echo "Installing hylé ${VERSION} (${BINARY})..."
curl -fsSL "${URL}" -o /tmp/hyle
chmod +x /tmp/hyle

if [ -w "${INSTALL_DIR}" ]; then
  mv /tmp/hyle "${INSTALL_DIR}/hyle"
else
  sudo mv /tmp/hyle "${INSTALL_DIR}/hyle"
fi

echo "hylé installed to ${INSTALL_DIR}/hyle"
echo "Run: hyle --version"
SCRIPT

# Upload install.sh to S3
aws s3 cp install.sh s3://hyle-releases/install.sh \
  --content-type "text/plain" \
  --cache-control "no-cache"
```

Users can then install with:
```bash
curl -fsSL https://hyle-releases.s3.amazonaws.com/install.sh | bash
```

---

## Part C — Substrate Registry Backend (required)

The registry is the core of Hylé — it stores, versions, and serves substrates. GitHub is not used as a registry; deploy this on AWS from day one.

Use **API Gateway + Lambda + S3 + DynamoDB**:

```
hyle push  →  POST /substrates  →  API Gateway  →  Lambda  →  S3 (files) + DynamoDB (metadata)
hyle pull  →  GET  /substrates/:name  →  API Gateway  →  Lambda  →  S3
```

**Estimated cost (1,000 users, moderate usage):**
- Lambda: ~$0 (under 1M free requests/month forever)
- API Gateway: ~$3.50/million requests
- DynamoDB: ~$0 (25 GB free forever)
- S3 storage: ~$0.023/GB

**Skeleton Lambda (Node/TypeScript, deploy via AWS SAM or CDK):**

```typescript
// lambda/registry/index.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, PutItemCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: any) => {
  const method = event.httpMethod;
  const path = event.path;

  if (method === "PUT" && path.startsWith("/substrates/")) {
    // hyle push — store substrate files in S3, metadata in DynamoDB
    // ... implementation
  }

  if (method === "GET" && path.startsWith("/substrates/")) {
    // hyle pull — fetch from S3
    // ... implementation
  }

  return { statusCode: 404, body: "Not found" };
};
```

---

## Part D — CI/CD with GitHub Actions

Automate building and deploying on every push to `main`.

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]
  release:
    types: [published]

env:
  AWS_REGION: us-east-1
  WEB_BUCKET: hyle-web-prod
  RELEASE_BUCKET: hyle-releases
  CLOUDFRONT_DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}

jobs:
  # ─── Job 1: Build and deploy the Angular website ─────────────────────────
  deploy-web:
    name: Deploy website
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: web

      - name: Build Angular app
        run: npm run build
        working-directory: web

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Upload to S3 (hashed assets — cache forever)
        run: |
          aws s3 sync web/dist/hyle-registry/browser/ s3://${{ env.WEB_BUCKET }}/ \
            --delete \
            --cache-control "max-age=31536000,immutable" \
            --exclude "index.html"

      - name: Upload index.html (no cache)
        run: |
          aws s3 cp web/dist/hyle-registry/browser/index.html \
            s3://${{ env.WEB_BUCKET }}/index.html \
            --cache-control "no-cache,no-store,must-revalidate" \
            --content-type "text/html"

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"

  # ─── Job 2: Build CLI binaries and publish release ───────────────────────
  release-cli:
    name: Build & release CLI
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install
        working-directory: cli

      - name: Build all platform binaries
        run: bun run build:all
        working-directory: cli

      - name: Generate checksums
        working-directory: cli/dist
        run: sha256sum hyle-* > SHA256SUMS.txt

      - name: Upload binaries to GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            cli/dist/hyle-linux-x64
            cli/dist/hyle-linux-arm64
            cli/dist/hyle-macos-x64
            cli/dist/hyle-macos-arm64
            cli/dist/hyle-windows-x64.exe
            cli/dist/SHA256SUMS.txt

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Upload to S3 (versioned + latest)
        run: |
          VERSION="${{ github.event.release.tag_name }}"
          aws s3 cp cli/dist/ s3://${{ env.RELEASE_BUCKET }}/releases/${VERSION}/ --recursive
          aws s3 cp cli/dist/ s3://${{ env.RELEASE_BUCKET }}/releases/latest/ --recursive

      - name: Update Homebrew formula
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
          script: |
            // Trigger formula update in homebrew-hyle repo
            await github.rest.repos.createDispatchEvent({
              owner: 'kittender',
              repo: 'homebrew-hyle',
              event_type: 'new-release',
              client_payload: { version: '${{ github.event.release.tag_name }}' }
            });
```

### Add secrets to GitHub

In your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | From IAM user (create a dedicated one, not your root account) |
| `AWS_SECRET_ACCESS_KEY` | From IAM user |
| `CLOUDFRONT_DISTRIBUTION_ID` | From CloudFront console (e.g. `E1ABCDEFGHIJK`) |
| `REGISTRY_LAMBDA_FUNCTION_NAME` | Name of your registry Lambda (e.g. `hyle-registry-handler`) |
| `HOMEBREW_TAP_TOKEN` | GitHub PAT with `repo` scope on `homebrew-hyle` |

### Create a least-privilege IAM user for CI

Never use your root account credentials in CI. Create a scoped IAM user:

```bash
# Create CI user
aws iam create-user --user-name hyle-ci

# Attach a minimal policy (save as ci-policy.json first)
cat > ci-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::hyle-web-prod",
        "arn:aws:s3:::hyle-web-prod/*",
        "arn:aws:s3:::hyle-releases",
        "arn:aws:s3:::hyle-releases/*",
        "arn:aws:s3:::hyle-registry-store",
        "arn:aws:s3:::hyle-registry-store/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:UpdateFunctionCode", "lambda:PublishVersion", "lambda:UpdateAlias"],
      "Resource": "arn:aws:lambda:us-east-1:*:function:hyle-registry-*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name hyle-ci \
  --policy-name hyle-ci-policy \
  --policy-document file://ci-policy.json

# Generate access key for CI
aws iam create-access-key --user-name hyle-ci
# Copy the output AccessKeyId and SecretAccessKey into GitHub secrets
```

---

## Part E — Distribute the CLI Globally

### E1. Homebrew (macOS / Linux)

Homebrew is the most common package manager on macOS and increasingly popular on Linux.

**Step 1: Create a tap repository**

Create a new GitHub repo named `homebrew-hyle` under your org (`kittender/homebrew-hyle`).

> Homebrew taps must follow the naming convention `homebrew-<name>`.

**Step 2: Write the formula**

Create `Formula/hyle.rb` in that repo:

```ruby
# Formula/hyle.rb
class Hyle < Formula
  desc "AI context substrate manager"
  homepage "https://hyle.dev"
  version "0.1.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://hyle-releases.s3.amazonaws.com/releases/v#{version}/hyle-macos-arm64"
      sha256 "REPLACE_WITH_SHA256_FROM_SHA256SUMS_TXT"
    end
    on_intel do
      url "https://hyle-releases.s3.amazonaws.com/releases/v#{version}/hyle-macos-x64"
      sha256 "REPLACE_WITH_SHA256_FROM_SHA256SUMS_TXT"
    end
  end

  on_linux do
    on_arm do
      url "https://hyle-releases.s3.amazonaws.com/releases/v#{version}/hyle-linux-arm64"
      sha256 "REPLACE_WITH_SHA256_FROM_SHA256SUMS_TXT"
    end
    on_intel do
      url "https://hyle-releases.s3.amazonaws.com/releases/v#{version}/hyle-linux-x64"
      sha256 "REPLACE_WITH_SHA256_FROM_SHA256SUMS_TXT"
    end
  end

  def install
    binary = if OS.mac?
      Hardware::CPU.arm? ? "hyle-macos-arm64" : "hyle-macos-x64"
    else
      Hardware::CPU.arm? ? "hyle-linux-arm64" : "hyle-linux-x64"
    end
    bin.install binary => "hyle"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/hyle --version")
  end
end
```

**Step 3: Automate formula updates on release**

Add `.github/workflows/update-formula.yml` to `homebrew-hyle`:

```yaml
name: Update formula

on:
  repository_dispatch:
    types: [new-release]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download checksums
        run: |
          VERSION="${{ github.event.client_payload.version }}"
          curl -fsSL "https://hyle-releases.s3.amazonaws.com/releases/${VERSION}/SHA256SUMS.txt" \
            -o SHA256SUMS.txt

      - name: Update formula version and checksums
        run: |
          VERSION="${{ github.event.client_payload.version }}"
          # Strip leading 'v' if present
          VERSION="${VERSION#v}"
          sed -i "s/version \".*\"/version \"${VERSION}\"/" Formula/hyle.rb
          # Update each sha256 — script reads from SHA256SUMS.txt
          while IFS= read -r line; do
            SHA=$(echo "$line" | awk '{print $1}')
            FILE=$(echo "$line" | awk '{print $2}' | sed 's|.*/||')
            sed -i "s|sha256 \".*\" # ${FILE}|sha256 \"${SHA}\" # ${FILE}|g" Formula/hyle.rb
          done < SHA256SUMS.txt

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add Formula/hyle.rb
          git commit -m "chore: bump to ${{ github.event.client_payload.version }}"
          git push
```

**Users install with:**
```bash
brew tap kittender/hyle
brew install hyle
```

Or once submitted to homebrew-core (requires popularity threshold):
```bash
brew install hyle
```

---

### E2. Chocolatey (Windows)

Chocolatey is the most popular package manager for Windows.

**Step 1: Create the package structure**

```
choco/
├── hyle.nuspec
└── tools/
    ├── chocolateyInstall.ps1
    └── chocolateyUninstall.ps1
```

**`hyle.nuspec`:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://schemas.microsoft.com/packaging/2015/06/nuspec.xsd">
  <metadata>
    <id>hyle</id>
    <version>0.1.0</version>
    <title>Hylé</title>
    <authors>Kittender</authors>
    <projectUrl>https://hyle.dev</projectUrl>
    <licenseUrl>https://github.com/kittender/hyle/blob/main/LICENSE</licenseUrl>
    <requireLicenseAcceptance>false</requireLicenseAcceptance>
    <description>AI context substrate manager — package, share, and install versioned AI agent workflows.</description>
    <tags>ai cli developer-tools substrate</tags>
  </metadata>
</package>
```

**`tools/chocolateyInstall.ps1`:**
```powershell
$ErrorActionPreference = 'Stop'

$packageArgs = @{
  packageName   = $env:ChocolateyPackageName
  fileType      = 'exe'
  url64bit      = 'https://hyle-releases.s3.amazonaws.com/releases/latest/hyle-windows-x64.exe'
  checksum64    = 'REPLACE_WITH_SHA256'
  checksumType64= 'sha256'
  validExitCodes= @(0)
  silentArgs    = ''
  destination   = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
}

Get-ChocolateyWebFile @packageArgs -OutFile "$($packageArgs.destination)\hyle.exe"
Install-ChocolateyPath "$($packageArgs.destination)"
```

**`tools/chocolateyUninstall.ps1`:**
```powershell
$installDir = "$(Split-Path -parent $MyInvocation.MyCommand.Definition)"
Remove-Item "$installDir\hyle.exe" -Force -ErrorAction SilentlyContinue
Uninstall-ChocolateyPath "$installDir"
```

**Step 2: Pack and publish**

```powershell
# Install Chocolatey CLI on Windows
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = 3072
Invoke-Expression ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Pack and push
cd choco
choco pack
choco push hyle.0.1.0.nupkg --source https://push.chocolatey.org --api-key YOUR_KEY
```

**Users install with:**
```powershell
choco install hyle
```

---

### E3. Scoop (Windows)

Scoop is a popular Windows package manager favored by developers.

Create a GitHub repo `scoop-hyle` with a JSON manifest:

**`bucket/hyle.json`:**
```json
{
  "version": "0.1.0",
  "description": "AI context substrate manager",
  "homepage": "https://hyle.dev",
  "license": "MIT",
  "architecture": {
    "64bit": {
      "url": "https://hyle-releases.s3.amazonaws.com/releases/v0.1.0/hyle-windows-x64.exe",
      "hash": "REPLACE_WITH_SHA256",
      "bin": [["hyle-windows-x64.exe", "hyle"]]
    }
  },
  "checkver": {
    "github": "https://github.com/kittender/hyle"
  },
  "autoupdate": {
    "architecture": {
      "64bit": {
        "url": "https://hyle-releases.s3.amazonaws.com/releases/v$version/hyle-windows-x64.exe"
      }
    }
  }
}
```

**Users install with:**
```powershell
scoop bucket add kittender https://github.com/kittender/scoop-hyle
scoop install hyle
```

---

### E4. WinGet (Windows)

WinGet is Microsoft's official package manager (built into Windows 11, available for Windows 10).

Create a PR to the [winget-pkgs](https://github.com/microsoft/winget-pkgs) repository with these three files:

**`manifests/k/Kittender/Hyle/0.1.0/Kittender.Hyle.installer.yaml`:**
```yaml
PackageIdentifier: Kittender.Hyle
PackageVersion: 0.1.0
MinimumOSVersion: 10.0.0.0
InstallerType: portable
InstallModes:
  - interactive
  - silent
Installers:
  - Architecture: x64
    InstallerUrl: https://hyle-releases.s3.amazonaws.com/releases/v0.1.0/hyle-windows-x64.exe
    InstallerSha256: REPLACE_WITH_SHA256
    PortableCommandAlias: hyle
ManifestType: installer
ManifestVersion: 1.6.0
```

**`manifests/k/Kittender/Hyle/0.1.0/Kittender.Hyle.locale.en-US.yaml`:**
```yaml
PackageIdentifier: Kittender.Hyle
PackageVersion: 0.1.0
PackageLocale: en-US
Publisher: Kittender
PackageName: Hylé
License: MIT
ShortDescription: AI context substrate manager
Description: Package, share, and install versioned snapshots of AI agent workflows.
PackageUrl: https://hyle.dev
ManifestType: defaultLocale
ManifestVersion: 1.6.0
```

**`manifests/k/Kittender/Hyle/0.1.0/Kittender.Hyle.yaml`:**
```yaml
PackageIdentifier: Kittender.Hyle
PackageVersion: 0.1.0
DefaultLocale: en-US
ManifestType: version
ManifestVersion: 1.6.0
```

**Users install with:**
```powershell
winget install Kittender.Hyle
```

> WinGet review takes 1–7 days. Use the [winget-create](https://github.com/microsoft/wingetcreate) CLI to validate your manifest before submitting.

---

### E5. APT / DEB (Ubuntu / Debian)

Package as a `.deb` for apt-based distributions using [nfpm](https://nfpm.goreleaser.com/).

**Install nfpm:**
```bash
brew install goreleaser/tap/nfpm   # macOS
# or
go install github.com/goreleaser/nfpm/v2/cmd/nfpm@latest
```

**`cli/nfpm.yaml`:**
```yaml
name: hyle
arch: amd64           # build a separate one for arm64
platform: linux
version: "0.1.0"
maintainer: Kittender <hello@hyle.dev>
description: AI context substrate manager
homepage: https://hyle.dev
license: MIT

contents:
  - src: dist/hyle-linux-x64
    dst: /usr/local/bin/hyle
    file_info:
      mode: 0755

  - src: ../README.md
    dst: /usr/share/doc/hyle/README.md

scripts:
  postinstall: scripts/postinstall.sh
```

**Build the .deb:**
```bash
cd cli
nfpm package --packager deb --target dist/hyle_0.1.0_amd64.deb
nfpm package --packager deb --target dist/hyle_0.1.0_arm64.deb  # after building arm64 binary
```

**Host an apt repository on S3** (cheapest approach):

```bash
# Install aptly (apt repo manager)
brew install aptly   # or sudo apt install aptly

# Create and publish repo
aptly repo create hyle-stable
aptly repo add hyle-stable cli/dist/hyle_0.1.0_amd64.deb
aptly snapshot create hyle-v0.1.0 from repo hyle-stable
aptly publish snapshot -distribution=stable -architectures=amd64,arm64 hyle-v0.1.0

# Upload to S3
aws s3 sync ~/.aptly/public/ s3://hyle-releases/apt/ --acl public-read
```

**Users install with:**
```bash
# Add the repository once
curl -fsSL https://hyle-releases.s3.amazonaws.com/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/hyle.gpg
echo "deb [signed-by=/etc/apt/keyrings/hyle.gpg] https://hyle-releases.s3.amazonaws.com/apt stable main" \
  | sudo tee /etc/apt/sources.list.d/hyle.list

sudo apt update && sudo apt install hyle
```

---

### E6. RPM / YUM (Fedora / RHEL / Amazon Linux)

Build `.rpm` with nfpm:

```bash
nfpm package --packager rpm --target dist/hyle_0.1.0_x86_64.rpm
```

**`cli/nfpm.yaml` additions for RPM:**
```yaml
rpm:
  group: Applications/System
  compression: lzma
```

Host a YUM repo on S3:

```bash
# Install createrepo
sudo dnf install createrepo_c

# Create repo metadata
mkdir -p /tmp/hyle-rpm-repo
cp cli/dist/*.rpm /tmp/hyle-rpm-repo/
createrepo_c /tmp/hyle-rpm-repo/

# Upload to S3
aws s3 sync /tmp/hyle-rpm-repo/ s3://hyle-releases/rpm/ --acl public-read
```

**Users install with:**
```bash
sudo dnf config-manager --add-repo https://hyle-releases.s3.amazonaws.com/rpm/hyle.repo
sudo dnf install hyle
```

---

### E7. Snap (Ubuntu universal)

Snap packages run on any Linux distribution and auto-update.

**`cli/snap/snapcraft.yaml`:**
```yaml
name: hyle
version: "0.1.0"
summary: AI context substrate manager
description: |
  Package, share, and install versioned snapshots of AI agent workflows.
  Manages CLAUDE.md, agent identities, MCP configs, and ethics policies.
grade: stable
confinement: strict

architectures:
  - build-on: amd64
  - build-on: arm64

parts:
  hyle-binary:
    plugin: dump
    source: dist/
    organize:
      hyle-linux-amd64: usr/bin/hyle

apps:
  hyle:
    command: usr/bin/hyle
```

**Build and publish:**
```bash
# Install snapcraft
sudo snap install snapcraft --classic

# Build
snapcraft

# Log in to Snapcraft store (create account at snapcraft.io)
snapcraft login

# Register name (one-time)
snapcraft register hyle

# Upload and release
snapcraft upload --release=stable hyle_0.1.0_amd64.snap
```

**Users install with:**
```bash
sudo snap install hyle
```

---

### E8. Raw install script (universal fallback)

The `install.sh` created in Part B is the universal fallback for all platforms. Expose it at a clean URL:

```
curl -fsSL https://hyle.dev/install | bash
```

This requires adding a CloudFront behavior that proxies `/install` to the S3 install.sh file.

Add to your website docs:

```markdown
## Install Hylé

**macOS / Linux (recommended)**
```bash
brew tap kittender/hyle && brew install hyle
```

**macOS / Linux (curl)**
```bash
curl -fsSL https://hyle.dev/install | bash
```

**Windows (winget)**
```powershell
winget install Kittender.Hyle
```

**Windows (chocolatey)**
```powershell
choco install hyle
```

**Windows (scoop)**
```powershell
scoop bucket add kittender https://github.com/kittender/scoop-hyle && scoop install hyle
```

**Ubuntu / Debian (apt)**
```bash
sudo apt install hyle   # after adding the apt repo (see docs)
```

---

## Appendix — AWS Glossary for Beginners

| Term | Plain English |
|------|--------------|
| **S3** (Simple Storage Service) | Cloud hard drive. Store files, serve them publicly or privately. |
| **CloudFront** | CDN. Copies your S3 files to 600+ locations worldwide. Users get files from the nearest server. |
| **Route 53** | DNS service. Turns your domain name into an IP address. Also sells domain names. |
| **ACM** (Certificate Manager) | Issues free HTTPS certificates. Auto-renews. Works with CloudFront. |
| **IAM** (Identity & Access Management) | User accounts and permissions within AWS. Never use root account in CI. |
| **Lambda** | Run code without managing servers. You pay per execution, not per hour. |
| **API Gateway** | HTTP entry point that routes requests to Lambda functions. |
| **DynamoDB** | NoSQL database. Serverless, auto-scaling. 25 GB free forever. |
| **Region** | A geographic cluster of AWS data centers (e.g. `us-east-1` = N. Virginia). |
| **AZ** (Availability Zone) | A single data center within a region. Multiple AZs = high availability. |
| **Free Tier** | 12 months of free usage limits + some services free forever (Lambda, DynamoDB). |
| **ARN** | Amazon Resource Name. Unique ID for any AWS resource (format: `arn:aws:service:region:account:resource`). |

---

*Generated for Hylé v0.0.1 — update binary URLs, checksums, and version numbers on each release.*
