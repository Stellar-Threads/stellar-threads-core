# Fashion Trade Escrow Lifecycle Specification

Detailed state machine specification for B2B fashion trade contracts on Stellar Soroban.

```mermaid
stateDiagram-v2
    [*] --> Created: Buyer initiates order
    Created --> Funded: Buyer deposits payment
    Created --> Cancelled: Cancel before funding
    Funded --> Inspection: Milestone progress
    Inspection --> Released: Buyer confirms delivery / Inspector passes
    Inspection --> Disputed: Quality failure / Timeout
    Disputed --> Released: Arbitrator compromise verdict
    Disputed --> Refunded: Full buyer refund
    Released --> [*]
    Refunded --> [*]
    Cancelled --> [*]
```

## Lifecycle States:
- **Created**: Order established with agreed price, token, and order reference.
- **Funded**: Escrow funds securely locked inside the contract.
- **Released**: Production verified; funds disbursed to fashion atelier.
- **Refunded**: Buyer refunded due to mutual agreement, dispute, or timeout.
- **Cancelled**: Order cancelled before any funds were deposited.
