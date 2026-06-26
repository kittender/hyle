# Domain Glossary

## Aggregate
A cluster of domain objects treated as a single unit for data changes. Always has a
root entity.

## Command
An intent to change system state. Named imperatively: `CreateUser`, `DeleteOrder`.

## Domain Event
A record that something significant occurred. Named in past tense: `UserCreated`,
`OrderShipped`.

## Repository
An abstraction over persistence. One repository per aggregate root.

## Value Object
An immutable concept identified by its attributes, not its identity. E.g. `Email`,
`Money`.
