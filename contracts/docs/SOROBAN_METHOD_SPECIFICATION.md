# Soroban Contract Method Specification

Comprehensive API specification for all deployed Stellar Threads smart contracts.

---

## 1. Fashion Escrow Contract (`fashion_escrow`)
- `create_order(env, order_id, buyer, seller, token, amount, order_ref) -> Result<(), EscrowError>`
- `fund_order(env, order_id) -> Result<(), EscrowError>`
- `release_funds(env, order_id) -> Result<(), EscrowError>`
- `refund_funds(env, order_id) -> Result<(), EscrowError>`
- `cancel_unfunded(env, order_id) -> Result<(), EscrowError>`
- `resolve_dispute(env, order_id, arbitrator, buyer_refund_bps) -> Result<(), EscrowError>`
- `settle_partial_agreement(env, order_id, release_amount) -> Result<(), EscrowError>`
- `attest_inspection(env, order_id, inspector, verdict) -> Result<(), EscrowError>`
- `claim_timeout_refund(env, order_id, timeout_secs) -> Result<(), EscrowError>`
- `get_order(env, order_id) -> Result<EscrowOrder, EscrowError>`
- `is_paused(env) -> bool`

## 2. Designer Registry Contract (`designer_registry`)
- `register_designer(env, designer, brand_name, atelier_location, metadata_uri) -> Result<(), RegistryError>`
- `update_profile(env, designer, brand_name, atelier_location, metadata_uri) -> Result<(), RegistryError>`
- `update_tier(env, designer, new_tier) -> Result<(), RegistryError>`
- `update_sustainability(env, designer, score, cert_hash) -> Result<(), RegistryError>`
- `record_fulfillment(env, designer) -> Result<u32, RegistryError>`
- `get_designer(env, designer) -> Result<DesignerRecord, RegistryError>`
- `get_total_designers(env) -> u32`

## 3. Product Passport Contract (`product_passport`)
- `create_passport(env, creator, product_id, brand_name, product_name, metadata_uri, integrity_hash, total_edition) -> Result<(), PassportError>`
- `verify_physical_twin(env, product_id, chip_hash) -> Result<bool, PassportError>`
- `transfer_passport(env, product_id, current_owner, new_owner) -> Result<(), PassportError>`
- `mark_circular_state(env, product_id, current_owner, circular_state) -> Result<(), PassportError>`
- `update_provenance(env, product_id, origin_country, material_composition) -> Result<(), PassportError>`
- `get_royalty_bps(env, product_id) -> Result<u32, PassportError>`
- `get_passport(env, product_id) -> Result<ProductPassportRecord, PassportError>`

## 4. Production Financing Contract (`production_financing`)
- `create_proposal(env, applicant, proposal_id, token, target_amount, min_threshold, deadline, repayment_target, purpose, metadata_uri) -> Result<(), FinancingError>`
- `contribute_funds(env, contributor, proposal_id, amount) -> Result<(), FinancingError>`
- `release_funds(env, caller, proposal_id) -> Result<(), FinancingError>`
- `disburse_tranche(env, caller, proposal_id, tranche_bps) -> Result<i128, FinancingError>`
- `make_repayment(env, payer, proposal_id, amount) -> Result<(), FinancingError>`
- `claim_repayment_share(env, contributor, proposal_id) -> Result<i128, FinancingError>`
- `claim_expired_campaign_refund(env, contributor, proposal_id) -> Result<i128, FinancingError>`
- `transfer_claim_right(env, from, to, proposal_id, transfer_amount) -> Result<(), FinancingError>`
- `calculate_factoring_yield(principal, yield_bps, duration_days) -> Result<i128, FinancingError>`
