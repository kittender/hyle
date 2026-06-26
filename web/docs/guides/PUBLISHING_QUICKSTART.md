# Quickstart — Find & Pull Blueprints

For people who want to **use** a blueprint. Find one, preview it, apply it. ~5 minutes.

> ⚠️ **Pre-release.** No installers or hosted registry yet — you run the CLI and a
> local registry from source. Hosted `registry.hylé.com` and `brew`/`curl` installers
> are [planned](../BACKLOG.md). To publish instead, see [Building](BUILDING.md).

---

## Get the CLI running

Run it from source against a local registry (see [Quickstart](../QUICKSTART.md)
for the full stack):

```bash
docker compose up --build          # registry → :3000, web → :8080
bun run cli/src/index.ts --help    # run the CLI from source
```

The CLI talks to `http://localhost:3000` by default. (When packaged, this becomes
`hyle <command>` — same arguments throughout these docs.)

---

## Search & Discover Blueprints

Browse the registry the CLI targets:

```bash
hyle search                 # list everything
hyle search claude          # by keyword
hyle search --tag local     # by tag
hyle search --tag bedrock
```

Or open the web UI at [http://localhost:8080](http://localhost:8080).

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
