# Hackathon Evaluator Quickstart Guide

## Step 1: Instant Local Launch
```bash
# Backend Core Service (Port 3001)
cd stellar-threads-core
npm install && npm start

# Frontend dApp Portal (Port 3000)
cd ../stellar-threads-frontend
npm install && npm run dev
```

## Step 2: Instant Testnet Account Funding
1. Navigate to `http://localhost:3000`.
2. Click **Friendbot Faucet** in the upper status bar.
3. Submit your Freighter public key (`G...`) to instantly receive 10,000 Testnet XLM.

## Step 3: Run Master Test Verification
```bash
# Executes 29 Rust contract tests + 64 backend Vitest tests
node tools/run-all-tests.cjs
```
