# Frequently Asked Questions (FAQ)

### How are gas fees handled?
Stellar base fees are minimal (100 Stroops / 0.00001 XLM). Even under surge conditions, invocations cost less than a fraction of a cent.

### What happens if an atelier goes bankrupt during production?
The `fashion_escrow` contract allows buyers to claim automatic refunds once milestone dispute timeouts elapse.

### How does the physical NFC chip link to Soroban?
Each NFC chip contains a read-only NDEF record bearing the product SKU and a SHA-256 cryptographic digest matching the on-chain passport.
