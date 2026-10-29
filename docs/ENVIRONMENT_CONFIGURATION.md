# Environment Variables Configuration Reference

## Core Protocol Settings
| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `3001` | Port number for Express REST & SSE server |
| `NODE_ENV` | `development` | Node execution environment (`development` / `production`) |
| `STELLAR_NETWORK` | `testnet` | Stellar network passphrase identifier |
| `SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | Official SDF Soroban JSON-RPC node |
| `HORIZON_URL` | `https://horizon-testnet.stellar.org` | Horizon REST ingress for payment lookups |
| `SOROBAN_RPC_FALLBACK_POOL` | (secondary SDF endpoints) | Comma-delimited list of fallback RPC endpoints |
