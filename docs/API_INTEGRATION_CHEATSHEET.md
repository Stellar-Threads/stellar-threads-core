# API Integration Cheatsheet & Curl Examples

```bash
# 1. Health Probe
curl -s http://localhost:3001/api/v1/health | jq

# 2. Factoring ROI Calculation
curl -s -X POST http://localhost:3001/api/v1/financing/calculate-roi \
  -H "Content-Type: application/json" \
  -d '{"principalStroops": "100000000", "yieldBps": 850, "durationDays": 180}' | jq

# 3. Passport QR Lookup
curl -s http://localhost:3001/api/v1/passports/qr/PARIS-FW26-001 | jq
```
