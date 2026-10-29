# Soroban Smart Contract Security Checklist

- [x] **Auth Invariance**: Every state modification calls `require_auth()` on caller.
- [x] **Zero Floats**: 100% integer math; zero fractional rounding deficits.
- [x] **Reentrancy Protection**: State updates precede external token disbursements.
- [x] **Storage Rent Auto-Bumps**: Instance and persistent storage bumped to 518,400 ledgers.
- [x] **Integer Dust Floor**: Dust remainders attributed to primary payee.
- [x] **Emergency Pauses**: Global pause switch stops fund draining during anomalies.
- [x] **Two-Step Admin Transfer**: Propose & claim transfer pattern blocks accidental key lockouts.
