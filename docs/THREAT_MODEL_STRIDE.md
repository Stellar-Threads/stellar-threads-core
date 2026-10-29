# Formal STRIDE Threat Model — Stellar Threads Smart Contracts

| Threat Category | Potential Attack Vector | Soroban Mitigation |
|---|---|---|
| **Spoofing** | Unauthorized user impersonating atelier or inspector | `Address::require_auth()` enforced on all state-modifying entrypoints |
| **Tampering** | Counterfeit garments claiming authentic digital passport | SHA-256 physical NFC digest stored immutably on-chain |
| **Repudiation** | Atelier denying receipt of milestone financing | On-chain ledger event emissions with sequence and ledger numbers |
| **Information Disclosure** | Leakage of proprietary textile weaving formulas | Off-chain IPFS storage; only zero-knowledge hashes anchored |
| **Denial of Service** | State eviction through expired storage rent | Protocol 22 proactive TTL bumping on instance and persistent records |
| **Elevation of Privilege** | Arbitrary parameter manipulation or escrow draining | Two-step ownership transfers (`propose_admin` / `claim_admin`) |
