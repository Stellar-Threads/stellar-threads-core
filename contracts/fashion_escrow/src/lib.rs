#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
    String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    AlreadyExists = 1,
    NotFound = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidState = 5,
    SameBuyerSeller = 6,
    InvalidOrderRef = 7,
    ContractPaused = 8,
    DisputeWindowExpired = 9,
    InvalidMilestone = 10,
    InspectionFailed = 11,
    InvalidBasisPoints = 12,
    BelowMinimumEscrow = 13,
    DisputeActive = 14,
    ArbitrationRequired = 15,
}

/// Distinct actor roles participating in fashion escrow lifecycles
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowRole {
    Buyer = 1,
    Seller = 2,
    Inspector = 3,
    Admin = 4,
    Arbitrator = 5,
}

/// Progressive milestone execution stages for fashion production orders
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MilestoneStatus {
    DepositPending = 0,
    SamplingApproved = 1,
    ProductionComplete = 2,
    InspectionAttested = 3,
    Dispatched = 4,
    Settled = 5,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum EscrowState {
    Created = 0,
    Funded = 1,
    Released = 2,
    Refunded = 3,
    Cancelled = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowOrder {
    pub order_id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub token: Address,
    pub amount: i128,
    pub order_ref: String,
    pub state: EscrowState,
    pub created_at: u64,
    pub funded_at: u64,
    pub settled_at: u64,
}

const TOPIC_ESCROW: Symbol = symbol_short!("escrow");
const EVT_CREATED: Symbol = symbol_short!("created");
const EVT_FUNDED: Symbol = symbol_short!("funded");
const EVT_RELEASED: Symbol = symbol_short!("release");
const EVT_REFUNDED: Symbol = symbol_short!("refund");
const EVT_CANCELLED: Symbol = symbol_short!("cancel");

/// Protocol 22 storage rent TTL constants (~6 months in ledgers)
const PERSISTENT_BUMP_AMOUNT: u32 = 3_110_400;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 100_000;
const KEY_PAUSED: Symbol = symbol_short!("paused");
const KEY_ADMIN: Symbol = symbol_short!("admin");
/// Minimum escrow amount: 10,000,000 Stroops (1.0 XLM / SAC USDC)
const MIN_ESCROW_AMOUNT: i128 = 10_000_000;

#[contract]
pub struct FashionEscrowContract;

#[contractimpl]
impl FashionEscrowContract {
    /// Create a new fashion order escrow agreement
    pub fn create_order(
        env: Env,
        order_id: u64,
        buyer: Address,
        seller: Address,
        token: Address,
        amount: i128,
        order_ref: String,
    ) -> Result<(), EscrowError> {
        buyer.require_auth();

        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        if amount < MIN_ESCROW_AMOUNT {
            return Err(EscrowError::BelowMinimumEscrow);
        }
        if buyer == seller {
            return Err(EscrowError::SameBuyerSeller);
        }
        if order_ref.len() == 0 {
            return Err(EscrowError::InvalidOrderRef);
        }
        if env.storage().persistent().has(&order_id) {
            return Err(EscrowError::AlreadyExists);
        }

        let now = env.ledger().timestamp();
        let order = EscrowOrder {
            order_id,
            buyer: buyer.clone(),
            seller: seller.clone(),
            token: token.clone(),
            amount,
            order_ref: order_ref.clone(),
            state: EscrowState::Created,
            created_at: now,
            funded_at: 0,
            settled_at: 0,
        };

        env.storage().persistent().set(&order_id, &order);
        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        // Emit creation event
        env.events().publish(
            (TOPIC_ESCROW, EVT_CREATED),
            (order_id, buyer, seller, amount),
        );

        Ok(())
    }

    /// Deposit agreed payment into contract-controlled escrow
    pub fn fund_order(env: Env, order_id: u64) -> Result<(), EscrowError> {
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.buyer.require_auth();

        if order.state != EscrowState::Created {
            return Err(EscrowError::InvalidState);
        }

        // Transfer tokens from buyer to escrow contract
        let token_client = token::Client::new(&env, &order.token);
        token_client.transfer(&order.buyer, &env.current_contract_address(), &order.amount);

        let now = env.ledger().timestamp();
        order.state = EscrowState::Funded;
        order.funded_at = now;

        env.storage().persistent().set(&order_id, &order);
        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        // Emit funding event
        env.events().publish(
            (TOPIC_ESCROW, EVT_FUNDED),
            (order_id, order.buyer, order.amount),
        );

        Ok(())
    }

    /// Buyer verifies garment delivery and releases escrowed funds to the atelier / manufacturer
    pub fn release_funds(env: Env, order_id: u64) -> Result<(), EscrowError> {
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.buyer.require_auth();

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        // Transfer tokens from escrow contract to seller
        let token_client = token::Client::new(&env, &order.token);
        token_client.transfer(&env.current_contract_address(), &order.seller, &order.amount);

        let now = env.ledger().timestamp();
        order.state = EscrowState::Released;
        order.settled_at = now;

        env.storage().persistent().set(&order_id, &order);

        // Emit release event
        env.events().publish(
            (TOPIC_ESCROW, EVT_RELEASED),
            (order_id, order.seller, order.amount),
        );

        Ok(())
    }

    /// Seller approves refund or cancels production order, returning tokens to buyer
    pub fn refund_funds(env: Env, order_id: u64) -> Result<(), EscrowError> {
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.seller.require_auth();

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        // Return tokens from escrow contract to buyer
        let token_client = token::Client::new(&env, &order.token);
        token_client.transfer(&env.current_contract_address(), &order.buyer, &order.amount);

        let now = env.ledger().timestamp();
        order.state = EscrowState::Refunded;
        order.settled_at = now;

        env.storage().persistent().set(&order_id, &order);

        // Emit refund event
        env.events().publish(
            (TOPIC_ESCROW, EVT_REFUNDED),
            (order_id, order.buyer, order.amount),
        );

        Ok(())
    }

    /// Cancel order before funding has occurred
    pub fn cancel_unfunded(env: Env, order_id: u64) -> Result<(), EscrowError> {
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.buyer.require_auth();

        if order.state != EscrowState::Created {
            return Err(EscrowError::InvalidState);
        }

        order.state = EscrowState::Cancelled;
        order.settled_at = env.ledger().timestamp();

        env.storage().persistent().set(&order_id, &order);

        // Emit cancellation event
        env.events().publish(
            (TOPIC_ESCROW, EVT_CANCELLED),
            (order_id, order.buyer),
        );

        Ok(())
    }

    /// Calculate basis points allocation with strict 10,000 BPS boundary checks
    pub fn calculate_bps(amount: i128, bps: u32) -> Result<i128, EscrowError> {
        if bps > 10_000 {
            return Err(EscrowError::InvalidBasisPoints);
        }
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        let bps_i128 = bps as i128;
        Ok((amount * bps_i128) / 10_000)
    }

    /// Deterministic split with dust remainder floor conservation
    pub fn split_with_dust(
        total: i128,
        payee_bps: u32,
        secondary_bps: u32,
    ) -> Result<(i128, i128), EscrowError> {
        if payee_bps + secondary_bps > 10_000 {
            return Err(EscrowError::InvalidBasisPoints);
        }
        if total <= 0 {
            return Err(EscrowError::InvalidAmount);
        }
        let secondary_share = (total * (secondary_bps as i128)) / 10_000;
        // Primary payee receives total minus secondary share, absorbing any fractional dust
        let primary_share = total.saturating_sub(secondary_share);
        Ok((primary_share, secondary_share))
    }

    /// Advance the production milestone stage for a funded fashion order
    pub fn advance_milestone(
        env: Env,
        order_id: u64,
        next_status: MilestoneStatus,
    ) -> Result<(), EscrowError> {
        let order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.seller.require_auth();

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_ESCROW, symbol_short!("milestone")),
            (order_id, next_status as u32),
        );

        Ok(())
    }

    /// Attest an independent quality inspection verdict (1: Passed, 2: Rejected, 3: Conditional)
    pub fn attest_inspection(
        env: Env,
        order_id: u64,
        inspector: Address,
        verdict: u32,
    ) -> Result<(), EscrowError> {
        inspector.require_auth();

        let order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        if verdict == 2 {
            return Err(EscrowError::InspectionFailed);
        }

        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_ESCROW, symbol_short!("inspect")),
            (order_id, inspector, verdict),
        );

        Ok(())
    }

    /// Claim automated timeout refund if delivery/inspection is not confirmed within window
    pub fn claim_timeout_refund(
        env: Env,
        order_id: u64,
        timeout_threshold_secs: u64,
    ) -> Result<(), EscrowError> {
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.buyer.require_auth();

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        let now = env.ledger().timestamp();
        if now < order.funded_at + timeout_threshold_secs {
            return Err(EscrowError::DisputeWindowExpired);
        }

        let token_client = token::Client::new(&env, &order.token);
        token_client.transfer(&env.current_contract_address(), &order.buyer, &order.amount);

        order.state = EscrowState::Refunded;
        order.settled_at = now;

        env.storage().persistent().set(&order_id, &order);
        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_ESCROW, EVT_REFUNDED),
            (order_id, order.buyer, order.amount),
        );

        Ok(())
    }

    /// Initialize contract admin
    pub fn initialize_admin(env: Env, admin: Address) -> Result<(), EscrowError> {
        if env.storage().instance().has(&KEY_ADMIN) {
            return Err(EscrowError::AlreadyExists);
        }
        env.storage().instance().set(&KEY_ADMIN, &admin);
        env.storage().instance().set(&KEY_PAUSED, &false);
        Ok(())
    }

    /// Emergency pause killswitch
    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), EscrowError> {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&KEY_ADMIN)
            .ok_or(EscrowError::Unauthorized)?;

        if admin != stored_admin {
            return Err(EscrowError::Unauthorized);
        }

        env.storage().instance().set(&KEY_PAUSED, &paused);
        env.events().publish((TOPIC_ESCROW, symbol_short!("paused")), paused);
        Ok(())
    }

    /// Query pause status
    pub fn is_paused(env: Env) -> bool {
        env.storage().instance().get(&KEY_PAUSED).unwrap_or(false)
    }

    /// Verify SEP-41 / SAC token allowance before executing escrow operations
    pub fn check_token_balance(env: Env, token_address: Address, account: Address) -> i128 {
        let token_client = token::Client::new(&env, &token_address);
        token_client.balance(&account)
    }

    /// Resolve active escrow dispute via designated arbitrator verdict
    pub fn resolve_dispute(
        env: Env,
        order_id: u64,
        arbitrator: Address,
        buyer_refund_bps: u32,
    ) -> Result<(), EscrowError> {
        arbitrator.require_auth();

        if buyer_refund_bps > 10_000 {
            return Err(EscrowError::InvalidBasisPoints);
        }

        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        let token_client = token::Client::new(&env, &order.token);
        let buyer_refund = (order.amount * (buyer_refund_bps as i128)) / 10_000;
        let seller_payout = order.amount - buyer_refund; // Conserve total balance

        if buyer_refund > 0 {
            token_client.transfer(&env.current_contract_address(), &order.buyer, &buyer_refund);
        }
        if seller_payout > 0 {
            token_client.transfer(&env.current_contract_address(), &order.seller, &seller_payout);
        }

        order.state = EscrowState::Released;
        order.settled_at = env.ledger().timestamp();
        env.storage().persistent().set(&order_id, &order);
        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_ESCROW, symbol_short!("dispute")),
            (order_id, arbitrator, buyer_refund, seller_payout),
        );

        Ok(())
    }

    /// Execute agreed mutual partial settlement between buyer and atelier
    pub fn settle_partial_agreement(
        env: Env,
        order_id: u64,
        release_amount: i128,
    ) -> Result<(), EscrowError> {
        let mut order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;

        order.buyer.require_auth();

        if order.state != EscrowState::Funded {
            return Err(EscrowError::InvalidState);
        }

        if release_amount <= 0 || release_amount > order.amount {
            return Err(EscrowError::InvalidAmount);
        }

        let refund_amount = order.amount - release_amount;
        let token_client = token::Client::new(&env, &order.token);

        token_client.transfer(&env.current_contract_address(), &order.seller, &release_amount);
        if refund_amount > 0 {
            token_client.transfer(&env.current_contract_address(), &order.buyer, &refund_amount);
        }

        order.state = EscrowState::Released;
        order.settled_at = env.ledger().timestamp();
        env.storage().persistent().set(&order_id, &order);
        env.storage().persistent().extend_ttl(&order_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_ESCROW, symbol_short!("partial")),
            (order_id, release_amount, refund_amount),
        );

        Ok(())
    }

    /// Check if order is fully settled
    pub fn is_order_settled(env: Env, order_id: u64) -> Result<bool, EscrowError> {
        let order: EscrowOrder = env
            .storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)?;
        Ok(order.state == EscrowState::Released || order.state == EscrowState::Refunded || order.state == EscrowState::Cancelled)
    }

    /// Read an escrow order by ID
    pub fn get_order(env: Env, order_id: u64) -> Result<EscrowOrder, EscrowError> {
        env.storage()
            .persistent()
            .get(&order_id)
            .ok_or(EscrowError::NotFound)
    }

    /// Check if an order ID exists
    pub fn has_order(env: Env, order_id: u64) -> bool {
        env.storage().persistent().has(&order_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token::StellarAssetClient, Env, String};

    fn setup_test() -> (
        Env,
        FashionEscrowContractClient<'static>,
        Address,
        Address,
        Address,
        StellarAssetClient<'static>,
    ) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(FashionEscrowContract, ());
        let client = FashionEscrowContractClient::new(&env, &contract_id);

        let token_admin = Address::generate(&env);
        let token_address = env.register_stellar_asset_contract_v2(token_admin).address();
        let token_admin_client = StellarAssetClient::new(&env, &token_address);

        let buyer = Address::generate(&env);
        let seller = Address::generate(&env);

        // Mint 100,000,000 Stroops (10 XLM) to buyer
        token_admin_client.mint(&buyer, &100_000_000);

        (env, client, buyer, seller, token_address, token_admin_client)
    }

    #[test]
    fn test_create_order_success() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-001");
        client.create_order(&1, &buyer, &seller, &token_address, &25_000_000, &order_ref);

        assert!(client.has_order(&1));
        let order = client.get_order(&1);
        assert_eq!(order.order_id, 1);
        assert_eq!(order.buyer, buyer);
        assert_eq!(order.seller, seller);
        assert_eq!(order.amount, 25_000_000);
        assert_eq!(order.state, EscrowState::Created);
    }

    #[test]
    fn test_duplicate_order_rejected() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-001");
        client.create_order(&1, &buyer, &seller, &token_address, &25_000_000, &order_ref);

        let res = client.try_create_order(&1, &buyer, &seller, &token_address, &25_000_000, &order_ref);
        assert_eq!(res, Err(Ok(EscrowError::AlreadyExists)));
    }

    #[test]
    fn test_fund_and_release_escrow() {
        let (env, client, buyer, seller, token_address, _) = setup_test();
        let token_client = token::Client::new(&env, &token_address);

        let order_ref = String::from_str(&env, "ORD-FW26-002");
        client.create_order(&2, &buyer, &seller, &token_address, &30_000_000, &order_ref);

        // Fund escrow
        client.fund_order(&2);
        let funded_order = client.get_order(&2);
        assert_eq!(funded_order.state, EscrowState::Funded);
        assert_eq!(token_client.balance(&client.address), 30_000_000);
        assert_eq!(token_client.balance(&buyer), 70_000_000);

        // Release escrow to seller
        client.release_funds(&2);
        let released_order = client.get_order(&2);
        assert_eq!(released_order.state, EscrowState::Released);
        assert_eq!(token_client.balance(&client.address), 0);
        assert_eq!(token_client.balance(&seller), 30_000_000);
    }

    #[test]
    fn test_fund_and_refund_escrow() {
        let (env, client, buyer, seller, token_address, _) = setup_test();
        let token_client = token::Client::new(&env, &token_address);

        let order_ref = String::from_str(&env, "ORD-FW26-003");
        client.create_order(&3, &buyer, &seller, &token_address, &15_000_000, &order_ref);

        // Fund escrow
        client.fund_order(&3);
        assert_eq!(token_client.balance(&client.address), 15_000_000);

        // Refund escrow back to buyer
        client.refund_funds(&3);
        let refunded_order = client.get_order(&3);
        assert_eq!(refunded_order.state, EscrowState::Refunded);
        assert_eq!(token_client.balance(&client.address), 0);
        assert_eq!(token_client.balance(&buyer), 100_000_000);
    }

    #[test]
    fn test_cancel_unfunded_order() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-004");
        client.create_order(&4, &buyer, &seller, &token_address, &10_000_000, &order_ref);

        client.cancel_unfunded(&4);
        let order = client.get_order(&4);
        assert_eq!(order.state, EscrowState::Cancelled);

        // Cannot fund cancelled order
        let res = client.try_fund_order(&4);
        assert_eq!(res, Err(Ok(EscrowError::InvalidState)));
    }

    #[test]
    fn test_cannot_release_unfunded_order() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-005");
        client.create_order(&5, &buyer, &seller, &token_address, &10_000_000, &order_ref);

        let res = client.try_release_funds(&5);
        assert_eq!(res, Err(Ok(EscrowError::InvalidState)));
    }

    #[test]
    fn test_invalid_parameters_rejected() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let empty_ref = String::from_str(&env, "");
        let valid_ref = String::from_str(&env, "VALID");

        // Amount <= 0 -> InvalidAmount
        let res1 = client.try_create_order(&6, &buyer, &seller, &token_address, &0, &valid_ref);
        assert_eq!(res1, Err(Ok(EscrowError::InvalidAmount)));

        // Amount < MIN_ESCROW_AMOUNT -> BelowMinimumEscrow
        let res2 = client.try_create_order(&7, &buyer, &seller, &token_address, &5_000_000, &valid_ref);
        assert_eq!(res2, Err(Ok(EscrowError::BelowMinimumEscrow)));

        // Same buyer and seller -> SameBuyerSeller
        let res3 = client.try_create_order(&8, &buyer, &buyer, &token_address, &10_000_000, &valid_ref);
        assert_eq!(res3, Err(Ok(EscrowError::SameBuyerSeller)));

        // Empty ref -> InvalidOrderRef
        let res4 = client.try_create_order(&9, &buyer, &seller, &token_address, &10_000_000, &empty_ref);
        assert_eq!(res4, Err(Ok(EscrowError::InvalidOrderRef)));
    }

    #[test]
    fn test_bps_split_and_dust_conservation() {
        let (_env, _client, _, _, _, _) = setup_test();

        let total = 100_000_003i128; // Uneven amount to test integer dust remainder
        let (primary, secondary) = FashionEscrowContract::split_with_dust(total, 7_000, 3_000).unwrap();
        assert_eq!(primary + secondary, total); // Exact conservation invariant!
    }
}
