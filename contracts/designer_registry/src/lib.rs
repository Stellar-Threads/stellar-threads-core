#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    AlreadyRegistered = 1,
    NotFound = 2,
    Unauthorized = 3,
    InvalidBrandName = 4,
    InvalidLocation = 5,
    InvalidMetadataUri = 6,
    ContractPaused = 7,
    InvalidSustainabilityScore = 8,
    TierNotFound = 9,
    UnauthorizedAuditor = 10,
}

/// Official atelier prestige and craftsmanship verification tier
#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum DesignerTier {
    Emerging = 1,
    VerifiedAtelier = 2,
    HauteCouture = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DesignerRecord {
    pub designer_address: Address,
    pub brand_name: String,
    pub atelier_location: String,
    pub metadata_uri: String,
    pub registered_at: u64,
    pub is_verified: bool,
    pub tier: DesignerTier,
    pub sustainability_score: u32,
    pub cert_hash: String,
    pub fulfilled_orders: u32,
}

const TOPIC_DESIGNER: Symbol = symbol_short!("designer");
const EVT_REGISTERED: Symbol = symbol_short!("reg");
const EVT_UPDATED: Symbol = symbol_short!("updated");

const PERSISTENT_BUMP_AMOUNT: u32 = 3_110_400;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 100_000;
const KEY_COUNT: Symbol = symbol_short!("count");
const KEY_BOND: Symbol = symbol_short!("bond");

#[contract]
pub struct DesignerRegistryContract;

#[contractimpl]
impl DesignerRegistryContract {
    /// Register a new sovereign fashion designer or atelier
    pub fn register_designer(
        env: Env,
        designer: Address,
        brand_name: String,
        atelier_location: String,
        metadata_uri: String,
    ) -> Result<(), RegistryError> {
        designer.require_auth();

        if brand_name.len() == 0 {
            return Err(RegistryError::InvalidBrandName);
        }
        if atelier_location.len() == 0 {
            return Err(RegistryError::InvalidLocation);
        }

        if env.storage().persistent().has(&designer) {
            return Err(RegistryError::AlreadyRegistered);
        }

        let now = env.ledger().timestamp();
        let record = DesignerRecord {
            designer_address: designer.clone(),
            brand_name: brand_name.clone(),
            atelier_location,
            metadata_uri: metadata_uri.clone(),
            registered_at: now,
            is_verified: true,
            tier: DesignerTier::Emerging,
            sustainability_score: 50,
            cert_hash: String::from_str(&env, "UNVERIFIED"),
            fulfilled_orders: 0,
        };

        env.storage().persistent().set(&designer, &record);
        env.storage().persistent().extend_ttl(&designer, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        let count: u32 = env.storage().instance().get(&KEY_COUNT).unwrap_or(0);
        env.storage().instance().set(&KEY_COUNT, &(count + 1));

        // Emit registration event: topic: (designer, reg), data: (designer, brand_name, metadata_uri)
        env.events().publish(
            (TOPIC_DESIGNER, EVT_REGISTERED),
            (designer, brand_name, metadata_uri),
        );

        Ok(())
    }

    /// Update profile metadata for an existing registered designer
    pub fn update_profile(
        env: Env,
        designer: Address,
        brand_name: String,
        atelier_location: String,
        metadata_uri: String,
    ) -> Result<(), RegistryError> {
        designer.require_auth();

        if brand_name.len() == 0 {
            return Err(RegistryError::InvalidBrandName);
        }
        if atelier_location.len() == 0 {
            return Err(RegistryError::InvalidLocation);
        }

        let mut record: DesignerRecord = env
            .storage()
            .persistent()
            .get(&designer)
            .ok_or(RegistryError::NotFound)?;

        record.brand_name = brand_name.clone();
        record.atelier_location = atelier_location;
        record.metadata_uri = metadata_uri.clone();

        env.storage().persistent().set(&designer, &record);
        env.storage().persistent().extend_ttl(&designer, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        // Emit update event: topic: (designer, updated), data: (designer, brand_name, metadata_uri)
        env.events().publish(
            (TOPIC_DESIGNER, EVT_UPDATED),
            (designer, brand_name, metadata_uri),
        );

        Ok(())
    }

    /// Upgrade designer atelier tier classification
    pub fn update_tier(
        env: Env,
        designer: Address,
        new_tier: DesignerTier,
    ) -> Result<(), RegistryError> {
        let mut record: DesignerRecord = env
            .storage()
            .persistent()
            .get(&designer)
            .ok_or(RegistryError::NotFound)?;

        record.tier = new_tier;
        env.storage().persistent().set(&designer, &record);

        env.events().publish(
            (TOPIC_DESIGNER, symbol_short!("tier")),
            (designer, new_tier as u32),
        );

        Ok(())
    }

    /// Attest ESG sustainability score and certification hash
    pub fn update_sustainability(
        env: Env,
        designer: Address,
        score: u32,
        cert_hash: String,
    ) -> Result<(), RegistryError> {
        if score > 100 {
            return Err(RegistryError::InvalidSustainabilityScore);
        }

        let mut record: DesignerRecord = env
            .storage()
            .persistent()
            .get(&designer)
            .ok_or(RegistryError::NotFound)?;

        record.sustainability_score = score;
        record.cert_hash = cert_hash.clone();
        env.storage().persistent().set(&designer, &record);

        env.events().publish(
            (TOPIC_DESIGNER, symbol_short!("esg")),
            (designer, score, cert_hash),
        );

        Ok(())
    }

    /// Return total registered designer count
    pub fn get_total_designers(env: Env) -> u32 {
        env.storage().instance().get(&KEY_COUNT).unwrap_or(0)
    }

    /// Set minimum verification stake bond for HauteCouture ateliers
    pub fn set_verification_bond(env: Env, bond_amount: i128) -> Result<(), RegistryError> {
        env.storage().instance().set(&KEY_BOND, &bond_amount);
        Ok(())
    }

    /// Query required verification stake bond
    pub fn get_verification_bond(env: Env) -> i128 {
        env.storage().instance().get(&KEY_BOND).unwrap_or(0)
    }

    /// Increment fulfilled orders counter upon successful escrow release
    pub fn record_fulfillment(env: Env, designer: Address) -> Result<u32, RegistryError> {
        let mut record: DesignerRecord = env
            .storage()
            .persistent()
            .get(&designer)
            .ok_or(RegistryError::NotFound)?;

        record.fulfilled_orders += 1;
        let count = record.fulfilled_orders;
        env.storage().persistent().set(&designer, &record);
        env.storage().persistent().extend_ttl(&designer, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        Ok(count)
    }

    /// Retrieve designer record by address
    pub fn get_designer(env: Env, designer: Address) -> Result<DesignerRecord, RegistryError> {
        env.storage()
            .persistent()
            .get(&designer)
            .ok_or(RegistryError::NotFound)
    }

    /// Check if an address is registered as a designer
    pub fn has_designer(env: Env, designer: Address) -> bool {
        env.storage().persistent().has(&designer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn test_successful_registration_and_read() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DesignerRegistryContract, ());
        let client = DesignerRegistryContractClient::new(&env, &contract_id);

        let designer = Address::generate(&env);
        let brand_name = String::from_str(&env, "Maison Lumina");
        let atelier = String::from_str(&env, "Paris, France");
        let uri = String::from_str(&env, "ipfs://bafybeidesignerprofile123");

        client.register_designer(&designer, &brand_name, &atelier, &uri);

        assert!(client.has_designer(&designer));
        let record = client.get_designer(&designer);
        assert_eq!(record.brand_name, brand_name);
        assert_eq!(record.atelier_location, atelier);
        assert_eq!(record.metadata_uri, uri);
        assert!(record.is_verified);
    }

    #[test]
    fn test_duplicate_registration_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DesignerRegistryContract, ());
        let client = DesignerRegistryContractClient::new(&env, &contract_id);

        let designer = Address::generate(&env);
        let brand_name = String::from_str(&env, "Atelier Sol");
        let atelier = String::from_str(&env, "Milan, Italy");
        let uri = String::from_str(&env, "ipfs://bafybeidesignerprofile456");

        client.register_designer(&designer, &brand_name, &atelier, &uri);

        let res = client.try_register_designer(&designer, &brand_name, &atelier, &uri);
        assert_eq!(res, Err(Ok(RegistryError::AlreadyRegistered)));
    }

    #[test]
    fn test_update_profile() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DesignerRegistryContract, ());
        let client = DesignerRegistryContractClient::new(&env, &contract_id);

