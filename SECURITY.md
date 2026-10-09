# Security Policy — Stellar Threads Core

## Security Model & Protocol Principles

The Stellar Threads protocol connects fashion ateliers, brands, retailers, and suppliers. Protecting user assets, cryptographic provenance, and contract invariants is fundamental.

### 1. Smart Contract Authorization
- All state-modifying Soroban contract functions (`register_designer`, `update_profile`, `create_passport`, `fund_order`, `release_funds`, `refund_funds`, `cancel_unfunded`) enforce cryptographic account authorization (`caller.require_auth()`) directly on-chain.
- The contracts contain **zero** arbitrary administrative backdoors, master withdrawal keys, or privileged emergency drain mechanisms.
- Escrow funds are held exclusively under contract control and can only be transferred to the agreed seller upon buyer release, or returned to the buyer upon seller refund/buyer timeout.

### 2. Off-Chain Data Privacy & Input Sanitization
- Personally identifiable information (PII) is intentionally kept off-chain.
- The protocol records only content identifiers (IPFS CIDs / URIs) and SHA-256 integrity digests on-chain.
- All backend REST API endpoints sanitize and validate inputs using strict JSON schemas before transaction preparation.

### 3. Signing Authority & Secrets Management
- Signing authority remains exclusively with the client-side wallet. The backend server never handles or stores private keys or mnemonic seed phrases.
- CI/CD build environments and automated test pipelines run in isolated sandboxes without access to mainnet accounts.

---

## Known Limitations & Security Assumptions

- **Physical-to-Digital Authenticity:** Digital Product Passports cryptographically prove that a record was authorized by a registered brand and has not been altered since its creation. An on-chain passport does not automatically prove physical authenticity of a physical garment without trusted manufacturer provenance or cryptographic NFC tag pairing.
- **Audit Status:** These Soroban smart contracts have undergone extensive automated unit, integration, and fuzz testing, but **have not undergone an independent third-party cryptographic audit**. They are deployed to Stellar Testnet for testing and evaluation purposes.

---

## Reporting a Vulnerability

If you discover a potential vulnerability in Stellar Threads smart contracts, backend endpoints, or indexing services:

1. **Do not disclose it publicly** via GitHub Issues or public forums.
2. Submit a confidential report via GitHub **Private Vulnerability Reporting** or email `security@stellar-threads.org`.
3. Provide detailed steps to reproduce the vulnerability, including contract addresses, transaction parameters, or proof of concept code.
4. The core maintainers will acknowledge receipt within 24 hours and provide an estimated remediation timeline.
