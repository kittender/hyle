# Quick Start: Self-Hosted Registry (5 Minutes)

Minimal setup for a **single-node registry** on a $5-10 VPS. Good for testing, small teams, or on-premise pilot.

**Time:** ~5 minutes  
**Requirements:** Docker (or standalone Bun binary)  
**Cost:** VPS (~$5-10/month) + compute

---

## Option A: Docker Compose (Recommended)

Simplest path. Starts registry + SQLite in one command.

### 1. Create `docker-compose.yml`

```yaml
version: '3.9'

services:
  registry:
    image: hyle/registry:latest  # or build from source
    container_name: hyle-registry
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      PORT: "3000"
      DB_PATH: "/data/hyle-registry.db"
      BASE_URL: "http://localhost:3000"  # Change to your domain
      JWT_SECRET: "change-me-to-random-hex"  # Run: openssl rand -hex 32
      GITHUB_CLIENT_ID: "your-github-app-id"
      GITHUB_CLIENT_SECRET: "your-github-app-secret"
      FRONTEND_URL: "http://localhost:3000"
    volumes:
      - hyle_data:/data  # Persist database
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  hyle_data:
    driver: local
```

### 2. Start
```bash
docker compose up -d
```

Registry lives at `http://localhost:3000`. Wait ~10s for startup.

### 3. Test
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### 4. Update CLI config
On your local machine:
```bash
# ~/.hyle
remote_url: http://your-vps-ip:3000
```

Then pull + push blueprints as usual.

---

## Option B: Standalone Binary (No Docker)

If you prefer no container overhead.

> ⚠️ **Pre-release:** prebuilt binaries (`releases.hylé.com`) are
> [planned](../BACKLOG.md), not published yet. For now, build from source.

### 1. Build the binary

```bash
git clone https://github.com/kittender/hyle.git && cd hyle
bun install
cd registry && bun run build      # produces ./dist/hyle-registry
cp dist/hyle-registry /usr/local/bin/hyle-registry
```

### 2. Create data directory
```bash
mkdir -p /opt/hyle-registry/data
cd /opt/hyle-registry
```

### 3. Create `.env` file
```bash
cat > .env <<EOF
PORT=3000
DB_PATH=/opt/hyle-registry/data/hyle-registry.db
BASE_URL=http://localhost:3000
JWT_SECRET=$(openssl rand -hex 32)
GITHUB_CLIENT_ID=your-github-app-id
GITHUB_CLIENT_SECRET=your-github-app-secret
FRONTEND_URL=http://localhost:3000
EOF
```

### 4. Run
```bash
./hyle-registry
# Should print: "Listening on http://localhost:3000"
```

To run as background service (systemd):
```bash
cat > /etc/systemd/system/hyle-registry.service <<EOF
[Unit]
Description=Hylé Blueprint Registry
After=network.target

[Service]
Type=simple
User=hyle
WorkingDirectory=/opt/hyle-registry
ExecStart=/opt/hyle-registry/hyle-registry
Restart=always
EnvironmentFile=/opt/hyle-registry/.env

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable hyle-registry
sudo systemctl start hyle-registry
```

---

## Next: HTTPS + Domain (5 More Minutes)

Once running locally, expose it to the internet safely.

### Option 1: Cloudflare Tunnel (Zero Setup)
```bash
# Install Cloudflare CLI
brew install cloudflare/cloudflare/cf

# Create tunnel
cf tunnel create hyle-registry

# Route traffic to local registry
cf tunnel route dns hyle-registry.yourdomain.com hyle-registry

# Start tunnel
cf tunnel run hyle-registry

# Tunnel stays live; registry accessible at https://hyle-registry.yourdomain.com
```

### Option 2: Reverse Proxy (Nginx + Let's Encrypt)
```bash
# Install Nginx
sudo apt-get install nginx certbot python3-certbot-nginx

# Create config
sudo cat > /etc/nginx/sites-available/hyle-registry <<EOF
server {
    server_name registry.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable + get certificate
sudo ln -s /etc/nginx/sites-available/hyle-registry /etc/nginx/sites-enabled/
sudo certbot --nginx -d registry.yourdomain.com

# Test
curl https://registry.yourdomain.com/health
```

---

## GitHub OAuth Setup (Required)

