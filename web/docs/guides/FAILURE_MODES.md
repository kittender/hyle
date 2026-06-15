# Failure Modes & Edge Cases

What can go wrong, why, and how to recover.

---

## Pulling & Installation

### "I pulled a blueprint but my agents broke"

**Symptom:** `hyle pull` succeeded, but agents won't start or CLAUDE.md conflicts exist.

**Root causes:**

1. **CLAUDE.md was overwritten** — Blueprint replaced your local CLAUDE.md with different context.
2. **Models differ** — Blueprint wants `claude-sonnet-4-6`, you only have `claude-haiku-4-5` available.
3. **Inheritance chain broken** — Parent blueprint (`extends:`) was unpublished or deleted.
4. **Missing dependencies** — Blueprint requires Cedar/Node/Java but you didn't install them.

**How to detect:**
```bash
# Check git diff
git diff HEAD origin/main  # What changed?

# Check inheritance
cat hyle.lock  # Shows parent + checksums

# Verify dependencies
hyle verify  # Lists missing tools + versions
```

**Recovery:**

Option 1: Rollback to previous version
```bash
# hyle.lock tracks previous version
hyle rollback <version>
git diff HEAD  # Inspect what reverted
```

Option 2: Inspect diff before applying
```bash
hyle pull org/blueprint --dry-run
# Shows unified diff of all file changes
# Don't apply yet — inspect CLAUDE.md + AGENTS.md changes
```

Option 3: Keep both configs
```bash
# Stash your local CLAUDE.md before pulling
cp CLAUDE.md CLAUDE.md.backup
hyle pull org/blueprint
# Now merge:
diff CLAUDE.md.backup CLAUDE.md  # Side-by-side review
# Pick the parts you want from each
```

**Prevention:**
- Always use `hyle pull --dry-run` before applying to production.
- Test each compatible model category before publishing.
- Document your agent assumptions in CLAUDE.md (so you spot conflicts fast).

---

### "Dependency check says Cedar is missing but I have it installed"

**Symptom:** `hyle verify` fails with "cedar (>=3.0) not found", but `cedar --version` works.

**Root causes:**

1. **Version mismatch** — You have Cedar 2.x, blueprint needs >=3.0.
2. **Binary not in PATH** — Cedar installed but not accessible from command line.
3. **Different binary name** — Some installs use `cedar-cli` instead of `cedar`.

**How to debug:**
```bash
# Check version
cedar --version
# Expected: cedar 3.0.0 or higher

# Check PATH
which cedar  # Should return /usr/local/bin/cedar or similar

# Check if it's findable by Hylé
hyle verify --debug  # Shows exact lookup command
```

**Fix:**

```bash
# Upgrade Cedar
brew upgrade cedar          # macOS
apt-get install --only-upgrade cedar  # Linux
cargo install --force cedar  # From source

# Or link to correct name
ln -s /usr/local/bin/cedar-cli /usr/local/bin/cedar

# Verify
cedar --version            # Should now satisfy >=3.0
hyle verify               # Should pass
```

**If still stuck:**
```bash
# Force skip dependency check (not recommended)
hyle pull org/blueprint --skip-deps
# But you'll need to install manually later
```

---

### "I can't find the blueprint I just pushed"

**Symptom:** `hyle push` said "published", but `hyle search my-name` returns nothing.

**Root causes:**

1. **Registry indexing lag** — ~30s delay before search index updates.
2. **Blueprint flagged** — Security scan failed; version marked `[flagged]` and hidden.
3. **Wrong registry** — Pushed to local registry, searching public registry (or vice versa).
4. **Name/author mismatch** — Published under different name than searching for.

**How to check:**

```bash
# Check registry URL
echo $HYLE_REGISTRY_URL    # Should match where you pushed
# Or: cat .hyle | grep remote_url

# Check publication status
hyle outdated --all        # Lists all versions, flagged status
# Output: my-blueprint@1.0.0 [flagged: hardcoded_credentials]

# Wait and retry
sleep 30
hyle search my-blueprint

# Force registry refresh (if supported)
hyle search --fresh my-blueprint
```

