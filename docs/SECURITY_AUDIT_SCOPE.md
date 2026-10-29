# Security Audit Scope & Threat Mitigations

This document outlines the security architecture and attack surface mitigations across all four Soroban contracts.

---

## 1. Access Control Matrix

| Contract | Method | Required Auth | Role Guard |
|:---|:---|:---|:---|
| `fashion_escrow` | `create_order` | `buyer` | Buyer authorization required |
| `fashion_escrow` | `fund_order` | `buyer` | Only buyer can deposit escrow |
| `fashion_escrow` | `release_funds` | `buyer` | Buyer confirms quality before release |
| `fashion_escrow` | `resolve_dispute` | `arbitrator` | Certified dispute arbitrator |
| `fashion_escrow` | `set_paused` | `admin` | Emergency pause toggle |
| `designer_registry` | `register_designer` | `designer` | Atelier address verification |
| `product_passport` | `transfer_passport` | `current_owner` | Cryptographic ownership proof |
| `production_financing` | `contribute_funds` | `contributor` | Backer wallet signature |

## 2. Threat Vector Mitigations

1. **Reentrancy**: State is updated *prior* to token transfers (checks-effects-interactions pattern).
2. **Dust Attacks**: Minimum escrow threshold of 10,000,000 Stroops (1 XLM) rejects zero-value spam.
3. **Double Spend**: Unique order and passport IDs prevent duplicate initialization.
4. **State Loss**: Protocol 22 persistent TTL bumping prevents contract state eviction.
