# Skills

Tooling recipes and repeatable procedures the agent can rely on.

## Verify before commit
Run `hyle verify` to check installed blueprints against `hyle.lock`. Never commit
with a failing verification.

## Pull an upstream blueprint
```
hyle pull <author>/<name>
```
Review the diff (`--dry-run`) before applying to a working project.