**If flagged:**

```bash
# View why it was flagged
# (Check registry web UI or: hyle outdated --verbose)

# Fix the issue
# Remove secrets, add to .hyleignore, commit, push to GitHub

# Publish new version (replaces flagged one)
hyle push  # Version auto-increments; new version not flagged
```

**If wrong registry:**

```bash
# Confirm where you pushed
grep remote_url .hyle

# Re-push to correct registry
hyle push --registry https://registry.hylé.com
```

---

## Publishing & Versioning

### "snapshot vs push vs release — which do I use?"

**Decision tree:**

- **`hyle snapshot`** (patch bump: 0.1.0 → 0.1.1)
  - WIP / not ready for production
  - Shares with team, not listed in stable registry
  - No SLA — may be overwritten
  - Use: "early feedback", "testing a new feature"

- **`hyle push`** (minor bump: 0.1.0 → 0.2.0)
  - Tested, stable, ready for use
  - Listed in public registry
  - Backward compatible (no breaking changes)
  - Use: "new features", "incremental improvements"

- **`hyle release`** (major bump: 0.1.0 → 1.0.0)
  - Significant milestone or breaking changes
  - Incompatible with previous versions
  - Listed as "stable" in registry
  - Use: "major restructure", "moving to production", "1.0 launch"

**Decision aid:**

```bash
# If unsure, ask:
hyle status  # Shows current version + changes since last publish

# Then:
# — Only docs changed? → push (minor)
# — Experimental feature? → snapshot (patch, WIP)
# — Removed/renamed agent? → release (major, breaking)

# Or just use push unless you have a strong reason
```

---

### "I published but realized I made a mistake"

**Symptom:** Published v1.0.0, but it has a bug/secret/incomplete feature.

