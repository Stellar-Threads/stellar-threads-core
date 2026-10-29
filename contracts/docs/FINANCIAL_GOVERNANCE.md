# Financial Governance & Economic Architecture

This document specifies the financial governance invariants and treasury mechanics of **Stellar Threads**.

---

## 1. Capital Protection Rules

1. **Non-Custodial Escrow**: Funds are held directly by the Soroban smart contract instance address. No developer or administrator key possesses withdrawal privileges.
2. **Floor Escrow Limits**: Escrow creation requires a minimum value of 10,000,000 Stroops (1 XLM / SAC USDC).
3. **Zero-Deficit Conservation**: All payouts, fee splits, and factoring returns conserve the exact integer balance down to the Stroop.

## 2. Repayment Waterfall

In production financing factoring, repayments flow through a strict seniority schedule:
1. **Principal Liquidity Recovery**: Contributors receive pro-rata returns of original principal.
2. **Factoring Yield**: Accrued yield distributed proportionally based on contribution weights.
3. **Atelier Equity**: Excess revenues return to the fashion atelier.