Registry needs GitHub OAuth to let users log in + verify authors.

### 1. Create GitHub App

Go to: **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**

Fill in:
- **App name:** `Hylé Registry Dev` (or your name)
- **Homepage URL:** `http://localhost:3000` (or your domain)
- **Authorization callback URL:** `http://localhost:3000/auth/github/callback`
- **Permissions:** Read access to public repos (no secrets needed)

### 2. Get credentials
After creation, copy:
- **Client ID** → `GITHUB_CLIENT_ID` in `.env`
- **Client Secret** → `GITHUB_CLIENT_SECRET` in `.env`

### 3. Restart registry
```bash
# Docker
docker compose restart

# Standalone
kill the process and restart
```

---

## Verify It Works

### 1. Check registry status
```bash
curl http://localhost:3000/health
```

### 2. Try login (web UI)
Open `http://localhost:3000` in browser. Click **Sign in with GitHub**. Should work.

### 3. Try CLI
```bash
hyle search --registry http://localhost:3000
# Should list blueprints (empty at first)
```

### 4. Try publishing
```bash
cd your-blueprint-project/
hyle push --registry http://localhost:3000
# Should publish successfully
```

---

## Backup & Recovery

Database lives in `/data/hyle-registry.db` (Docker) or `/opt/hyle-registry/data/` (standalone).

### Backup daily
```bash
# Docker
docker compose cp registry:/data/hyle-registry.db ./backups/hyle-$(date +%Y-%m-%d).db

# Standalone
cp /opt/hyle-registry/data/hyle-registry.db /backups/hyle-$(date +%Y-%m-%d).db

# Auto-backup (cron)
0 2 * * * cp /opt/hyle-registry/data/hyle-registry.db /backups/hyle-$(date +\%Y-\%m-\%d).db
```

### Restore
```bash
# Stop registry
docker compose stop  # or: systemctl stop hyle-registry

# Restore backup
cp /backups/hyle-2026-06-15.db /data/hyle-registry.db

# Start
docker compose up  # or: systemctl start hyle-registry
```

---

## Troubleshooting

### "Connection refused" on `http://localhost:3000`
- Registry hasn't started yet. Wait 10s and retry.
- Check logs: `docker compose logs -f` (Docker) or inspect terminal output (standalone).

### "JWT_SECRET not set" error
- `.env` file missing or unreadable.
- Set `JWT_SECRET` in environment before starting.

### GitHub login fails
- `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` wrong.
- Verify in GitHub Settings → Developer settings → GitHub Apps.
- Check `Authorization callback URL` matches your domain.

### Database disk full
- Clean old backup logs.
- Expand volume: `docker compose down && docker volume prune` (caution: loses data).

---

## Next Steps

✅ **Registry running locally?** Now decide:

### Option A: Stay Local (Testing/Development)
- Keep this single-node SQLite setup
- Set up automated backups ([see Backup section](#backup--recovery))
- Test restore monthly: verify backups actually work

### Option B: Upgrade to Production (Tier 2)
**When:** Sharing with team, need durability, public internet access

Steps:
1. **Backup your SQLite database:** `docker compose cp registry:/data/hyle-registry.db ./hyle-backup.db`
2. **Follow [Tier 2 setup](DEPLOYMENT.md#tier-2-intermediate-teamsprodu)** (VPS + PostgreSQL): takes ~1-2 hours
3. **Migrate data:** Export blueprints from local registry → push to Tier 2 registry
4. **Update CLI config:** Point to new registry URL (`~/.hyle`)

**Cost:** $15-40/month (DigitalOcean, Linode, Hetzner)

### Option C: Go Full HA (Tier 3)
**When:** Team >500, need 99.5% uptime SLA, incident response on-call

See [Tier 3 setup](DEPLOYMENT.md#tier-3-enterprise-high-scale) (Docker Compose or Kubernetes with replicated PostgreSQL).

---

## Also See

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Production setup (Tier 1/2/3), monitoring, backups
- **[PUBLISHING.md](../guides/PUBLISHING.md)** — Create + publish your first blueprint
- **[TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md)** — Common issues + fixes

---

**Questions?** See [TROUBLESHOOTING.md](../guides/TROUBLESHOOTING.md) or file an issue on [GitHub](https://github.com/kittender/hyle).
