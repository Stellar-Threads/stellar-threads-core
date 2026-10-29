# Disaster Recovery Runbook: Soroban RPC Failover

## Overview
Stellar Threads backend maintains an automated active-passive and round-robin multi-RPC cluster to guarantee zero downtime during Horizon or Soroban RPC ledger ingestion delays.

## Topology
1. **Primary Node**: `https://soroban-testnet.stellar.org` (Official SDF Testnet RPC)
2. **Secondary Node**: `https://testnet.stellar.org/soroban/rpc` (Fallback ingress)
3. **Tertiary Node**: `https://horizon-testnet.stellar.org` (Horizon REST fallover)

## Circuit Breaker Behavior
- **Failure Threshold**: 5 consecutive errors within 30 seconds triggers the `OPEN` state.
- **Recovery Half-Open**: After 5000ms cooldown, a single synthetic ping ledger test is dispatched.
- **Auto-Reset**: Successful response closes breaker and restores primary routing.

## Manual Failover Procedure
```bash
# 1. Force RPC rotation via environment variable
export SOROBAN_RPC_FALLBACK_POOL="https://testnet.stellar.org/soroban/rpc"

# 2. Verify health probe status
curl -i http://localhost:3001/api/v1/health

# 3. Check Prometheus metrics state
curl -s http://localhost:3001/metrics | grep stellar_threads_rpc_circuit_state
```
