# Hylé Deployment Guide

Self-host the full Hylé stack (registry + web). The **same Docker images** run
locally and in any remote environment — only configuration changes between them.

> **Just want a registry running in 5 minutes?** Use the
> [Self-host quickstart](DEPLOYMENT_QUICK_START.md). This guide is the production
> reference: URL matrix, hosted-platform recipes, scaling, monitoring, incident response.

> **Never deploy mock data.** The `mock` compose profile and the `mock/` folder
> are a local-only demo aid (see
> [QUICKSTART](../quickstart.md#1b-populate-with-mock-data-optional)). Production
> runs `docker compose up` **without** `--profile mock`, so the `seed` service
> never starts.

## Start here: Docker Compose (any environment)

Local evaluation, on-prem, AWS/GCP/Azure — all the same two commands, different
`.env`:

```bash
# Local test — SQLite + auth=none, zero secrets:
docker compose up --build

# Staging / pre-prod / prod — real SSO + public URLs:
cp .env.example .env   # set URLs, provider, secrets
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

See [/quickstart.md](../quickstart.md) for the end-to-end walkthrough and
[CONFIG.md](../reference/CONFIG.md#self-hosting-environment-variables) for every
variable.

### Per-environment URL matrix

| Target     | `HYLE_REGISTRY_URL`              | `HYLE_WEB_URL`               | `HYLE_AUTH_PROVIDER` | DB |
|------------|----------------------------------|------------------------------|----------------------|----|
| Local test | `http://localhost:3000`          | `http://localhost:8080`      | `none`               | SQLite (volume) |
| Staging    | `https://registry.staging.acme`  | `https://hyle.staging.acme`  | `github` / `oauth2`  | SQLite (volume) |
| Prod       | `https://registry.acme.com`      | `https://hyle.acme.com`      | `github` / `oauth2`  | SQLite (volume) |

> Authentication is **opt-in** and pluggable. `github` = GitHub OAuth; `oauth2`
> = generic OAuth2/OIDC pointed at GitLab, Bitbucket, Keycloak, Okta, etc. via
> `HYLE_AUTH_*` URLs. Terminate TLS at a reverse proxy (Caddy/Traefik/nginx) in
> front of the registry and web containers.

> **Scaling note:** SQLite on a mounted volume is fine for evaluation, on-prem,
> and small teams. PostgreSQL and multi-node HA are not bundled yet — the
> database is behind an interface (`IDatabase`) so a Postgres adapter can be
> added without touching handlers. The tiers below describe target topologies
> for that future.

---

## Production tiers (hosted platforms & scale)

The compose flow above is the recommended path for most users. These tiers are
reference topologies for specific needs: managed-platform hosting (Tier 1),
single-VPS production (Tier 2), and high-scale HA (Tier 3). Pick by team size and
load — see the [decision tree](#quick-decision-tree).

---

## Tier 1: Simplest (Startup/Testing)

**Stack:** Bun + SQLite + Vercel/Railway/Render + GitHub OAuth

**Time to deploy:** 10 minutes  
**Cost:** Free-$20/month  
**Suitable for:** Teams <50, internal use, prototyping, GitHub-as-primary

### Architecture

```
GitHub OAuth ← Your App → Bun HTTP Server → SQLite (file on disk)
```

⚠️ **Data persistence:** Some platforms (Vercel) restart containers without persisting disk — data loss on redeploy. SQLite best for local testing only. Use **Tier 2 (PostgreSQL)** for durability.

### Setup

**1. Create GitHub OAuth app**

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Authorization callback URL: `https://your-registry.example.com/auth/callback`
4. Copy `CLIENT_ID` and `CLIENT_SECRET`

**2. Environment config**

Create `.env` (Vercel/Railway/Render dashboard):

```bash
# Server
PORT=3000
DB_PATH=/data/hyle-registry.db
BASE_URL=https://your-registry.example.com
JWT_SECRET=$(openssl rand -hex 32)

# OAuth
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>

# Email (optional, use Resend free tier)
RESEND_API_KEY=<your-resend-key>

# Limits
HYLE_RATE_LIMIT=10  # publishes/hour
MAX_BLUEPRINT_SIZE=100M
```

**3. Deploy**

### Option A: Vercel (Web UI only)

```bash
git push origin main
# Vercel auto-deploys on push
```

### Option B: Railway (Registry + Web)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Link .env
railway variables

# Deploy
railway up
```

### Option C: Render

```bash
# Create new Web Service
# Repository: your-fork of hyle
# Build command: bun install && bun run build
# Start command: bun run start
```

### Data backup

SQLite file lives in `/data/hyle-registry.db`. Daily backup script:

```bash
0 2 * * * docker exec hyle-registry cp /data/hyle-registry.db /backups/hyle-$(date +\%Y-\%m-\%d).db
```

Keep last 30 days locally; sync to cloud storage for durability.

---

## Tier 2: Intermediate (Teams/Production)

**Stack:** Bun + PostgreSQL + VPS (DigitalOcean/Linode/Hetzner) + SSL/TLS

**Time to deploy:** 1-2 hours  
**Cost:** $15-40/month  
**Suitable for:** Teams 50-500, production use, custom domain, HA not required

### Architecture

```
CloudFlare (WAF + DNS) → VPS (Bun, 2GB RAM) → PostgreSQL (managed or self-hosted)
```

### Setup

**1. Provision VPS**

DigitalOcean Droplet example:
- OS: Ubuntu 22.04 LTS
- Size: 2GB RAM, 1 vCPU
- Region: Choose closest to users

```bash
# SSH into droplet
ssh root@<IP>

# Update system
apt update && apt upgrade -y

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
```

**2. Create database**

```bash
sudo -u postgres psql

-- Inside psql:
CREATE DATABASE hyle_registry;
CREATE USER hyle_user WITH PASSWORD 'your-secure-password';
ALTER ROLE hyle_user SET client_encoding TO 'utf8';
ALTER ROLE hyle_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE hyle_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE hyle_registry TO hyle_user;
\q
```

**3. Configure environment**

```bash
# Create /opt/hyle/.env
sudo mkdir -p /opt/hyle
sudo tee /opt/hyle/.env > /dev/null <<EOF
# Server
PORT=3000
DB_URL=postgresql://hyle_user:your-secure-password@localhost:5432/hyle_registry
BASE_URL=https://registry.your-domain.com
JWT_SECRET=$(openssl rand -hex 32)

# OAuth
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>

# Email (optional, use Resend free tier)
RESEND_API_KEY=<your-resend-key>

# Rate limiting & quotas
HYLE_RATE_LIMIT=50       # publishes/hour per user
MAX_BLUEPRINT_SIZE=500M  # per blueprint
EOF

sudo chmod 600 /opt/hyle/.env
```

**4. Install application**

```bash
cd /opt/hyle
git clone https://github.com/kittender/hyle.git .

# Install dependencies
bun install
bun run build

# Run migrations (if using schema)
bun run migrations:up
```

**5. Systemd service**

Create `/etc/systemd/system/hyle.service`:

```ini
[Unit]
Description=Hylé Registry
After=network.target postgresql.service

[Service]
Type=simple
User=hyle
WorkingDirectory=/opt/hyle
EnvironmentFile=/opt/hyle/.env
ExecStart=/root/.bun/bin/bun run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl enable hyle
sudo systemctl start hyle
sudo systemctl status hyle
```

**6. Reverse proxy (Nginx)**

```nginx
server {
    listen 80;
    server_name registry.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name registry.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/registry.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/registry.your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable & restart:

```bash
sudo certbot certonly --standalone -d registry.your-domain.com
sudo systemctl enable nginx
sudo systemctl restart nginx
```

**7. Backups**

Automated daily PostgreSQL dumps:

```bash
# Create /usr/local/bin/backup-hyle.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump hyle_registry | gzip > /backups/hyle_$DATE.sql.gz
# Keep last 30 days
find /backups -name "hyle_*.sql.gz" -mtime +30 -delete
```

Cron:

```bash
0 2 * * * /usr/local/bin/backup-hyle.sh
```

Test restore monthly: `pg_restore -d test_db /backups/hyle_LATEST.sql.gz` to verify backups work.

**8. Monitoring**

Watch key metrics — upgrade to Tier 3 if approaching limits:

| Metric | Warning | Action |
|--------|---------|--------|
| CPU >70% sustained | Tier 2 too slow | Add more vCPU or → Tier 3 |
| Memory >2GB usage | Low headroom | Increase VPS size or → Tier 3 |
| DB connections at limit (100) | PgBouncer needed | Enable pooling or → Tier 3 |
| Disk >80% full | Data loss risk | Add storage or → Tier 3 |
| P99 latency >500ms | Performance degrading | → Tier 3 (multiple replicas) |
| >500 concurrent users | Single-node bottleneck | → Tier 3 (load balancer) |

Quick setup: Install [Prometheus + Node Exporter](https://prometheus.io/docs/prometheus/latest/getting_started/) to track CPU, memory, disk. Set alerts in PagerDuty or similar.

---

## Tier 3: Enterprise (High-Scale)

**Stack:** Docker Compose or Kubernetes + PostgreSQL HA + Load Balancer

**Time to deploy:** 2-4 hours (Compose) or 4-8 hours (Kubernetes)  
**Cost:** $100-500+/month depending on scale  
**Suitable for:** Teams 500+, high availability SLA, incident response team

### When to Use Tier 3

| Need | Choose |
|------|--------|
| >500 concurrent users, need failover | Tier 3 (required) |
| SLA uptime ≥99.5%, on-call rotation | Tier 3 (required) |
| Multi-region, <100ms latency | Custom (beyond this guide) |
| Kubernetes already in use | Tier 3 + adapt existing platform |
| "Growing past Tier 2 in 3 months?" | Stay Tier 2, plan Tier 3 migration |

### Quick Start: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hyle_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hyle_registry
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - hyle-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hyle_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  registry:
    image: oven/bun:latest
    command: bun run start
    working_dir: /app
    environment:
      PORT: 3000
      DB_URL: postgresql://hyle_user:${DB_PASSWORD}@postgres:5432/hyle_registry
      BASE_URL: https://registry.your-domain.com
      JWT_SECRET: ${JWT_SECRET}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
    volumes:
      - .:/app
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hyle-net
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    ports:
      - "443:443"
    depends_on:
      - registry
    networks:
      - hyle-net

volumes:
  postgres-data:

networks:
  hyle-net:
```

Deploy:

```bash
export DB_PASSWORD=$(openssl rand -base64 32)
export JWT_SECRET=$(openssl rand -base64 32)
export GITHUB_CLIENT_ID=your-id
export GITHUB_CLIENT_SECRET=your-secret

docker-compose up -d
docker-compose logs -f registry
```

### Kubernetes

Use existing managed Kubernetes (EKS, GKE, AKS) or self-hosted K3s.

Key requirements:
- PostgreSQL HA cluster (managed service: AWS RDS, Google Cloud SQL, or [Helm PostgreSQL chart](https://github.com/bitnami/charts/tree/main/bitnami/postgresql))
- Hylé replicas ≥3 with resource limits (0.5 CPU, 512MB memory per pod)
- Ingress controller (Nginx, Traefik) + TLS

See [Kubernetes documentation](https://kubernetes.io/docs/setup/) and adapt existing cluster patterns to Hylé deployment. No Kubernetes expertise required if using managed PostgreSQL.

### High Availability: PostgreSQL

Setup: Primary + Standby with automatic failover.

See [PostgreSQL streaming replication](https://www.postgresql.org/docs/current/warm-standby.html) for detailed setup. Quick overview:
1. Primary replicates WAL to standby via network
2. Standby stays hot (can serve read-only queries)
3. Use [PgBouncer](https://www.pgbouncer.org/config.html) for connection pooling (max 1000 connections, pool size 25-50)

### Monitoring

Setup Prometheus + Alertmanager: [Prometheus getting started](https://prometheus.io/docs/prometheus/latest/getting_started/)

Hylé exposes metrics on `/metrics` (port 9090). Key alerts:
- Error rate >1% (5m window)
- DB connections >80 (pooling limit)
- Disk >90% (backup + restore risk)
- Pod restarts (memory leak check)

---

## Quick Decision Tree

| Situation | Choose |
|-----------|--------|
| Testing locally, personal project | Tier 1 (Vercel) + local SQLite |
| Small team (10-100), private registry, $20-50/mo budget | Tier 2 (VPS + PostgreSQL) |
| Team >500, need 99.5% uptime, compliance audit trails | Tier 3 (HA + Kubernetes) |
| "Not sure, grow-as-you-go" | Start Tier 2, easy migration to Tier 3 later |

---

## Enterprise Adoption Path

**Why self-host?**

1. **Full control** — Data stays on your infrastructure
2. **Compliance** — Meets HIPAA, SOC 2, GDPR, FedRAMP requirements
3. **Customization** — Extend with internal policies, SSO, audit logging
4. **Cost at scale** — Cheaper than SaaS once you have 500+ users

**Getting started (Week 1-4):**

- Week 1: Spin up Tier 2 in staging (VPS + PostgreSQL)
- Week 2: Configure OAuth (GitHub or internal IdP), test authentication
- Week 3: Load test, set up backups, document runbooks
- Week 4: Deploy to production, migrate users

**Checklist for production:**

- [ ] HTTPS/TLS enabled (certificate auto-renewal with Let's Encrypt)
- [ ] Database backups automated (daily, 30-day retention, tested restore)
- [ ] Monitoring & alerting (Prometheus, PagerDuty, or similar)
- [ ] Logging centralized (CloudWatch, ELK, or Datadog)
- [ ] Rate limiting configured (CloudFlare or application-level)
- [ ] CDN caching (CloudFlare, Akamai, or similar)
- [ ] On-call rotation scheduled
- [ ] Incident response runbooks written
- [ ] Disaster recovery tested (failover, rollback)

**Enterprise features to add:**

- SAML/OIDC for SSO (not just GitHub)
- Audit logging (who pulled/pushed what, when)
- Policy-as-code (CEL rules for blueprint validation)
- Rate limiting per team/org
- Quota management (max storage, downloads, etc.)
- Custom integrations (Slack notifications, Jira sync, etc.)

---

## Troubleshooting

### "Connection refused" / "Cannot connect to registry"

```bash
# Check service is running
systemctl status hyle

# Check port is open
netstat -tlnp | grep 3000

# Check firewall
ufw status
ufw allow 443/tcp
```

### "Database connection pool exhausted"

Increase PgBouncer pool size:

```ini
default_pool_size = 50  # Increase from 25
```

Or add connection pooling middleware (PgBouncer, ProxySQL).

### "Out of memory" / High CPU

Check Bun heap usage:

```bash
# Increase heap
NODE_OPTIONS="--max-old-space-size=1024" bun run start
```

Or horizontally scale (add more replicas in Kubernetes).

---

## Next Steps

- **Need help?** Open an issue at [github.com/kittender/hyle/issues](https://github.com/kittender/hyle/issues)
- **Contributing deployment templates?** PR welcome at [github.com/kittender/hyle](https://github.com/kittender/hyle)
