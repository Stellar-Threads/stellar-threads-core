# Error Codes Catalog — Stellar Threads

## Smart Contract Errors (Soroban)
- **`OrderNotFound (#1)`**: Specified fashion order does not exist in ledger storage.
- **`OrderAlreadyFunded (#2)`**: Buyer attempted to fund an already active escrow.
- **`Unauthorized (#3)`**: Sender address lacks required role or permission.
- **`InvalidStateTransition (#4)`**: Milestone sequence violation (e.g. attempting settlement before inspection).
- **`BelowMinimumEscrow (#13)`**: Order amount is below the 10,000,000 Stroop floor.
- **`ContractPaused (#15)`**: Operation halted by emergency circuit breaker.

## REST API Errors
- **`INVALID_PAYLOAD (400)`**: Missing or malformed parameters.
- **`NOT_FOUND (404)`**: Requested resource or contract entity missing.
- **`CIRCUIT_BREAKER_OPEN (503)`**: Soroban RPC pool temporarily unreachable.
