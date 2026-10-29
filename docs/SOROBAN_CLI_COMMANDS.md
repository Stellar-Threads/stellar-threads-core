# Soroban CLI Commands Cheatsheet

```bash
# Initialize Fashion Escrow Order
stellar contract invoke --id <CONTRACT_ID> --source <BUYER_KEY> --network testnet -- \
  create_order --order_id 101 --seller <ATELIER_KEY> --token <SAC_TOKEN> --amount 1000000000 --inspector <LAB_KEY>

# Check Solvency & Paused State
stellar contract invoke --id <CONTRACT_ID> --network testnet -- is_paused
```
