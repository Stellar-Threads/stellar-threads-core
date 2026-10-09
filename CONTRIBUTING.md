# Contributing to Stellar Threads Core

Thank you for contributing to the core infrastructure of the Stellar Threads protocol!

## Code of Conduct

All contributors agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Workflow

1. Fork this repository and create a feature branch:
   ```bash
   git checkout -b feat/core-feature-name
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify test suites and type safety:
   ```bash
   npm run typecheck
   npm test
   ```
4. If modifying Soroban smart contracts:
   ```bash
   cargo check --manifest-path contracts/Cargo.toml
   ```
5. Commit using conventional commit standards:
   - `feat:` new service or contract features
   - `fix:` bug fixes
   - `docs:` documentation updates
   - `test:` test coverage
   - `refactor:` code restructuring
6. Open a pull request against `main`.

## Security

Do not report security vulnerabilities in public issues. Refer to [SECURITY.md](SECURITY.md).
