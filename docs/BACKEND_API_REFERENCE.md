# Stellar Threads Backend API Reference (v1.0.0)

## Overview
Comprehensive HTTP reference for the Stellar Threads Core service powering the B2B fashion protocol on Stellar Soroban.

## Base URL
```
http://localhost:3001/api/v1
```

## Endpoints

### 1. Observability
- **`GET /health`**: Checks Horizon connection, Protocol 22 status, and uptime.
- **`GET /metrics`**: Prometheus text format exporter for alert scrapers.

### 2. Analytics & Financing
- **`GET /analytics/overview`**: Returns active escrow volume, TVL, and default rates.
- **`POST /financing/calculate-roi`**:
  - Request: `{ "principalStroops": "100000000", "yieldBps": 1000, "durationDays": 365 }`
  - Response: `{ "estimatedYieldStroops": "10000000", "effectiveApyPercent": "10.00" }`

### 3. Fashion Escrow
- **`GET /escrow/orders`**: List all active fashion escrow agreements.
- **`POST /escrow/orders/:orderId/dispute`**: File an inspection dispute with requested refund basis points.

### 4. Product Passports
- **`GET /passports/qr/:productId`**: Obtain verification QR target and NFC scan payload.
- **`POST /passports/verify`**: Cryptographic verification of NFC digital physical twin hash.

### 5. Event Streaming
- **`GET /events/stream`**: Real-time Server-Sent Events (SSE) ledger notification channel.
