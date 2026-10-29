#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PassportError {
    AlreadyExists = 1,
    NotFound = 2,
    Unauthorized = 3,
    InvalidProductId = 4,
    InvalidMetadata = 5,
    InvalidIntegrityHash = 6,
    InvalidEdition = 7,
    PassportRetired = 8,
    IntegrityMismatch = 9,
    BatchLimitExceeded = 10,
    UnauthorizedTransfer = 11,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProductPassportRecord {
    pub product_id: String,
    pub creator: Address,
    pub owner: Address,
    pub brand_name: String,
    pub product_name: String,
    pub metadata_uri: String,
    pub integrity_hash: String,
    pub total_edition: u32,
    pub status: u32, // 1: Active, 2: Transferred, 3: Retired
    pub created_at: u64,
}

const TOPIC_PASSPORT: Symbol = symbol_short!("passport");
const EVT_CREATED: Symbol = symbol_short!("created");
const EVT_TRANSFER: Symbol = symbol_short!("transf");
const EVT_STATUS: Symbol = symbol_short!("status");

const PERSISTENT_BUMP_AMOUNT: u32 = 3_110_400;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 100_000;

#[contract]
pub struct ProductPassportContract;

#[contractimpl]
impl ProductPassportContract {
    /// Register a new digital product passport for an authorized designer/brand
    pub fn create_passport(
        env: Env,
        creator: Address,
        product_id: String,
        brand_name: String,
        product_name: String,
        metadata_uri: String,
        integrity_hash: String,
        total_edition: u32,
    ) -> Result<(), PassportError> {
        creator.require_auth();

        if product_id.len() == 0 {
            return Err(PassportError::InvalidProductId);
        }
        if metadata_uri.len() == 0 {
            return Err(PassportError::InvalidMetadata);
        }
        if integrity_hash.len() == 0 {
            return Err(PassportError::InvalidIntegrityHash);
        }
        if total_edition == 0 {
            return Err(PassportError::InvalidEdition);
        }

        if env.storage().persistent().has(&product_id) {
            return Err(PassportError::AlreadyExists);
        }

        let now = env.ledger().timestamp();
        let record = ProductPassportRecord {
            product_id: product_id.clone(),
            creator: creator.clone(),
            owner: creator.clone(),
            brand_name,
            product_name,
            metadata_uri,
            integrity_hash: integrity_hash.clone(),
            total_edition,
            status: 1, // Active
            created_at: now,
        };

        env.storage().persistent().set(&product_id, &record);
        env.storage().persistent().extend_ttl(&product_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        // Emit passport creation event: topic: (passport, created), data: (product_id, creator, integrity_hash)
        env.events().publish(
            (TOPIC_PASSPORT, EVT_CREATED),
            (product_id, creator, integrity_hash),
        );

        Ok(())
    }

    /// Read digital product passport details
    pub fn get_passport(
        env: Env,
        product_id: String,
    ) -> Result<ProductPassportRecord, PassportError> {
        env.storage()
            .persistent()
            .get(&product_id)
            .ok_or(PassportError::NotFound)
    }

    /// Verify whether a supplied hash matches the on-chain integrity hash
    pub fn verify_integrity(
        env: Env,
        product_id: String,
        provided_hash: String,
    ) -> Result<bool, PassportError> {
        let record: ProductPassportRecord = env
            .storage()
            .persistent()
            .get(&product_id)
            .ok_or(PassportError::NotFound)?;

        Ok(record.integrity_hash == provided_hash)
    }

    /// Transfer ownership of the digital passport to a new collector/buyer
    pub fn transfer_passport(
        env: Env,
        product_id: String,
        current_owner: Address,
        new_owner: Address,
    ) -> Result<(), PassportError> {
        current_owner.require_auth();

        let mut record: ProductPassportRecord = env
            .storage()
            .persistent()
            .get(&product_id)
            .ok_or(PassportError::NotFound)?;

        if record.owner != current_owner {
            return Err(PassportError::Unauthorized);
        }

        record.owner = new_owner.clone();
        record.status = 2; // Transferred

        env.storage().persistent().set(&product_id, &record);
        env.storage().persistent().extend_ttl(&product_id, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        // Emit transfer event
        env.events().publish(
            (TOPIC_PASSPORT, EVT_TRANSFER),
            (product_id, current_owner, new_owner),
        );

        Ok(())
    }

    /// Update passport status (e.g. 3 = Retired/Recycled)
    pub fn update_status(
        env: Env,
        product_id: String,
        owner: Address,
        new_status: u32,
    ) -> Result<(), PassportError> {
        owner.require_auth();

        let mut record: ProductPassportRecord = env
            .storage()
            .persistent()
            .get(&product_id)
            .ok_or(PassportError::NotFound)?;

        if record.owner != owner {
            return Err(PassportError::Unauthorized);
        }

        record.status = new_status;
        env.storage().persistent().set(&product_id, &record);

        // Emit status update event
        env.events().publish(
            (TOPIC_PASSPORT, EVT_STATUS),
            (product_id, owner, new_status),
        );

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    #[test]
    fn test_create_and_read_passport() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ProductPassportContract, ());
        let client = ProductPassportContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let product_id = String::from_str(&env, "ST-LUX-001");
        let brand = String::from_str(&env, "Maison Lumina");
        let item_name = String::from_str(&env, "Silk Embroidered Bomber Jacket");
        let uri = String::from_str(&env, "ipfs://bafybeipassportmetadata123");
        let hash = String::from_str(
            &env,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        );

        client.create_passport(&creator, &product_id, &brand, &item_name, &uri, &hash, &50);

        let record = client.get_passport(&product_id);
        assert_eq!(record.product_id, product_id);
        assert_eq!(record.creator, creator);
        assert_eq!(record.owner, creator);
        assert_eq!(record.brand_name, brand);
        assert_eq!(record.integrity_hash, hash);
        assert_eq!(record.status, 1);
        assert_eq!(record.total_edition, 50);
    }

    #[test]
    fn test_verify_integrity_hash() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ProductPassportContract, ());
        let client = ProductPassportContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let product_id = String::from_str(&env, "ST-VERIFY-002");
        let brand = String::from_str(&env, "Atelier Sol");
        let item = String::from_str(&env, "Cashmere Trench Coat");
        let uri = String::from_str(&env, "ipfs://metadata-hash-test");
        let valid_hash = String::from_str(&env, "3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b");
        let fake_hash = String::from_str(&env, "0000000000000000000000000000000000000000000000000000000000000000");

