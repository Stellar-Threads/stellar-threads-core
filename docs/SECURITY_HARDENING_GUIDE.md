# OWASP Top 10 Security Hardening Guide — Stellar Threads

## 1. Injection Prevention
- All user-supplied parameters are validated through strict Zod schemas and stripped of script tags via `sanitizeString`.
- SQL queries utilize parameterized statements through Prisma ORM.

## 2. Broken Authentication & Session Management
- Decentralized authentication powered by Stellar public-key Ed25519 cryptographic signatures.
- Zero server-side private key storage; transactions signed client-side via Freighter or Lobster.

## 3. Cryptographic Failures
- SHA-256 digests verify garment digital twin physical integrity.
- TLS 1.3 enforced across all API endpoints with strict HSTS (`max-age=31536000`).

## 4. Security Misconfiguration
- Helmet middleware sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and restrictive Permissions-Policy.
