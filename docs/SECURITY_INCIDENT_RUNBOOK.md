# Security Incident Response Runbook

## Protocol Emergency Pause Procedure
```bash
# 1. Trigger global contract pause switch
stellar contract invoke \
  --id <FASHION_ESCROW_CONTRACT_ID> \
  --source <ADMIN_SECRET> \
  --network testnet \
  -- pause

# 2. Verify paused state on-chain
stellar contract invoke \
  --id <FASHION_ESCROW_CONTRACT_ID> \
  --network testnet \
  -- is_paused
```
