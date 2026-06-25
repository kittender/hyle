# Troubleshooting

Common Hylé CLI issues, edge cases, and how to fix them.

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

Check registry at `https://registry.hylé.com` (or custom remote in `.hyle`).

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

### "Dependency cedar (>=3.0) not found" / "installed but version doesn't match"

**Cause**: Blueprint requires a tool (e.g. Cedar) that's missing, too old, not in `PATH`, or installed under a different binary name (`cedar-cli` instead of `cedar`).

**Debug**:
```bash
cedar --version            # What you have, e.g. 2.9.0 — needed: >=3.0
which cedar                # Is it on PATH? Should return /usr/local/bin/cedar or similar
hyle verify --debug        # Shows the exact lookup command Hylé runs
```

**Fix**:
```bash
hyle deps check             # Prints the suggested install command per tool/OS

brew upgrade cedar          # macOS
apt-get install --only-upgrade cedar  # Linux
cargo install --force cedar # From source

ln -s /usr/local/bin/cedar-cli /usr/local/bin/cedar  # If binary name differs

cedar --version             # Confirm it now satisfies the constraint
hyle verify                 # Should pass
```

**Note**: `hyle pull` never blocks on missing dependencies — it extracts the blueprint regardless and prints a warning listing what's missing. Install at your own pace; re-check anytime with `hyle deps check`.

---

### "Permission denied (not author of blueprint)"

**Cause**: Trying to `hyle pull --upgrade` or push a version of a blueprint you didn't create.

**Fix**: You can still pull and use it, but can't upgrade upstream. Create a fork:
```bash
hyle snapshot my-org/forked-name
# Publishes under your author name
```

---

### "I pulled a blueprint but my agents broke"

**Cause**: One of —
1. **CLAUDE.md was overwritten** — blueprint replaced your local CLAUDE.md with different context.
2. **Models differ** — blueprint wants `claude-sonnet-4-6`, you only have `claude-haiku-4-5` available.
3. **Inheritance chain broken** — parent blueprint (`extends:`) was unpublished or deleted (see below).
4. **Missing dependencies** — blueprint requires Cedar/Node/Java but you didn't install them.

**Detect**:
```bash
git diff HEAD origin/main  # What changed?
cat hyle.lock               # Shows parent + checksums
hyle verify                 # Lists missing tools + versions
```

**Recover** (pick one):
```bash
# Option 1: re-pull a previous version explicitly
# hyle.lock only tracks the current version — there's no rollback command.
hyle pull org/blueprint@<previous-version> --force
git diff HEAD               # Inspect what reverted

# Option 2: inspect before applying, next time
hyle pull org/blueprint --dry-run   # Unified diff, don't apply yet

# Option 3: keep both configs
cp CLAUDE.md CLAUDE.md.backup
hyle pull org/blueprint
diff CLAUDE.md.backup CLAUDE.md     # Pick the parts you want from each
```

**Prevention**: always `hyle pull --dry-run` before applying to production; test each compatible model category before publishing; document agent assumptions in CLAUDE.md so conflicts are obvious.

---

### "Parent blueprint is unpublished — my child blueprint is broken"

**Cause**: Pulled a child blueprint (`extends: parent@1.0.0`). Parent was since deleted, flagged unsafe, or is temporarily unreachable.

**Check**:
```bash
cat hyle.lock                       # Shows parent + child checksums
hyle pull parent-name@1.0.0 --dry-run  # Verify parent still exists
hyle outdated parent-name           # Is it flagged? Unpublished?
```

**Fix**:
- **Network blip**: `hyle verify --refresh` and retry.
- **Parent deleted/unpublished**: pin `extends:` in `hyle.yaml` to the last-known-good version, or drop `extends:` and inline the parent's files locally, then re-publish standalone.
- **Parent flagged unsafe**: check the flag reason on the parent's registry detail page; if acceptable, pin to its last clean version, otherwise inline locally.

**Prevention**: before depending on an external parent, check the author's track record (published >6 months, >50 pulls); document the dependency in CLAUDE.md ("Extends XCorp base config — do not delete"); keep a documented fallback setup.

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

**Cause**: Security scan detected API keys, passwords, or suspicious code in manifest/files. Examples:
- CLAUDE.md with `ANTHROPIC_API_KEY=sk-xxx`
- `.env` file not excluded in `.hyleignore`
- Password in example code

**Fix**:
```bash
# 1. Remove secrets from files
# 2. Add to .hyleignore:
echo ".env
*.key
secrets/" >> .hyleignore

# 3. Recommit and re-publish (version auto-increments)
git add . && git commit -m "fix: remove secrets" && git push
hyle push
```

The flagged version stays visible on the registry (with reason shown), but the new version is clean.

---

### "I can't find the blueprint I just pushed"

**Cause**: One of —
1. **Registry indexing lag** — ~30s delay before search index updates.
2. **Blueprint flagged** — security scan failed; see `[flagged]` above.
3. **Wrong registry** — pushed to local registry, searching public registry (or vice versa).
4. **Name/author mismatch** — published under a different name than searched.

