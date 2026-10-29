# Chaos Engineering Report: Network Partition & RPC Resilience

## Objectives
Validate system behavior under adverse networking conditions on Stellar Testnet:
1. Primary Horizon outage
2. Soroban RPC rate limiting (HTTP 429)
3. Node disconnection and timeout spikes

## Test Scenarios & Results
- **Scenario 1: Primary RPC Partition**
  - Breaker threshold: 5 consecutive failures
  - Result: Rotated to secondary node within 12ms. Zero client transaction loss.
- **Scenario 2: Sequence Number Contention**
  - Concurrency: 50 simultaneous escrow transactions
  - Result: Channel manager isolated sequence numbers across 4 channels. 100% inclusion rate without `txBAD_SEQ`.
- **Scenario 3: Half-Open Breaker Recovery**
  - After 5000ms cooldown, synthetic probe verified ledger height. Circuit closed cleanly.
