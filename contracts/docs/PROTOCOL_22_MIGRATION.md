# Soroban Protocol 22 Migration & Storage Rent Guide

This document details the architectural adaptations implemented in **Stellar Threads** to leverage **Soroban Protocol 22** on Stellar Testnet.

---

## 1. Automated Persistent Storage TTL Bumping

Under Protocol 22, contract state entries must maintain active TTL to avoid archival. Stellar Threads enforces automated extension:

```rust
const PERSISTENT_BUMP_AMOUNT: u32 = 3_110_400; // ~6 months (assuming ~5s ledger close)
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 100_000;

env.storage().persistent().extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);
```

## 2. Native Host Crypto Primitives

- **SHA-256 Digest Verification**: Verifies physical garment NFC chip hashes against immutable ledger entries.
- **Ed25519 Signature Verification**: Validates luxury atelier credentials and auditor co-signatures.

## 3. Storage Tier Architecture

- **Instance Storage**: Administrator public key, contract pause status, and global registered designer counters.
- **Persistent Storage**: Escrow agreements, product passports, atelier profiles, and financing proposals.
