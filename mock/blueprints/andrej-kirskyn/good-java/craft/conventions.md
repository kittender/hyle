# Craft Conventions

## Naming

| Element   | Convention  | Example       |
|-----------|-------------|---------------|
| Classes   | PascalCase  | UserService   |
| Methods   | camelCase   | findByEmail() |
| Constants | UPPER_SNAKE | MAX_RETRIES   |
| Packages  | lowercase   | com.example   |

## Layer Structure

```
src/main/java/com/example/
├── domain/          # Entities, value objects
├── application/     # Use cases, commands
├── infrastructure/  # Repos, adapters
└── api/             # Controllers, DTOs
```

## Git Workflow
- Branch: `feat/<ticket>-description`
- Commits: Conventional Commits
- PRs: squash merge into `main`
- Tags: semver (`1.2.3`)