**Bad options:**
- Deleting version (can't — breaks reproducibility)
- Force-pushing to Git (doesn't unpublish from registry)

**Good options:**

1. **For minor issues (typos, docs):**
   - Fix locally, commit, push to GitHub
   - Publish v1.0.1: `hyle push` (auto-increments)
   - Users can upgrade: `hyle upgrade org/blueprint`

2. **For security issues (secrets, credentials):**
   - Follow [SECURITY.md](../security/SECURITY.md) — contact registry operators
   - They'll flag version as `[security-issue]`
   - Publish patched v1.0.1

3. **For breaking bugs:**
   - Assess damage: how many users pulled?
   - If <10 pulls: publish v1.0.1 fix, update docs
   - If >100 pulls: consider major release v2.0.0 with migration guide
   - Notify users via email (if system tracks pulls)

**Prevention:**
- Use `hyle push --dry-run` before publishing
- Run `hyle verify` locally
- Test compatible models + dependencies
- Have a team member review before publish

---

## Inheritance & Composition

### "Parent blueprint is unpublished. Now my child blueprint is broken"

**Symptom:** Pulled child blueprint (extends parent@1.0.0). Parent now deleted. Verification fails.

**Root causes:**
- Parent author unpublished it (intentional or accidental)
- Parent version is flagged (marked unsafe)
- Network issue — parent unreachable temporarily

**How to check:**
```bash
# View inheritance chain
cat hyle.lock  # Shows parent + child checksums

# Verify parent exists
hyle pull parent-name@1.0.0 --dry-run

# Check parent status
hyle outdated parent-name  # Is it flagged? Unpublished?
```

**Fix:**

1. **Parent is available but network issue:**
   ```bash
   # Retry
   hyle verify --refresh
   ```

2. **Parent is deleted/unpublished:**
   ```bash
   # Option A: Pin to last-known-good version
   # Edit hyle.yaml:
   extends:
     - parent-name@0.9.0  # Falls back to earlier version
   
   # Option B: Inline parent config (copy files locally)
   # Remove extends:, copy parent files into blueprint
   # Re-publish as standalone
   
   # Then re-verify
   hyle verify
   ```

3. **Parent is flagged (unsafe):**
   ```bash
   # Check why
   hyle outdated parent-name  # See flag reason
   
   # If acceptable, force:
   hyle pull --force-flagged
   
   # Else, find alternative parent or remove inheritance
   ```

**Prevention:**
- Before depending on external parent, check author's track record (published > 6 months, >50 pulls).
- Document dependency: "Extends XCorp base config — do not delete."
- Have fallback: "If parent unavailable, use this setup instead."

---

## Model Selection & Compatibility

### "Chose incompatible model — blueprint fails with this LLM"

**Symptom:** Blueprint works with Claude Sonnet but fails with Haiku or Ollama. Agent outputs degraded, reasoning breaks.

**Root causes:**
1. **Model selected from wrong compatibility category** — Chose `budget` but blueprint needs `advanced` reasoning
2. **Small model (Haiku/Ollama) can't handle complex prompts** — Too many tokens, context window overflow
3. **Blueprint only listed in `universal` but actually needs capable model** — Author didn't test properly
4. **Harness-specific blueprint on wrong platform** — Bedrock blueprint on local Ollama

**How to prevent:**

Check compatibility before pulling:

```bash
hyle pull org/blueprint --show-compatibility
# Shows: universal, budget, offline, advanced, harness

# Choose wisely:
hyle pull org/blueprint  # Defaults to author's primary
hyle pull org/blueprint --with openai/gpt-4o  # Override
hyle pull org/blueprint --with ollama/qwen2.5:14b
```

**Share what you tested:**

```yaml
recommendations:
  universal:
    - anthropic/claude-sonnet-4-6
    - openai/gpt-4o
  budget:
    - anthropic/claude-haiku-4-5
    - openai/gpt-4o-mini
  offline:
    - ollama/qwen2.5:14b
  advanced:  # Only high-capability models
    - anthropic/claude-sonnet-4-6@>=4.6
```

**If it still fails:**

```bash
# Fallback to declared compatible model
hyle pull org/blueprint --with anthropic/claude-sonnet-4-6
# Test before deploying to production

# 4. If all are down, queue work locally
# Use Ollama-only mode: `HYLE_LLM=ollama npm start`
```

**Cost implications:**

If you choose Ollama instead of Claude (expensive), costs drop but latency and accuracy may decrease. Document such trade-offs in blueprint description.

---

## Debugging & Getting Help

### "Something is broken and I don't know why"

**Steps to diagnose:**

1. **Enable debug logging:**
   ```bash
   export HYLE_DEBUG=1
   hyle pull org/blueprint
   # Shows detailed request/response logs
   ```

2. **Check your config:**
   ```bash
   # Verify registry URL
   echo $HYLE_REGISTRY_URL
   cat .hyle | grep remote_url
   
   # Verify auth token
   echo $HYLE_TOKEN  # Should be set (not printed)
   
   # Verify manifest
   cat hyle.yaml | head -20
   ```

3. **Isolate the problem:**
   ```bash
   # Is it the CLI or the registry?
   hyle search --debug  # Registry working?
   
   # Is it a specific blueprint?
   hyle pull other-blueprint  # Try different one
   
   # Is it version-specific?
   hyle pull org/blueprint@0.9.0  # Try earlier version
   ```

4. **Check logs:**
   ```bash
   # Registry logs (if self-hosted)
   docker compose logs registry
   
   # CLI cache (sometimes stale)
   rm -rf ~/.hyle/cache
   hyle search --fresh org/blueprint
   ```

---

## Report a Bug

If you've narrowed it down and need help:

**GitHub:** [kittender/hyle/issues](https://github.com/kittender/hyle/issues)

Include:
- CLI version: `hyle --version`
- Command run: `hyle pull org/blueprint`
- Full error output (with `HYLE_DEBUG=1`)
- `hyle.yaml` + `.hyle` (redact secrets)
- OS + architecture: `uname -a`
- `git --version`, `node --version` (if relevant)

---

## See Also

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common CLI issues
- [KNOWN_LIMITATIONS.md](../reference/KNOWN_LIMITATIONS.md) — What doesn't work yet
- [SECURITY.md](../security/SECURITY.md) — Security incidents + reporting
