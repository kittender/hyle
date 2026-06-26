# Unsafe Code Review

## unsafe-requires-justification
**Severity:** critical
Every `unsafe` block needs a `// SAFETY:` comment explaining why the invariants hold,
and a second reviewer's sign-off.

## no-unwrap-in-libs
**Severity:** warning
Library code returns `Result`; `unwrap()`/`expect()` are for tests and `main` only.
