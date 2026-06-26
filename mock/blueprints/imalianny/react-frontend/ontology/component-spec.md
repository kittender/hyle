# Component Spec

Every shared component must declare:

1. **Props contract** — typed, no `any`, required vs optional explicit.
2. **States** — default, hover, focus, disabled, loading, error.
3. **A11y** — role, keyboard interaction, focus order.
4. **Variants** — enumerated, not boolean soup.

A component without all four is not ready for the shared library.
