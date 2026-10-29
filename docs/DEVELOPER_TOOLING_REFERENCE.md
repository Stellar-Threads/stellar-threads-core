# Developer Tooling & CLI Reference

## Available Utility Scripts
- **`tools/run-all-tests.cjs`**: Master orchestrator running Rust contract tests & backend Vitest suites.
- **`tools/verify-solvency-cli.ts`**: On-demand ledger proof-of-reserve auditor.
- **`tools/check-wasm-budget.cjs`**: Gates compiled WASM size against 64KB target.
- **`tools/stress-test-channel-pool.cjs`**: Parallel 100-operation concurrency benchmark.
- **`tools/chaos-rpc-failure.cjs`**: Fault injection simulating RPC outages.
- **`tools/seed-protocol-demo.cjs`**: Instant demo ecosystem seeding.
