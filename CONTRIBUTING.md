# Contributing to Stellar Threads Core

Thank you for contributing to the core infrastructure and smart contracts of the **Stellar Threads** fashion-finance protocol!

This repository houses the Soroban smart contracts written in Rust, typed contract clients, real-time event indexing engine, database persistence layer, and REST/SSE protocol endpoints.

---

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please treat all participants with respect, empathy, and professional integrity.

---

## Architecture Overview

```
stellar-threads-core/
├── contracts/                  # Soroban smart contracts (Rust)
│   ├── designer_registry/      # Atelier & designer registration on Stellar
│   ├── product_passport/       # Digital garment passport with SHA-256 integrity
│   ├── fashion_escrow/         # Escrow order lifecycle and token settlements
│   └── production_financing/   # Campaign funding thresholds & repayment distribution
├── src/
│   ├── contracts/              # Typed TypeScript contract clients
│   ├── indexer/                # Soroban contract event indexer & SSE broadcaster
│   ├── storage/                # SQLite event persistence and checkpointing
│   ├── routes/                 # REST API & SSE streaming endpoints
│   └── tests/                  # Vitest integration and validation tests
├── migrations/                 # Versioned SQL migrations
└── scripts/                    # Contract compilation and Testnet deployment tooling
```

---

## Prerequisites & Local Setup

1. **Rust & Cargo** (v1.80+):
   ```bash
   rustup target add wasm32-unknown-unknown
   ```
2. **Node.js** (v20+ recommended) and **npm**:
   ```bash
   npm install
   ```

---

## Testing & Verification Instructions

### 1. Soroban Contract Tests
Execute the comprehensive Rust test suite covering authorization, duplicate rejections, state transitions, and event emission:
```bash
cargo test --manifest-path contracts/Cargo.toml
```

### 2. Backend & Integration Tests
Run unit, validation, and API tests:
```bash
npm test
```

### 3. Linting and Type Checking
```bash
npm run lint
npm run typecheck
```

---

## Contract Build & Deployment

To compile the optimized WASM binaries for all contracts:
```bash
node scripts/build-contracts.cjs
```

To deploy and seed state on Stellar Testnet:
```bash
# Requires deployer credentials or testnet account configuration
node scripts/deploy-testnet.cjs
```
Deployments write to `deployments/testnet.json` and sync with `src/config/contracts.json`.

---

## Issue Triage & Contribution Labels

We categorize all contributions with clear labels:

| Label | Description |
|---|---|
| `good first issue` | Well-scoped starter tasks ideal for newcomers |
| `help wanted` | Community assistance requested on specialized features |
| `soroban` | Soroban smart contract logic and SDK interactions |
| `rust` | Rust code, memory safety, or compilation optimization |
| `stellar` | Horizon, Stellar RPC, or transaction envelope handling |
| `contracts` | Smart contract interfaces, data structures, and events |
| `backend` | API endpoints, database schemas, or server logic |
| `testing` | Contract unit tests, integration suites, or CI enhancements |
| `security` | Access control audits, input sanitization, safe arithmetic |
| `documentation` | Guides, API docs, diagrams, and README improvements |

---

## Maintainer Guidance & Triage Workflow

1. **Triage:** New issues are assigned appropriate labels within 48 hours.
2. **PR Review:** All PRs must pass the CI workflow (`ci.yml`), maintain 100% test passing status, and include clear descriptions.
3. **Branching:** Base all feature branches off `main` and submit PRs back to `main`.
4. **Commits:** Write descriptive, natural commit messages (e.g., `Add digital product passport registry contract`).

---

## Public Roadmap & Contribution Opportunities

- [x] Designer Registry contract with metadata reference updates.
- [x] Product Passport Registry with SHA-256 cryptographic integrity hash.
- [x] B2B Fashion Escrow contract with token transfer integration.
- [x] Production Financing contract with threshold milestones and proportional repayments.
- [x] Real-time event indexing service with cursor checkpointing and SSE streaming.
- [ ] Multi-asset escrow supporting EURC and custom fashion reward tokens.
- [ ] Batch passport minting for seasonal ready-to-wear collections.
- [ ] Decentralized arbitration mechanism for logistics carrier disputes.

---

## Security

Please do not disclose security vulnerabilities publicly. Follow instructions in [SECURITY.md](SECURITY.md).
