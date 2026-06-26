# Domain Glossary

## Coroutine
An async function whose execution can suspend at `await` points without blocking the
event loop.

## Unit of Work
A boundary that tracks changes and commits them atomically.

## Repository
An async abstraction over storage. Returns domain objects, never ORM rows.
