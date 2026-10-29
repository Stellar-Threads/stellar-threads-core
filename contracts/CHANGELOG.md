# Changelog - Stellar Threads Smart Contracts

All notable changes to `stellar-threads-core/contracts` are documented in this file.

## [1.0.1] - 2026-10-29

### Added
- **Storage Rent TTL Bumping**: Protocol 22 persistent TTL extension extending contract lifetime to 3,110,400 ledgers.
- **Zero-Deficit 10,000 Basis Points Engine**: Enforced strict mathematical completeness and dust floor allocation to primary payees.
- **Circuit Breaker Kill Switch**: Global emergency pause controls across all contracts.
- **Production Factoring Waterfalls**: 10,000 bps yield accrual, investor quotas, and collateral passport pledges.
- **Quality Inspection Verdicts**: Attestation mechanics for independent garment craftsmanship auditors.
- **WASM Size Profiler**: Automated size ceiling verification script (`scripts/check-wasm-size.sh`).
- **Comprehensive Documentation**: Formal invariant proofs, security audit scopes, and storage economics whitepapers.

## [1.0.0] - 2026-10-10
- Initial deployment of four core Soroban smart contracts: `fashion_escrow`, `designer_registry`, `product_passport`, and `production_financing`.
