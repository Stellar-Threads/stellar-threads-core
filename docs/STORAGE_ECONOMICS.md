# Soroban Storage Economics & Fee Estimations

Analysis of on-ledger storage costs and rent economics for **Stellar Threads** on Stellar Testnet and Mainnet.

---

## 1. Storage Footprint Per Entity

| Entity | Storage Type | Typical Size | Rent Cost (Stroops / 100k ledgers) |
|:---|:---|:---|:---|
| Escrow Order | Persistent | ~350 bytes | ~1,750 Stroops |
| Designer Record | Persistent | ~480 bytes | ~2,400 Stroops |
| Product Passport | Persistent | ~520 bytes | ~2,600 Stroops |
| Financing Proposal | Persistent | ~600 bytes | ~3,000 Stroops |
| Admin Governance | Instance | ~120 bytes | ~600 Stroops |

## 2. Rent Optimization Strategy

1. **Compact String Keys**: Uses compact symbols (`symbol_short!`) for event topics and storage keys.
2. **Saturating Arithmetic**: Eliminates oversized allocation buffers.
3. **Automated Bumping**: Bumps only active records, leaving historical completed orders to naturally age out or be archived.
