# Route Architecture

App Router conventions for this project.

- `app/(marketing)/` — public, statically rendered.
- `app/(app)/` — authenticated, dynamic.
- `app/api/` — route handlers; thin, delegate to `lib/`.

## Rules
- Server Components by default; add `"use client"` only when you need interactivity.
- Data fetching happens in Server Components or route handlers, never in client
  components via `useEffect` waterfalls.
