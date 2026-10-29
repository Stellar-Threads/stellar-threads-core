# Dynamic Fee & Sequence Bumping Strategy

## Base Fee Mechanism
On Stellar, every operation incurs a minimal base fee of 100 Stroops (0.00001 XLM). Under normal ledger conditions, this guarantees prompt inclusion.

## Surge Pricing Mitigation
When network transaction volume spikes:
1. **Dynamic Bid Multiplier**: Transactions bid between 100 and 500 Stroops based on recent ledger capacity.
2. **Channel Account Isolation**: Prevents high-priority escrow milestones from failing due to sequence de-sync.
