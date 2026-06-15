# Troubleshooting

Common Hylé CLI issues and how to fix them.

---

## hyle init

### "hyle.yaml already exists. Overwrite?"

**Cause**: Running `hyle init` in a directory that already has `hyle.yaml`.

**Fix**: 
- Review existing `hyle.yaml` before overwriting
- Or skip init and edit manually: `hyle push` will auto-suggest missing fields

---

### "Must be lowercase alphanumeric with hyphens, max 64 chars"

**Cause**: Blueprint name or author invalid. Examples:
- `My-Blueprint` (uppercase)
- `my_blueprint` (underscore)
- `my blueprint` (space)
- `my-blueprint-that-is-way-too-long-and-exceeds-64-character-limit` (too long)

**Fix**: Use kebab-case, lowercase, 1–64 chars:
- `my-blueprint` ✓
- `claude-java-spring-boot` ✓

---

### "Can't detect git author"

**Cause**: Git user.name not configured, or running offline (--offline flag).

**Fix**:
```bash
git config --global user.name "Jane Doe"
hyle init  # Retries with author "jane-doe"
```

---

## hyle pull

### "Blueprint not found: org/name"

**Cause**: Blueprint doesn't exist in registry, or typo in name/author.

**Fix**:
```bash
hyle search java spring    # Find similar blueprints
hyle pull org/name --dry-run  # Verify syntax before pulling
```

Check registry at `https://registry.hyle.dev` (or custom remote in `.hyle`).

---

### "Checksum mismatch: expected X, got Y"

**Cause**: Bundle corrupted or registry tampered. This is a security error.

**Fix**:
1. Don't proceed — this blocks malicious blueprints
2. Check your internet connection (incomplete download?)
3. Try again: `hyle pull org/name`
4. If still fails, report to registry operators

---

### "Requires uncommitted changes to be committed first"

**Cause**: `hyle pull` requires all local changes to be committed (no staged/unstaged changes).

**Why**: Allows you to `git diff HEAD origin/name@version` to see exactly what's being added.

**Fix**:
```bash
git status                    # Check what's dirty
git add .
git commit -m "WIP before pulling blueprint"
hyle pull org/name            # Now succeeds
git diff HEAD MERGE_HEAD      # Review what changed
```

---

### "Dependency cedar (>=3.0) not found"

**Cause**: Blueprint requires Cedar policy engine, but it's not installed or version too old.

**Fix** (choose one):
```bash
# Let Hylé install it
hyle pull org/name --install-deps

# Manual install
brew install cedar          # macOS
apt-get install cedar       # Linux (if available)

# Check version
cedar --version             # Must be >=3.0
```

If not available in package manager, Hylé suggests manual install from [cedar GitHub](https://github.com/cedar-policy/cedar).

---

### "Permission denied (not author of blueprint)"

**Cause**: Trying to `hyle pull --upgrade` or push a version of a blueprint you didn't create.

**Fix**: You can still pull and use it, but can't upgrade upstream. Create a fork:
```bash
hyle snapshot my-org/forked-name
# Publishes under your author name
```

---

## hyle push

### "name + author already exists in registry"

**Cause**: Trying to publish a blueprint that already exists with same author + name.

**Fix**: Use `hyle pull` to get the existing version, or update version:
```bash
hyle.yaml:
  name: my-blueprint    # Unique name?
  author: my-author     # Different author?
  version: 1.5.0        # Higher version than existing?
```

Then: `hyle push`

---

### "Git remote not found"

**Cause**: `hyle.yaml` has no `url` field, and `git remote get-url origin` fails.

**Fix**:
```bash
# Option 1: Set git remote
git remote add origin https://github.com/you/my-repo

# Option 2: Add url to hyle.yaml
hyle.yaml:
  url: https://github.com/you/my-repo

# Try again
hyle push
```

---

### "All declared files must be committed and pushed to remote"

**Cause**: Blueprint lists files in `hyle.yaml`, but they're not committed or not pushed to GitHub.

**Fix**:
```bash
git add CLAUDE.md ARCHITECTURE.md .claude/agents/
git commit -m "feat: add AI workflows"
git push origin main
hyle push
```

---

### "[flagged] — contains hardcoded credentials"

**Cause**: Security scan detected API keys, passwords, or suspicious code in manifest/files.

**Examples**:
- CLAUDE.md with "ANTHROPIC_API_KEY=sk-xxx"
- .env file not excluded in .hyleignore
- Password in example code

**Fix**:
1. Remove secrets from files
2. Add to `.hyleignore`:
   ```
   .env
   *.key
   secrets/
   ```
3. Recommit: `git add ... && git commit && git push`
4. Re-publish: `hyle push` (increments version)

The flagged version remains visible (with reason), but new version is clean.

---

## hyle watch (extension)

### "requires ANTHROPIC_API_KEY"

**Cause**: Extension command `hyle watch` needs API key, not set.

**Fix**:
```bash
export ANTHROPIC_API_KEY=sk-...
hyle watch

# Or save to ~/.hyle for persistent use
hyle install hyle-watch
# Prompted to save key
```

---

### "split threshold invalid: must be % or number"

**Cause**: In `.hyle`, `split_threshold` malformed.

**Fix**:
```yaml
.hyle:
  split_threshold: "80%"      # ✓ Percentage
  split_threshold: "10000"    # ✓ Token count
  split_threshold: "80"       # ✗ Missing %
```

---

## General

### "Invalid remote_url in .hyle config"

**Cause**: `.hyle` has invalid registry URL.

**Examples**:
- `http://` (must be https)
- `localhost:3000` (not allowed in prod)
- `invalid-url` (not a URL)

**Fix**:
```yaml
.hyle:
  remote_url: https://registry.hyle.dev    # Correct
```

For localhost development:
```bash
export HYLE_ALLOW_INSECURE=1
hyle pull ...
```

---

### "hyle command not found"

**Cause**: Not installed or not in PATH.

**Fix**:
```bash
brew install hyle           # macOS
# or
curl -fsSL https://get.hylé.com | sh
which hyle                  # Verify
hyle --version
```

---

### "Config validation error: field X is required"

**Cause**: `hyle.yaml` missing required field (name, author, version, models.primary).

**Fix**: See [Configuration Reference](../reference/CONFIG.md).

Minimal `hyle.yaml`:
```yaml
name: my-blueprint
author: my-username
version: 0.1.0
models:
  primary:
    provider: anthropic
    model: claude-sonnet-4-6
```

---

## Still Stuck?

- Check [Configuration Reference](../reference/CONFIG.md) for all valid fields
- Read [Example Blueprint](EXAMPLE_BLUEPRINT.md) for a real project layout
- Check registry at `https://registry.hyle.dev` for examples
- Report issues: [GitHub Issues](https://github.com/kittender/hyle/issues)
