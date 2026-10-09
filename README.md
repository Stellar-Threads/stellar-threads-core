# Stellar Threads — Core Protocol & Soroban Smart Contracts

> **From design to ownership, powered by Stellar.**

[![Core CI](https://github.com/Stellar-Threads/stellar-threads-core/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Threads/stellar-threads-core/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Stellar Network](https://img.shields.io/badge/Network-Stellar_Testnet-gold.svg)](https://stellar.expert/explorer/testnet)

Stellar Threads Core provides the protocol-level smart contracts, typed contract clients, real-time Soroban contract event indexer, persistent storage layer, and backend REST/SSE APIs for the Stellar Threads decentralized fashion-finance ecosystem.

---

## Architecture Overview

```
stellar-threads-core/
├── contracts/                        # Soroban smart contracts (Rust)
│   ├── Cargo.toml                    # Virtual workspace
│   ├── designer_registry/            # Atelier & designer identity registry
│   │   └── src/lib.rs
│   ├── product_passport/             # Digital Product Passport with SHA-256 integrity
│   │   └── src/lib.rs
│   └── fashion_escrow/               # B2B fashion orders & escrow settlement
│       └── src/lib.rs
├── deployments/
│   └── testnet.json                  # Machine-readable deployment manifest
├── migrations/
│   └── 001_initial_schema.sql        # Versioned SQL database migrations
├── scripts/
│   ├── build-contracts.cjs           # Optimized WASM compiler script
│   └── deploy-testnet.cjs            # Testnet deployment & initialization orchestrator
└── src/
    ├── app.ts                        # Express server with REST & SSE endpoints
    ├── config/contracts.json         # Synced contract addresses & RPC config
    ├── contracts/                    # Typed Soroban client wrappers
    │   ├── designerRegistryClient.ts
    │   ├── productPassportClient.ts
    │   └── fashionEscrowClient.ts
    ├── indexer/                      # Contract event indexer & SSE broadcaster
    │   └── eventIndexer.ts
    ├── routes/                       # REST endpoints for designers, passports, escrow, events
    ├── storage/                      # SQLite persistence & event checkpointing
    │   └── db.ts
    └── tests/                        # Vitest test suites (contracts, indexer, API)
```

---

## Deployed Soroban Smart Contracts (Stellar Testnet)

All three contracts are actively deployed and verified on Stellar Testnet:

| Contract | Address | Source Path | Explorer Link |
|---|---|---|---|
| **Designer Registry** | `CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR` | `contracts/designer_registry/` | [Inspect on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CDUF5C2CNF3NFMMUOGCO74D2NFKCYUK6VVILPGXM5RDC7CDCGD3GJEHR) |
| **Product Passport Registry** | `CAJLI5PXVPQWOY4C2MCG7GII37IORAP4PL5AVX7GSOCUV6FH5FTW2E4U` | `contracts/product_passport/` | [Inspect on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CAJLI5PXVPQWOY4C2MCG7GII37IORAP4PL5AVX7GSOCUV6FH5FTW2E4U) |
| **Fashion Escrow** | `CBULSNLLBDACPNNNM4JB5NL2XB56QP6FVU7HHIOTNUXKUBSU4JHJGV5D` | `contracts/fashion_escrow/` | [Inspect on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBULSNLLBDACPNNNM4JB5NL2XB56QP6FVU7HHIOTNUXKUBSU4JHJGV5D) |

### Deployment Transaction Hashes

- **Deployer Account**: `GCCTT7IQVNIDYHAJXYGMUYGETJDYRVLCOMW2UGRWKVCUZ6I7CQY5ZWG4`
- **Designer Registry**:
  - Upload Tx: [`028ff1906ac272014d227745c9ffc060d214fe662467170c97b2285d5ba3ad45`](https://stellar.expert/explorer/testnet/tx/028ff1906ac272014d227745c9ffc060d214fe662467170c97b2285d5ba3ad45)
  - Deploy Tx: [`0d40e15e1b25f4576abe7f62ac85391ecd3440d2e9a6003036316220ce1f49c9`](https://stellar.expert/explorer/testnet/tx/0d40e15e1b25f4576abe7f62ac85391ecd3440d2e9a6003036316220ce1f49c9)
  - Seed Tx: [`dd6f2a601a486fe9c30acd45d1a955dfbbd0cbae40ebdc5850ee93ff223260f7`](https://stellar.expert/explorer/testnet/tx/dd6f2a601a486fe9c30acd45d1a955dfbbd0cbae40ebdc5850ee93ff223260f7)
- **Product Passport Registry**:
  - Upload Tx: [`98c594cad855fc7cf19a1a7f3381c1d8109ec91aac4660d122d926483f242de3`](https://stellar.expert/explorer/testnet/tx/98c594cad855fc7cf19a1a7f3381c1d8109ec91aac4660d122d926483f242de3)
  - Deploy Tx: [`4f3def7ddf7b3332ef79e7d3afaa2aae9d3988e5594bb3745e6bb6aba4e7dfee`](https://stellar.expert/explorer/testnet/tx/4f3def7ddf7b3332ef79e7d3afaa2aae9d3988e5594bb3745e6bb6aba4e7dfee)
  - Seed Tx: [`0df649fd2cff498e5ddc7372df3c04c047153095e97d0297b9f01ebdc0ce48e4`](https://stellar.expert/explorer/testnet/tx/0df649fd2cff498e5ddc7372df3c04c047153095e97d0297b9f01ebdc0ce48e4)
- **Fashion Escrow**:
  - Upload Tx: [`e0106fe1445cc8e5c7b67c9e8f5a0b331960a6ad6ff8e018dc9a5dc8a8f289f1`](https://stellar.expert/explorer/testnet/tx/e0106fe1445cc8e5c7b67c9e8f5a0b331960a6ad6ff8e018dc9a5dc8a8f289f1)
  - Deploy Tx: [`3140abdc4857088390d0dd7d421ed552aab84030ea0a9c4745490cc30786181a`](https://stellar.expert/explorer/testnet/tx/3140abdc4857088390d0dd7d421ed552aab84030ea0a9c4745490cc30786181a)

---

## Smart Contract Specifications

### 1. Designer Registry (`contracts/designer_registry`)
- **Purpose**: Registers sovereign fashion designers and ateliers on Stellar.
- **Key Methods**:
  - `register_designer(env, owner: Address, designer_id: String, brand_name: String, profile_uri: String)`
  - `update_profile(env, owner: Address, brand_name: String, profile_uri: String)`
  - `get_designer(env, owner: Address) -> DesignerRecord`
  - `has_designer(env, owner: Address) -> bool`
- **Events Emitted**: `("designer", "reg")`, `("designer", "updated")`
- **Security**: Strict `owner.require_auth()`. Rejects duplicate registrations or unauthorized updates.

### 2. Product Passport Registry (`contracts/product_passport`)
- **Purpose**: Issues immutable digital garment passports linked to cryptographic integrity hashes.
- **Key Methods**:
  - `create_passport(env, creator: Address, product_id: String, brand_id: String, metadata_uri: String, integrity_hash: BytesN<32>)`
  - `verify_integrity(env, product_id: String, expected_hash: BytesN<32>) -> bool`
  - `transfer_passport(env, current_owner: Address, new_owner: Address, product_id: String)`
  - `update_status(env, caller: Address, product_id: String, new_status: u32)`
  - `get_passport(env, product_id: String) -> ProductPassport`
- **Events Emitted**: `("passport", "created")`, `("passport", "transferred")`, `("passport", "status_updated")`
- **Security**: Creator authority enforced. Verifies exact SHA-256 byte digest matching.

### 3. Fashion Escrow (`contracts/fashion_escrow`)
- **Purpose**: Milestone and delivery escrow for B2B fashion wholesale & production runs.
- **Lifecycle**: `Created (1) -> Funded (2) -> Released (3) / Refunded (4) / Cancelled (5)`
- **Key Methods**:
  - `create_order(env, buyer: Address, seller: Address, order_id: String, token: Address, amount: i128)`
  - `fund_order(env, buyer: Address, order_id: String)` (invokes Soroban token client `transfer`)
  - `release_funds(env, caller: Address, order_id: String)` (buyer authorization releases funds to seller)
  - `refund_funds(env, caller: Address, order_id: String)` (seller authorization refunds funds back to buyer)
  - `cancel_unfunded(env, buyer: Address, order_id: String)`
  - `get_order(env, order_id: String) -> EscrowOrder`
- **Events Emitted**: `("escrow", "created")`, `("escrow", "funded")`, `("escrow", "released")`, `("escrow", "refunded")`
- **Security**: Zero administrative backdoors. Funds held exclusively by contract address.

---

## Event Indexing Service & Recovery Process

The background event indexer (`src/indexer/eventIndexer.ts`):
1. Polls Soroban RPC `getEvents` for topic filters matching the three deployed contracts.
2. Extracts event topics, parses ScVals into typed payloads, and deduplicates via `(contract_id, ledger, tx_hash)`.
3. Persists events into the local database (`storage/db.ts`).
4. Updates the ledger checkpoint cursor (`checkpoint_ledger`), ensuring seamless recovery after service restarts.
5. Broadcasts real-time events to connected clients via Server-Sent Events (SSE) at `GET /api/v1/events/stream`.

---

## REST & SSE API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health telemetry and Stellar Horizon ledger status |
| `/api/v1/network` | GET | Active network parameters & contract addresses |
| `/api/v1/designers` | GET | List registered fashion designers & contracts |
| `/api/v1/designers/prepare-register` | POST | Validate & prepare designer registration payload |
| `/api/v1/passports` | GET | List digital product passports |
| `/api/v1/passports/verify` | POST | Verify SHA-256 metadata hash match |
| `/api/v1/escrow/orders` | GET | List B2B escrow orders and lifecycle states |
| `/api/v1/events` | GET | Query indexed Soroban contract events with pagination |
| `/api/v1/events/stream` | GET | Server-Sent Events (SSE) stream for real-time frontend updates |
| `/api/v1/indexer/status` | GET | Health, sync state, and latest ingested ledger |

---

## Local Development & Testing

### 1. Build & Test Rust Contracts
```bash
cargo test --manifest-path contracts/Cargo.toml
```

### 2. Compile WASM Binaries
```bash
node scripts/build-contracts.cjs
```

### 3. Run Backend Test Suite
```bash
npm test
```

### 4. Run TypeScript Check & Linter
```bash
npm run typecheck
npm run lint
```

### 5. Start Backend Server
```bash
npm run dev
```

---

## Security Assumptions & Limitations

- **Cryptographic vs. Physical Authenticity:** On-chain digital passports guarantee record immutability and brand authorship matching the SHA-256 hash. They do not replace physical garment inspection without cryptographically secured physical NFC tags.
- **Audit Status:** Contracts are covered by extensive automated unit and integration tests, but have **not** undergone a third-party security firm audit.
- **Network Scope:** Configured exclusively for Stellar Testnet.

---

## License

Licensed under the [Apache-2.0 License](LICENSE).