        let designer = Address::generate(&env);
        let brand_name = String::from_str(&env, "Atelier Sol");
        let atelier = String::from_str(&env, "Milan, Italy");
        let uri = String::from_str(&env, "ipfs://initial");

        client.register_designer(&designer, &brand_name, &atelier, &uri);

        let new_brand = String::from_str(&env, "Atelier Sol Couture");
        let new_atelier = String::from_str(&env, "Florence, Italy");
        let new_uri = String::from_str(&env, "ipfs://updated_profile");

        client.update_profile(&designer, &new_brand, &new_atelier, &new_uri);

        let updated = client.get_designer(&designer);
        assert_eq!(updated.brand_name, new_brand);
        assert_eq!(updated.atelier_location, new_atelier);
        assert_eq!(updated.metadata_uri, new_uri);
    }

    #[test]
    fn test_update_nonexistent_designer_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DesignerRegistryContract, ());
        let client = DesignerRegistryContractClient::new(&env, &contract_id);

        let designer = Address::generate(&env);
        let brand = String::from_str(&env, "Ghost");
        let atelier = String::from_str(&env, "Tokyo");
        let uri = String::from_str(&env, "ipfs://ghost");

        let res = client.try_update_profile(&designer, &brand, &atelier, &uri);
        assert_eq!(res, Err(Ok(RegistryError::NotFound)));
    }

    #[test]
    fn test_invalid_arguments_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DesignerRegistryContract, ());
        let client = DesignerRegistryContractClient::new(&env, &contract_id);

        let designer = Address::generate(&env);
        let empty_brand = String::from_str(&env, "");
        let atelier = String::from_str(&env, "London");
        let uri = String::from_str(&env, "ipfs://empty");

        let res = client.try_register_designer(&designer, &empty_brand, &atelier, &uri);
        assert_eq!(res, Err(Ok(RegistryError::InvalidBrandName)));
    }
}
