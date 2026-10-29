# Stellar Threads — Codebase & Infrastructure Architecture

## Overview
This document outlines the testing, CI/CD, database caching, and security scanning infrastructure for Stellar Threads Protocol 22.

## Testing Architecture
1. **Smart Contracts (`contracts/`)**:
   - 29 unit tests covering 10,000 basis points math, dust preservation, emergency pauses, and circular passport transitions.
   - Run command: `cargo test --manifest-path contracts/Cargo.toml`
2. **Backend Services (`src/`)**:
   - 48+ Vitest integration tests covering REST endpoints, SSE streams, circuit breakers, and channel pools.
   - Run command: `npm test`
3. **Frontend dApp (`stellar-threads-frontend`)**:
   - 47+ Vitest component tests with React Testing Library.
   - Run command: `npm test`

## CI/CD Pipelines
- **`ci.yml`**: Core protocol test execution and WASM build verification.
- **`codeql.yml`**: Automated static security analysis.
- **`docker.yml`**: Production Docker image compilation.
- **`release.yml`**: Automated tagging and WASM artifact distribution.