        client.create_passport(&creator, &product_id, &brand, &item, &uri, &valid_hash, &1);

        assert!(client.verify_integrity(&product_id, &valid_hash));
        assert!(!client.verify_integrity(&product_id, &fake_hash));
    }

    #[test]
    fn test_duplicate_product_rejected() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ProductPassportContract, ());
        let client = ProductPassportContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let product_id = String::from_str(&env, "ST-DUP-001");
        let brand = String::from_str(&env, "Atelier");
        let item = String::from_str(&env, "Leather Loafers");
        let uri = String::from_str(&env, "ipfs://item");
        let hash = String::from_str(&env, "abc123hash");

        client.create_passport(&creator, &product_id, &brand, &item, &uri, &hash, &10);

        let res = client.try_create_passport(&creator, &product_id, &brand, &item, &uri, &hash, &10);
        assert_eq!(res, Err(Ok(PassportError::AlreadyExists)));
    }

    #[test]
    fn test_transfer_passport() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ProductPassportContract, ());
        let client = ProductPassportContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let buyer = Address::generate(&env);
        let product_id = String::from_str(&env, "ST-TRANS-001");
        let brand = String::from_str(&env, "Atelier");
        let item = String::from_str(&env, "Leather Loafers");
        let uri = String::from_str(&env, "ipfs://item");
        let hash = String::from_str(&env, "abc123hash");

        client.create_passport(&creator, &product_id, &brand, &item, &uri, &hash, &1);
        client.transfer_passport(&product_id, &creator, &buyer);

        let record = client.get_passport(&product_id);
        assert_eq!(record.owner, buyer);
        assert_eq!(record.status, 2); // Transferred
    }

    #[test]
    fn test_update_status() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(ProductPassportContract, ());
        let client = ProductPassportContractClient::new(&env, &contract_id);

        let creator = Address::generate(&env);
        let product_id = String::from_str(&env, "ST-STATUS-001");
        let brand = String::from_str(&env, "Atelier");
        let item = String::from_str(&env, "Tote Bag");
        let uri = String::from_str(&env, "ipfs://tote");
        let hash = String::from_str(&env, "hash");

        client.create_passport(&creator, &product_id, &brand, &item, &uri, &hash, &1);
        client.update_status(&product_id, &creator, &3); // Retired

        let record = client.get_passport(&product_id);
        assert_eq!(record.status, 3);
    }
}
