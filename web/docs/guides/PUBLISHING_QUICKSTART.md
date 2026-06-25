# Quickstart — Install & Pull Blueprints

Get started with Hylé in 5 minutes: install the CLI, find blueprints, and pull your first one.

---

## Install Hylé

```bash
# macOS / Linux
curl -fsSL https://get.hylé.com | bash

# Or via package manager (if available)
brew install kittender/hyle/hyle
```

Verify installation:

```bash
hyle --version
# Output: hyle X.Y.Z
```

---

## Search & Discover Blueprints

Browse the public registry:

```bash
# List all blueprints
hyle search

# Search by keyword
hyle search claude

# Filter by tag
hyle search --tag local
hyle search --tag bedrock
```

Or visit [registry.hylé.com](https://registry.hylé.com) in your browser.

---

## Pull Your First Blueprint

```bash
# Pull a blueprint
hyle pull author/blueprint-name

# See what will be installed (preview)
hyle pull author/blueprint-name --dry-run

# Pull specific version
hyle pull author/blueprint-name@1.0.0
```

Hylé will:
1. Show the diff of files being added/modified
2. Check dependencies are installed
3. Warn about paid services (OpenAI, Anthropic, Bedrock, etc.)
4. Apply files to your project

---

## Next Steps

**Want to publish your own?** → [Building Your Own Blueprint](BUILDING.md)

**Questions about features?** → [Publish Guide](PUBLISHING.md)

**Troubleshooting & edge cases?** → [Troubleshooting](TROUBLESHOOTING.md)

**See a real example?** → [Example Blueprint](EXAMPLE_BLUEPRINT.md)
