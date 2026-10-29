# Dependency Security & Supply-Chain Audit

## Scope
- Core Protocol Backend (`@stellar-threads/core`)
- Frontend dApp (`stellar-threads-frontend`)
- Rust Soroban Contracts (`contracts/`)

## Findings
- **Zero Critical Vulnerabilities**: All core dependencies pass critical CVE audits.
- **Cryptographic Tooling**: Uses official `@stellar/stellar-sdk` and `@stellar/freighter-api`.
- **Rust Dependencies**: Pinned to official `soroban-sdk = "22.0.0"`.
