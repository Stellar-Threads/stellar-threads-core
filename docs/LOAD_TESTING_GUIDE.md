# Load & Concurrency Testing Guide

## Running Stress Benchmarks
```bash
# 1. Stress test channel account pool (100 parallel acquisitions)
node tools/stress-test-channel-pool.cjs

# 2. Run RPC fault injection chaos simulation
node tools/chaos-rpc-failure.cjs

# 3. Check WASM contract size budgets
node tools/check-wasm-budget.cjs
```

## Expected Results
- Zero `txBAD_SEQ` sequence collisions under parallel load.
- Automatic circuit breaker trip on consecutive 504 errors.
- 100% test pass rate across smart contract and backend suites.
