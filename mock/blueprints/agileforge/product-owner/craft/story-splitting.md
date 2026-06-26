# Story Splitting Patterns

When a story is too big, split along one of these seams:

1. **Workflow steps** — ship the first step end-to-end, then the next.
2. **Business rule variations** — happy path first, exceptions later.
3. **Data types / interfaces** — one input format now, more later.
4. **CRUD operations** — Create + Read first; Update/Delete follow.
5. **Effort spike** — separate the unknown into a timeboxed investigation.

Prefer vertical slices (a thin slice through all layers) over horizontal ones
(a whole layer with no user-visible value).
