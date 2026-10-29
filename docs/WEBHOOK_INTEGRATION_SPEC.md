# ERP Webhook Integration Specification (SAP, NetSuite, Shopify)

## Overview
Stellar Threads backend dispatches authenticated HTTP POST webhooks when contract states progress on the Stellar ledger.

## Event Payloads
### `escrow.milestone_reached`
```json
{
  "event": "escrow.milestone_reached",
  "orderId": 101,
  "stage": 3,
  "stageName": "InspectionPassed",
  "releasedStroops": "250000000",
  "txHash": "5a4b7dc8...",
  "timestamp": "2026-10-29T12:00:00Z"
}
```

## Cryptographic Signature Verification
Every webhook includes the `X-Stellar-Signature` header containing an HMAC-SHA256 signature generated using the shared webhook secret.
