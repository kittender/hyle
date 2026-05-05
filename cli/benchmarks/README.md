# Hylé CLI Benchmarks

Performance benchmarks for core Hylé operations. Uses `console.time()` for compatibility with all Bun versions.

## Running Benchmarks

Run all benchmarks:
```bash
bun run bench
```

Run a specific benchmark:
```bash
bun run benchmarks/manifest.bench.ts
bun run benchmarks/ignore.bench.ts
```

## Benchmark Suites

### `manifest.bench.ts`
- `loadManifest` — manifest file parsing (YAML → JSON)
- `validateManifest` — full manifest validation with schema

Runs 1000 iterations per operation.

### `ignore.bench.ts`
- Pattern loading from `.hyleignore`
- Single file checks (matched vs. non-matched)
- Directory paths
- Batch path checking

Runs 10,000 iterations per operation.

## Baseline & Regression Detection

To establish a baseline:
```bash
bun run bench > baseline.txt
```

To compare against baseline:
```bash
bun run bench > current.txt
diff baseline.txt current.txt
```

## Adding New Benchmarks

1. Create `*.bench.ts` in this directory
2. Use `console.time(label)` / `console.timeEnd(label)` for measurement
3. Run setup/teardown inline (tests don't use hooks)
4. Include iteration count in console labels for clarity

Example:
```typescript
const iterations = 10000;
console.time(`operation x${iterations}`);
for (let i = 0; i < iterations; i++) {
  someExpensiveOperation();
}
console.timeEnd(`operation x${iterations}`);
```

## Performance Targets

- `loadManifest`: <1ms per operation
- `validateManifest`: <2ms per operation
- Pattern matching: <0.1ms per path

If benchmarks exceed targets, profile with:
```bash
bun --inspect-wait benchmarks/manifest.bench.ts
```

Then open DevTools at chrome://inspect.
