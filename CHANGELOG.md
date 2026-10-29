# Changelog — Stellar Threads Core Protocol

## [1.0.1] - 2026-10-29
### Added
- **4 Custom Soroban Protocol 22 Contracts**: `fashion_escrow`, `product_passport`, `production_financing`, `designer_registry`.
- **Zero-Deficit 10,000 BPS Engine**: Integer split arithmetic with deterministic dust preservation.
- **Protocol 22 Storage Rent Auto-Bumping**: Proactive TTL rent extension for 518,400 ledgers.
- **Ephemeral Channel Account Pool**: Parallel transaction dispatch without `txBAD_SEQ` collisions.
- **Prometheus Observability**: `/metrics` exporter, Grafana dashboards, and alerting rules.
- **Proof-of-Reserve Solvency**: Automated on-chain reserve ratio validator.
- **Master Test Suite**: 29 Rust contract tests and 67 backend Vitest tests passing with 100% success.
