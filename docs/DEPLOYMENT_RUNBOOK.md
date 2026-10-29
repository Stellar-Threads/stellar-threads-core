# Production Deployment Runbook — Stellar Testnet & Mainnet

## 1. Compile Contracts for Release
```bash
cargo build --manifest-path contracts/Cargo.toml --target wasm32-unknown-unknown --release
```

## 2. Deploy to Stellar Testnet
```bash
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/stellar_threads_fashion_escrow.wasm \
  --source <ADMIN_SECRET> \
  --network testnet
```