**Check**:
```bash
echo $HYLE_REGISTRY_URL     # Should match where you pushed
grep remote_url .hyle

hyle outdated --all         # Lists all versions + flagged status
sleep 30 && hyle search my-blueprint   # Retry after indexing lag
hyle search --fresh my-blueprint       # Force refresh, if supported
```

**Wrong registry?**
```bash
hyle push --registry https://registry.hylé.com
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

## Versioning

### "snapshot vs push vs release — which do I use?"

- **`hyle snapshot`** (patch bump: 0.1.0 → 0.1.1) — WIP, not production-ready. Shares with team, not listed in stable registry. No SLA — may be overwritten. Use for early feedback or testing a new feature.
- **`hyle push`** (minor bump: 0.1.0 → 0.2.0) — tested, stable, backward compatible. Listed in public registry. Use for new features or incremental improvements.
- **`hyle release`** (major bump: 0.1.0 → 1.0.0) — breaking changes or significant milestone, incompatible with previous versions. Use for major restructures or a 1.0 launch.

If unsure: `grep version hyle.yaml` to see current version, then — docs-only change → `push`; experimental → `snapshot`; removed/renamed agent → `release`. Or just use `push` unless you have a strong reason not to.

---

### "I published but realized I made a mistake"

**Bad options**: deleting the version (breaks reproducibility for anyone who pulled it); force-pushing to Git (doesn't unpublish from registry).

**Good options**:
1. **Minor issues (typos, docs)**: fix locally, commit, push to GitHub, then `hyle push` (auto-increments). Users upgrade with `hyle upgrade org/blueprint`.
2. **Security issues (secrets, credentials)**: follow [SECURITY.md](../security/SECURITY.md) to contact registry operators — they'll flag the version as `[security-issue]`; publish a patched version.
3. **Breaking bugs**: assess how many pulls happened. <10 → publish a fix + update docs. >100 → consider a major release with a migration guide, and notify users if the system tracks pulls.

**Prevention**: `hyle push --dry-run` and `hyle verify` before publishing; test compatible models + dependencies; have a teammate review before publish.

---

## Model Selection & Recommendations

### "Chose incompatible model — blueprint fails with this LLM"

**Symptom**: Blueprint works with Claude Sonnet but fails with Haiku or Ollama — degraded output, reasoning breaks.

**Cause**: One of —
1. Model picked from the wrong recommendation category (`budget` instead of `advanced`).
2. Small model (Haiku/Ollama) can't handle the prompt — context window overflow.
3. Blueprint only listed under `universal` but actually needs a capable model — author didn't test properly.
4. Harness-specific blueprint on the wrong platform (Bedrock blueprint on local Ollama).

**Prevention**: Hylé's CLI doesn't select or run a model — `recommendations` in `hyle.yaml` are metadata only. Read them before pulling, then configure your own agent/harness accordingly:
```bash
curl -s https://registry.hylé.com/blueprints/org/blueprint/latest | jq .recommendations
# Or after pulling:
cat hyle.yaml   # recommendations block lists tested categories
```

If it still fails, switch to a model listed under `universal` or `advanced` in your own agent/harness config and re-test — Hylé has no role in that switch. Note the cost/latency/accuracy trade-off if you downgrade to a cheaper model, and document it in the blueprint description.

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
  remote_url: https://registry.hylé.com    # Correct
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

**Cause**: `hyle.yaml` missing required field (name, author, version).

**Fix**: See [Configuration Reference](../reference/CONFIG.md).

Minimal `hyle.yaml`:
```yaml
name: my-blueprint
author: my-username
version: 0.1.0
```

---

## Diagnosing an unknown issue

1. **Check your config**:
   ```bash
   echo $HYLE_REGISTRY_URL
   cat .hyle | grep remote_url
   cat ~/.hyle/auth.json   # Should show an access_token (re-run `hyle login` if missing)
   cat hyle.yaml | head -20
   ```
2. **Isolate the problem**:
   ```bash
   hyle search test              # Is the registry reachable at all?
   hyle pull other-blueprint     # Is it this blueprint specifically?
   hyle pull org/blueprint@0.9.0 # Is it this version?
   ```
3. **Check logs** (self-hosted): `docker compose logs registry`

---

## Report a Bug

If you've narrowed it down and need help, file an issue at [kittender/hyle/issues](https://github.com/kittender/hyle/issues) with:
- CLI version: `hyle --version`
- Command run, e.g. `hyle pull org/blueprint`
- Full error output
- `hyle.yaml` + `.hyle` (redact secrets)
- OS + architecture: `uname -a`
- `git --version`, `node --version` (if relevant)

---

## Still Stuck?

- Check [Configuration Reference](../reference/CONFIG.md) for all valid fields
- Read [Example Blueprint](EXAMPLE_BLUEPRINT.md) for a real project layout
- Check registry at `https://registry.hylé.com` for examples
- [Security policy](../security/SECURITY.md) — for security incidents specifically
- [Known limitations](../reference/KNOWN_LIMITATIONS.md) — what doesn't work yet
