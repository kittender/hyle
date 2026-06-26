# Frontend Conventions

- One component per file; co-locate its styles and tests.
- Data fetching lives in hooks (`useX`), never inside presentational components.
- No inline object/array literals as props — they break memoisation.
- Prefer composition over configuration; avoid boolean prop explosions.
