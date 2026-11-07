# ⚖️ Stellar Threads — Proof-of-Reserve & Solvency Architecture

> **Institutional-grade cryptographic reserve verification and real-time solvency auditing for decentralized luxury fashion finance on Stellar Soroban Protocol 22.**

---

## 1. Executive Summary

Stellar Threads enforces a non-negotiable protocol invariant: **100% full-reserve backing at all times**.

Unlike fractional-reserve platforms or opaque off-chain credit intermediaries, every Stroop deposited into **Stellar Threads** escrow orders or invoice factoring liquidity pools is locked directly within Soroban smart contract instances on the Stellar network. The autonomous **Solvency Auditor** continuously reconciles on-chain contract vault balances against off-chain order books and creditor commitments.

---

## 2. Core Invariants & Mathematical Proofs

### 2.1 The Global Reserve Invariant

For all ledgers $L$, the total verifiable on-chain vault reserves must equal or exceed total protocol liabilities:

$$\text{VaultReserves}(L) \ge \text{TotalLiabilities}(L)$$

Where:
- $\text{VaultReserves}(L) = \sum \text{Balance}(\text{Contract}_{\text{escrow}}) + \sum \text{Balance}(\text{Contract}_{\text{financing}})$
- $\text{TotalLiabilities}(L) = \sum \text{ActiveOrders}(\text{funded}) + \sum \text{ContributorClaims}(\text{unclaimed})$

### 2.2 Reserve Ratio Calculation

$$\text{ReserveRatio} = \begin{cases} 100.00\% & \text{if } \text{TotalLiabilities} = 0 \\ \left(\frac{\text{VaultReserves}}{\text{TotalLiabilities}}\right) \times 100 & \text{if } \text{TotalLiabilities} > 0 \end{cases}$$

If $\text{ReserveRatio} < 100.00\%$, the `SolvencyAuditor` trips an automated alert and signals the circuit breaker mechanism.

### 2.3 Zero-Deficit 10,000 Basis Points (BPS) Arithmetic

All payouts and distributions are calculated exclusively in 64-bit integer Stroops ($1 \text{ XLM} = 10,000,000 \text{ Stroops}$) using 10,000 basis points:

$$\text{Disbursement}_i = \left\lfloor \frac{\text{TotalAmount} \times \text{BPS}_i}{10,000} \right\rfloor$$

Any fractional remainder (dust) is preserved and attributed directly to the primary recipient or retained in the vault, guaranteeing that:

$$\sum \text{Disbursements} + \text{Dust} \equiv \text{TotalDeposited}$$

---

## 3. Autonomous Solvency Auditor

The protocol runs an autonomous auditing service located at `src/services/solvencyAudit.ts`:

```typescript
export interface SolvencyAuditReport {
  timestamp: string;
  isSolvent: boolean;
  totalVaultReservesStroops: string;
  totalLiabilitiesStroops: string;
  surplusStroops: string;
  reserveRatioPercent: string;
}
```

### Telemetry & Monitoring Endpoints

- **`GET /api/v1/health`**: Returns real-time Horizon sync status, ledger sequence, and protocol health.
- **`GET /api/v1/analytics/overview`**: Exposes protocol Total Value Locked (TVL), verified garment twin counts, and current reserve ratio.
- **`GET /metrics`**: Exposes Prometheus-formatted metrics including `stellar_threads_solvency_ratio` and `stellar_threads_vault_reserves_stroops`.

---

## 4. Disaster Recovery & Circuit Breakers

In the event of an anomalous reserve discrepancy or upstream RPC inconsistency:
1. **Automated Pausing**: Smart contracts feature emergency pause switches (`pause()` / `resume()`) callable only by multi-sig administrative quorum.
2. **Read-Only Failover**: During paused states, user funds remain safely non-custodial; new orders and tranche disbursements are blocked until full solvency is certified.
3. **RPC Rotation**: `RpcCircuitBreaker` dynamically shifts traffic away from failing Horizon/Soroban endpoints with exponential backoff.
