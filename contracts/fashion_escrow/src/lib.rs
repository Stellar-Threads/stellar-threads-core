#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidMilestone = 5,
    MilestoneAlreadyCompleted = 6,
    EscrowAlreadyReleased = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Active,
    Completed,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct FashionEscrowConfig {
    pub brand: Address,
    pub manufacturer: Address,
    pub total_amount: i128,
    pub order_ref: String,
    pub state: EscrowState,
}

const CONFIG_KEY: Symbol = symbol_short!("CONFIG");

#[contract]
pub struct FashionEscrowContract;

#[contractimpl]
impl FashionEscrowContract {
    /// Initialize a new fashion production escrow agreement
    pub fn initialize(
        env: Env,
        brand: Address,
        manufacturer: Address,
        total_amount: i128,
        order_ref: String,
    ) -> Result<(), EscrowError> {
        brand.require_auth();

        if total_amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        if env.storage().instance().has(&CONFIG_KEY) {
            return Err(EscrowError::AlreadyInitialized);
        }

        let config = FashionEscrowConfig {
            brand,
            manufacturer,
            total_amount,
            order_ref,
            state: EscrowState::Active,
        };

        env.storage().instance().set(&CONFIG_KEY, &config);
        Ok(())
    }

    /// Read the current escrow configuration
    pub fn get_config(env: Env) -> Result<FashionEscrowConfig, EscrowError> {
        env.storage()
            .instance()
            .get(&CONFIG_KEY)
            .ok_or(EscrowError::NotInitialized)
    }
}
