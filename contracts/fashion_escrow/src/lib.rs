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
        let primary_share = total - secondary_share;
        Ok((primary_share, secondary_share))
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

        // Mint 10,000 units to buyer
        token_admin_client.mint(&buyer, &10_000);

        (env, client, buyer, seller, token_address, token_admin_client)
    }

    #[test]
    fn test_create_order_success() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-001");
        client.create_order(&1, &buyer, &seller, &token_address, &2_500, &order_ref);

        assert!(client.has_order(&1));
        let order = client.get_order(&1);
        assert_eq!(order.order_id, 1);
        assert_eq!(order.buyer, buyer);
        assert_eq!(order.seller, seller);
        assert_eq!(order.amount, 2_500);
        assert_eq!(order.state, EscrowState::Created);
    }

    #[test]
    fn test_duplicate_order_rejected() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-001");
        client.create_order(&1, &buyer, &seller, &token_address, &2_500, &order_ref);

        let res = client.try_create_order(&1, &buyer, &seller, &token_address, &2_500, &order_ref);
        assert_eq!(res, Err(Ok(EscrowError::AlreadyExists)));
    }

    #[test]
    fn test_fund_and_release_escrow() {
        let (env, client, buyer, seller, token_address, _) = setup_test();
        let token_client = token::Client::new(&env, &token_address);

        let order_ref = String::from_str(&env, "ORD-FW26-002");
        client.create_order(&2, &buyer, &seller, &token_address, &3_000, &order_ref);

        // Fund escrow
        client.fund_order(&2);
        let funded_order = client.get_order(&2);
        assert_eq!(funded_order.state, EscrowState::Funded);
        assert_eq!(token_client.balance(&client.address), 3_000);
        assert_eq!(token_client.balance(&buyer), 7_000);

        // Release escrow to seller
        client.release_funds(&2);
        let released_order = client.get_order(&2);
        assert_eq!(released_order.state, EscrowState::Released);
        assert_eq!(token_client.balance(&client.address), 0);
        assert_eq!(token_client.balance(&seller), 3_000);
    }

    #[test]
    fn test_fund_and_refund_escrow() {
        let (env, client, buyer, seller, token_address, _) = setup_test();
        let token_client = token::Client::new(&env, &token_address);

        let order_ref = String::from_str(&env, "ORD-FW26-003");
        client.create_order(&3, &buyer, &seller, &token_address, &1_500, &order_ref);

        // Fund escrow
        client.fund_order(&3);
        assert_eq!(token_client.balance(&client.address), 1_500);

        // Refund escrow back to buyer
        client.refund_funds(&3);
        let refunded_order = client.get_order(&3);
        assert_eq!(refunded_order.state, EscrowState::Refunded);
        assert_eq!(token_client.balance(&client.address), 0);
        assert_eq!(token_client.balance(&buyer), 10_000);
    }

    #[test]
    fn test_cancel_unfunded_order() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-004");
        client.create_order(&4, &buyer, &seller, &token_address, &1_000, &order_ref);

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
        client.create_order(&5, &buyer, &seller, &token_address, &1_000, &order_ref);

        let res = client.try_release_funds(&5);
        assert_eq!(res, Err(Ok(EscrowError::InvalidState)));
    }

    #[test]
    fn test_invalid_parameters_rejected() {
        let (env, client, buyer, seller, token_address, _) = setup_test();

        let order_ref = String::from_str(&env, "ORD-FW26-006");

        // Amount <= 0
        let res1 = client.try_create_order(&6, &buyer, &seller, &token_address, &0, &order_ref);
        assert_eq!(res1, Err(Ok(EscrowError::InvalidAmount)));

        // Same buyer and seller
        let res2 = client.try_create_order(&7, &buyer, &buyer, &token_address, &100, &order_ref);
        assert_eq!(res2, Err(Ok(EscrowError::SameBuyerSeller)));

        // Empty ref
        let empty_ref = String::from_str(&env, "");
        let res3 = client.try_create_order(&8, &buyer, &seller, &token_address, &100, &empty_ref);
        assert_eq!(res3, Err(Ok(EscrowError::InvalidOrderRef)));
    }
}
