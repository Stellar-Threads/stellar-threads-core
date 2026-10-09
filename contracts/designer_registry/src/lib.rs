#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    AlreadyRegistered = 1,
    NotFound = 2,
    Unauthorized = 3,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct DesignerRecord {
    pub designer_address: Address,
    pub brand_name: String,
    pub atelier_location: String,
    pub is_verified: bool,
}

#[contract]
pub struct DesignerRegistryContract;

#[contractimpl]
impl DesignerRegistryContract {
    /// Register a new fashion designer or atelier
    pub fn register_designer(
        env: Env,
        designer: Address,
        brand_name: String,
        atelier_location: String,
    ) -> Result<(), RegistryError> {
        designer.require_auth();

        if env.storage().persistent().has(&designer) {
            return Err(RegistryError::AlreadyRegistered);
        }

        let record = DesignerRecord {
            designer_address: designer.clone(),
            brand_name,
            atelier_location,
            is_verified: false,
        };

        env.storage().persistent().set(&designer, &record);
        Ok(())
    }

    /// Retrieve designer record by address
    pub fn get_designer(env: Env, designer: Address) -> Result<DesignerRecord, RegistryError> {
        env.storage()
            .persistent()
            .get(&designer)
            .ok_or(RegistryError::NotFound)
    }
}
