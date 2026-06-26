# Service Layout

Standard layout every service in the fleet follows.

```
cmd/<service>/main.go   # entrypoint, wiring only
internal/
  transport/            # gRPC + HTTP handlers
  service/              # business logic
  store/                # persistence adapters
pkg/                    # exported, reusable libs
```

## Boundaries
- `transport` depends on `service`; never the reverse.
- `store` returns domain types, not driver rows.
