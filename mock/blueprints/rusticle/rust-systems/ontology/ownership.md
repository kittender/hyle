# Ownership Conventions

- Prefer borrowing (`&T`) over cloning. Clone only when ownership must transfer.
- Return owned values from constructors; take references in read-only methods.
- Lifetimes are documented when they cross an API boundary.
- `Rc`/`Arc` is a design smell to justify, not a default reach.
