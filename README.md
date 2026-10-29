# 🧵 Stellar Threads — Core Protocol & Smart Contracts

[![Protocol 22](https://img.shields.io/badge/Stellar-Protocol%2022-gold?style=flat-square&logo=stellar)](https://stellar.org)
[![Contracts 100% Passing](https://img.shields.io/badge/Soroban%20Tests-29%2F29%20Passing-emerald?style=flat-square)](contracts/)
[![Backend Tests 100% Passing](https://img.shields.io/badge/Vitest%20Suites-65%2F65%20Passing-emerald?style=flat-square)](src/tests/)
[![Solvency](https://img.shields.io/badge/Proof--of--Reserve-100%25%20Solvent-blue?style=flat-square)](docs/SOLVENCY.md)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

> **Decentralized Fashion Finance (FashionFi) & European Union Digital Product Passports (DPP) powered by Stellar Soroban Protocol 22.**

---

## 🌟 Executive Summary
**Stellar Threads** is an institutional-grade fashion finance and provenance protocol bridging luxury fashion ateliers, sustainable bio-textile suppliers, and global department store retailers on Stellar.

By combining **Soroban smart contracts**, **zero-deficit 10,000 basis points arithmetic**, **high-concurrency ephemeral channel accounts**, and **cryptographic SHA-256 NFC digital physical twins**, Stellar Threads resolves luxury fashion's multi-billion dollar challenges in subcontracting opacity, working capital drought, and counterfeit dilution.

---

## 🏛️ Smart Contract Architecture (Soroban Protocol 22)
The core protocol comprises 4 specialized smart contracts written in Rust:

| Contract | Purpose | Key Innovations | Tests |
|---|---|---|:---:|
| **`fashion_escrow`** | 4-Stage B2B trade escrow | Zero-deficit 10,000 bps split, dust preservation, emergency pause, inspection attestation | 10 Pass |
| **`product_passport`** | Digital Product Passport (DPP) | Cryptographic SHA-256 physical twin check, soulbound provenance history, circular economy | 6 Pass |
| **`production_financing`** | Invoice factoring liquidity | Senior collateral claim, factoring APY yield engine, pro-rata investor refund waterfall | 7 Pass |
| **`designer_registry`** | Atelier credentials & ESG | Luxury prestige tiers (`HauteCouture`), GOTS bio-textile certifications, auto-rent bumps | 6 Pass |

---

## ⚡ Technical Highlights
- **Mathematical Invariant**: 100% integer arithmetic using `1 XLM = 10,000,000 Stroops` and `10,000 basis points (BPS)`.
- **Protocol 22 Rent Auto-Bumping**: Proactive TTL rent extension preserves state against archival eviction.
- **High-Throughput Channel Manager**: Ephemeral transaction source keypair pooling eliminates `txBAD_SEQ` sequence conflicts.
- **Failover RPC Cluster**: Multi-node circuit breaker with automatic failover between SDF RPC nodes.

---

## 🚀 Quickstart & Verification
```bash
# 1. Run all smart contract tests
cargo test --manifest-path contracts/Cargo.toml

# 2. Run all backend Vitest suites
npm test

# 3. Master unified test verification
node tools/run-all-tests.cjs
```

---

## 📜 Documentation Index
- [Evaluator Quickstart Guide](docs/EVALUATOR_QUICKSTART_GUIDE.md)
- [SCF Judging Alignment](docs/SCF_JUDGING_ALIGNMENT.md)
- [Protocol Whitepaper](docs/STELLAR_THREADS_WHITEPAPER.md)
- [STRIDE Threat Model](docs/THREAT_MODEL_STRIDE.md)
- [Error Codes Catalog](docs/ERROR_CODES_CATALOG.md)
