# Changelog — Stellar Threads Core Protocol

## [1.0.2] - 2026-10-29
### Fixed
- Fixed TypeScript compile errors in `escrowClient.ts` and `passportClient.ts` with strict null checks and numeric enum state comparisons.
- Resolved `HealthData` interface type mismatch in `src/routes/health.ts` by adding `protocol22Ready` and `storageStatus` properties.
- Corrected `cargo fmt` command in CI workflow (`.github/workflows/ci.yml`) to use `--all` across workspace member crates.
- Formatted all Rust smart contracts with standard `rustfmt`.
- Fixed Docker build smoke test failure caused by TypeScript transpilation during container image creation.

### Added
- Added high-resolution vector screenshots in `public/screenshots/` (`dapp-overview.svg`, `digital-passport.svg`, `factoring-waterfall.svg`).
- Expanded README with visual architecture diagrams, API reference table, and test status badges (68 backend tests, 29 contract tests).
- Enhanced GitHub repository metadata with Protocol 22, hackathon, and circular economy topics.

---

## [1.0.1] - 2026-10-29
### Added
- **4 Custom Soroban Protocol 22 Contracts**: `fashion_escrow`, `product_passport`, `production_financing`, `designer_registry`.
- **Zero-Deficit 10,000 BPS Engine**: Integer split arithmetic with deterministic dust preservation.
- **Protocol 22 Storage Rent Auto-Bumping**: Proactive TTL rent extension for 518,400 ledgers.
- **Ephemeral Channel Account Pool**: Parallel transaction dispatch without `txBAD_SEQ` collisions.
- **Prometheus Observability**: `/metrics` exporter, Grafana dashboards, and alerting rules.
- **Proof-of-Reserve Solvency**: Automated on-chain reserve ratio validator.
- **Master Test Suite**: 29 Rust contract tests and 68 backend Vitest tests passing with 100% success.
