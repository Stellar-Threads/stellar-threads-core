# Contributing to Stellar Threads Core

## Development Standards
1. **Rust / Soroban**:
   - Must use `soroban-sdk = "22.0.0"`.
   - All public methods must enforce authorization via `require_auth()`.
   - Never use floating point numbers; use `i128` and 10,000 basis points.
2. **TypeScript / Node.js**:
   - Strict TypeScript checking (`noEmit`).
   - Zero untested endpoints.

## Submission Workflow
1. Fork repository and create feature branch: `git checkout -b feat/your-improvement`.
2. Run `node tools/run-all-tests.cjs` to ensure 100% passing tests.
3. Submit pull request with detailed summary.
