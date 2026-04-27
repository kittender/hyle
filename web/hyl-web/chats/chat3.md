# Enterprise Solutions Page

_Started 2026-04-27 16:37 UTC_

---

## User

Add an "Enterprise" page accessible from the public navbar.

The page should contain explanations about private / org registry, for private companies use cases.
Companies with internal AI conventions, proprietary agent configs, or compliance requirements can use the tool through 3 different solutions:

- **Private registry support in `.hyle`.** Allow `remote_url` to point to a private HTTPS endpoint with token authentication:
  ```yaml
  # ~/.hyle or <project>/.hyle
  remote_url: https://substrates.internal.corp.com
  remote_token: ${HYLE_TOKEN}           # env var, never hardcoded
  ```
- **Self-hostable registry server.** A published open-source reference implementation (single binary or Docker image). Same API as the public registry. Org admins run it behind their firewall.

- **Org namespace on public registry.** Allow `hyle pull @acme/java-springboot` where `@acme` is a verified org namespace with access control. Private-to-org substrates visible only to members. Unlisted-but-pullable substrates for semi-private sharing.

Put forward a call to action: Support Hylé -> Donate
With a message about how funding helps us sustain a quality solution.

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Now let me read the rest of the HTML file to understand the router:

