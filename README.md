# Stellar Threads — Core Protocol & Backend Foundation

> **From design to ownership, powered by Stellar.**

[![Core CI](https://github.com/Stellar-Threads/stellar-threads-core/actions/workflows/ci.yml/badge.svg)](https://github.com/Stellar-Threads/stellar-threads-core/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Stellar Network](https://img.shields.io/badge/Network-Stellar_Testnet-gold.svg)](https://stellar.expert/explorer/testnet)

Stellar Threads Core provides the protocol-level backend infrastructure, shared domain types, transaction validation rules, database event-indexing schema, and Soroban smart-contract foundation for the Stellar Threads fashion finance protocol.

---

## Ecosystem Relationship

Stellar Threads is maintained across two official repositories within the [`Stellar-Threads`](https://github.com/Stellar-Threads) organization:

1. **[`stellar-threads-frontend`](https://github.com/Stellar-Threads/stellar-threads-frontend)**: Web application client, Freighter wallet connector, and native XLM transaction user interface.
2. **`stellar-threads-core` (This Repository)**: Backend service APIs, shared types, transaction validation, database schemas, and Soroban contract workspace.

---

## Key Modules & Responsibilities

### 1. Backend Service APIs (`src/`)

- **Live Horizon Health Check (`GET /health`)**: Verifies service status, process uptime, and actively pings Stellar Testnet Horizon (`https://horizon-testnet.stellar.org`) reporting current ledger sequence and protocol version.
- **Network Configuration (`GET /api/v1/network`)**: Centralized, type-safe distribution of validated Stellar Testnet endpoints and parameters.
- **Protocol Metadata (`GET /api/v1/protocol`)**: Documents active vs. upcoming protocol modules.
- **Validation Endpoints (`POST /api/v1/validate/address`, `POST /api/v1/validate/payment`)**: Server-side validation of Stellar public keys (`StrKey` Ed25519 checksums), precision bounds (7 decimal stroops), and memo constraints.

### 2. Shared Protocol Types & Utilities (`src/types/`, `src/utils/`)

- **`fashion.ts`**: Types modeling sovereign designer identities, digital product passports (DPPs), textile composition, lifecycle stages, and production escrows.
- **`network.ts`**: Centralized Stellar Testnet network configuration and health telemetry types.
- **`validation.ts`**: Reusable validation utilities for address checksums, stroop precision limits, and memo byte constraints.

### 3. Database & Event-Indexing Foundation (`prisma/`)

- Models the complete lifecycle of decentralized fashion commerce:
  - `Designer`: Sovereign atelier records, public keys, and verification status.
  - `ProductPassport`: RFID/NFC-linked digital garment twins, batch size, and textile composition.
  - `ProductionEscrow`: Milestone-based production agreements between brands and manufacturers.
  - `PaymentAuditRecord`: On-chain settlement transaction history.

### 4. Soroban Smart Contracts Foundation (`contracts/`)

- **`fashion_escrow` (`contracts/fashion_escrow/`)**: Soroban SDK contract foundation implementing the milestone-based escrow lifecycle (`initialize`, `get_config`, auth enforcement, error codes).
- **`designer_registry` (`contracts/designer_registry/`)**: Soroban SDK contract foundation for sovereign designer identity registration on-chain.
- **Stage 2 Notice**: This stage provides the validated Rust contract structure, interfaces, and workspace configuration. Actual on-chain Soroban deployment and contract addresses will be introduced in subsequent protocol stages. No fabricated contract addresses or synthetic deployment evidence are used.

---

## Getting Started

### Prerequisites

- Node.js `20.x` or later
- npm `10.x` or later
- Rust & Cargo (with `wasm32-unknown-unknown` target for Soroban contract compilation)

### Installation

```bash
git clone https://github.com/Stellar-Threads/stellar-threads-core.git
cd stellar-threads-core
npm install
```

### Environment Configuration

```bash
cp .env.example .env
```

### Running the Service

```bash
# Start with live reload
npm run dev

# Run type check
npm run typecheck

# Run automated backend test suite
npm test

# Build production bundle
npm run build
npm start
```

### Contract Tooling

```bash
# Verify Soroban contract workspace
cargo check --manifest-path contracts/Cargo.toml
```

---

## API Contract Reference

### `GET /health`
Returns service status and active Stellar Testnet Horizon health:
```json
{
  "success": true,
  "data": {
    "service": "stellar-threads-core",
    "version": "1.0.0-alpha",
    "uptimeSeconds": 42,
    "environment": "development",
    "stellar": {
      "status": "healthy",
      "network": "testnet",
      "horizonConnected": true,
      "latestLedger": 583921,
      "protocolVersion": 22,
      "responseTimeMs": 142
    }
  }
}
```

### `POST /api/v1/validate/address`
Validates a Stellar public address:
```json
// Request
{ "address": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" }

// Response
{
  "success": true,
  "data": {
    "address": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    "isValid": true
  }
}
```

---

## Community & Contribution

- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and taxonomy.
- Review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards.
- Review [SECURITY.md](SECURITY.md) for vulnerability disclosure procedures.

---

## License

Stellar Threads Core is licensed under the [Apache-2.0 License](LICENSE).
