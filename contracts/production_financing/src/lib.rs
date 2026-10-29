#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
    String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum FinancingError {
    AlreadyExists = 1,
    NotFound = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidThreshold = 5,
    InvalidDeadline = 6,
    CampaignNotActive = 7,
    DeadlinePassed = 8,
    TargetExceeded = 9,
    ThresholdNotMet = 10,
    AlreadyReleased = 11,
    NothingToClaim = 12,
    CampaignSuccessful = 13,
    InvalidRepaymentTarget = 14,
    ContractPaused = 15,
    DefaultTriggered = 16,
    CollateralMissing = 17,
    InvalidInvestorQuota = 18,
    GracePeriodActive = 19,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ProposalStatus {
    Draft = 0,
    FundingActive = 1,
    Funded = 2,
    ProductionActive = 3,
    Repaid = 4,
    Cancelled = 5,
    ExpiredRefund = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FinancingProposal {
    pub proposal_id: String,
    pub applicant: Address,
    pub token: Address,
    pub target_amount: i128,
    pub min_threshold: i128,
    pub current_funded: i128,
    pub deadline: u64,
    pub repayment_target: i128,
    pub total_repaid: i128,
    pub purpose: String,
    pub metadata_uri: String,
    pub status: ProposalStatus,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Proposal(String),
    Contribution(String, Address),
    RepaymentClaimed(String, Address),
}

const TOPIC_FINANCING: Symbol = symbol_short!("financing");
const EVT_CREATED: Symbol = symbol_short!("created");
const EVT_CONTRIBUTED: Symbol = symbol_short!("contrib");
const EVT_RELEASED: Symbol = symbol_short!("released");
const EVT_REPAID: Symbol = symbol_short!("repaid");
const EVT_CLAIMED: Symbol = symbol_short!("claimed");
const EVT_REFUNDED: Symbol = symbol_short!("refunded");

/// Protocol 22 storage rent TTL constants (~6 months in ledgers)
const PERSISTENT_BUMP_AMOUNT: u32 = 3_110_400;
const PERSISTENT_LIFETIME_THRESHOLD: u32 = 100_000;
/// Minimum contribution amount: 10,000,000 Stroops (1 XLM / SAC USDC)
const MIN_CONTRIBUTION: i128 = 10_000_000;

#[contract]
pub struct ProductionFinancingContract;

#[contractimpl]
impl ProductionFinancingContract {
    /// Create a new production funding request proposal
    pub fn create_proposal(
        env: Env,
        applicant: Address,
        proposal_id: String,
        token: Address,
        target_amount: i128,
        min_threshold: i128,
        deadline: u64,
        repayment_target: i128,
        purpose: String,
        metadata_uri: String,
    ) -> Result<(), FinancingError> {
        applicant.require_auth();

        if target_amount <= 0 {
            return Err(FinancingError::InvalidAmount);
        }
        if min_threshold <= 0 || min_threshold > target_amount {
            return Err(FinancingError::InvalidThreshold);
        }
        if repayment_target < target_amount {
            return Err(FinancingError::InvalidRepaymentTarget);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(FinancingError::InvalidDeadline);
        }
        if proposal_id.len() == 0 {
            return Err(FinancingError::InvalidAmount);
        }

        let key = DataKey::Proposal(proposal_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(FinancingError::AlreadyExists);
        }

        let now = env.ledger().timestamp();
        let proposal = FinancingProposal {
            proposal_id: proposal_id.clone(),
            applicant: applicant.clone(),
            token: token.clone(),
            target_amount,
            min_threshold,
            current_funded: 0,
            deadline,
            repayment_target,
            total_repaid: 0,
            purpose: purpose.clone(),
            metadata_uri: metadata_uri.clone(),
            status: ProposalStatus::FundingActive,
            created_at: now,
        };

        env.storage().persistent().set(&key, &proposal);
        env.storage().persistent().extend_ttl(&key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_FINANCING, EVT_CREATED),
            (proposal_id, applicant, target_amount, min_threshold),
        );

        Ok(())
    }

    /// Contribute funds towards a production financing campaign
    pub fn contribute_funds(
        env: Env,
        contributor: Address,
        proposal_id: String,
        amount: i128,
    ) -> Result<(), FinancingError> {
        contributor.require_auth();

        if amount < MIN_CONTRIBUTION {
            return Err(FinancingError::InvalidAmount);
        }

        let p_key = DataKey::Proposal(proposal_id.clone());
        let mut proposal: FinancingProposal = env
            .storage()
            .persistent()
            .get(&p_key)
            .ok_or(FinancingError::NotFound)?;

        if proposal.status != ProposalStatus::FundingActive {
            return Err(FinancingError::CampaignNotActive);
        }

        if env.ledger().timestamp() > proposal.deadline {
            return Err(FinancingError::DeadlinePassed);
        }

        if proposal.current_funded + amount > proposal.target_amount {
            return Err(FinancingError::TargetExceeded);
        }

        // Transfer tokens from contributor to contract
        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(&contributor, &env.current_contract_address(), &amount);

        // Record contribution
        let c_key = DataKey::Contribution(proposal_id.clone(), contributor.clone());
        let previous_contribution: i128 = env.storage().persistent().get(&c_key).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&c_key, &(previous_contribution + amount));

        proposal.current_funded += amount;
        if proposal.current_funded >= proposal.target_amount {
            proposal.status = ProposalStatus::Funded;
        }

        env.storage().persistent().set(&p_key, &proposal);
        env.storage().persistent().extend_ttl(&p_key, PERSISTENT_LIFETIME_THRESHOLD, PERSISTENT_BUMP_AMOUNT);

        env.events().publish(
            (TOPIC_FINANCING, EVT_CONTRIBUTED),
            (proposal_id, contributor, amount, proposal.current_funded),
        );

        Ok(())
    }

    /// Release collected production capital to the applicant designer
    pub fn release_funds(
        env: Env,
        caller: Address,
        proposal_id: String,
    ) -> Result<(), FinancingError> {
        caller.require_auth();

        let p_key = DataKey::Proposal(proposal_id.clone());
        let mut proposal: FinancingProposal = env
            .storage()
            .persistent()
            .get(&p_key)
            .ok_or(FinancingError::NotFound)?;

        if caller != proposal.applicant {
            return Err(FinancingError::Unauthorized);
        }

        if proposal.status == ProposalStatus::ProductionActive
            || proposal.status == ProposalStatus::Repaid
        {
            return Err(FinancingError::AlreadyReleased);
        }

        // Must meet min_threshold
        if proposal.current_funded < proposal.min_threshold {
            return Err(FinancingError::ThresholdNotMet);
        }

        let payout = proposal.current_funded;
        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(&env.current_contract_address(), &proposal.applicant, &payout);

        proposal.status = ProposalStatus::ProductionActive;
        env.storage().persistent().set(&p_key, &proposal);

        env.events().publish(
            (TOPIC_FINANCING, EVT_RELEASED),
            (proposal_id, proposal.applicant, payout),
        );

        Ok(())
    }

    /// Submit a production financing repayment
    pub fn make_repayment(
        env: Env,
        payer: Address,
        proposal_id: String,
        amount: i128,
    ) -> Result<(), FinancingError> {
        payer.require_auth();

        if amount <= 0 {
            return Err(FinancingError::InvalidAmount);
        }

        let p_key = DataKey::Proposal(proposal_id.clone());
        let mut proposal: FinancingProposal = env
            .storage()
            .persistent()
            .get(&p_key)
            .ok_or(FinancingError::NotFound)?;

        if proposal.status != ProposalStatus::ProductionActive {
            return Err(FinancingError::CampaignNotActive);
        }

        // Transfer repayment tokens into contract for contributors to claim
        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(&payer, &env.current_contract_address(), &amount);

        proposal.total_repaid += amount;
        if proposal.total_repaid >= proposal.repayment_target {
            proposal.status = ProposalStatus::Repaid;
        }

        env.storage().persistent().set(&p_key, &proposal);

        env.events().publish(
            (TOPIC_FINANCING, EVT_REPAID),
            (proposal_id, payer, amount, proposal.total_repaid),
        );

        Ok(())
    }

    /// Claim proportional repayment share for a contributor
    pub fn claim_repayment_share(
        env: Env,
        contributor: Address,
        proposal_id: String,
    ) -> Result<i128, FinancingError> {
        contributor.require_auth();

        let p_key = DataKey::Proposal(proposal_id.clone());
        let proposal: FinancingProposal = env
            .storage()
            .persistent()
            .get(&p_key)
            .ok_or(FinancingError::NotFound)?;

        let c_key = DataKey::Contribution(proposal_id.clone(), contributor.clone());
        let contribution: i128 = env
            .storage()
            .persistent()
            .get(&c_key)
            .ok_or(FinancingError::NothingToClaim)?;

        if contribution <= 0 || proposal.current_funded <= 0 {
            return Err(FinancingError::NothingToClaim);
        }

        // Calculate total earned share = (contribution * total_repaid) / current_funded
        let total_share = (contribution * proposal.total_repaid) / proposal.current_funded;

        let cl_key = DataKey::RepaymentClaimed(proposal_id.clone(), contributor.clone());
        let already_claimed: i128 = env.storage().persistent().get(&cl_key).unwrap_or(0);

        let claimable = total_share - already_claimed;
        if claimable <= 0 {
            return Err(FinancingError::NothingToClaim);
        }

        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(&env.current_contract_address(), &contributor, &claimable);

        env.storage()
            .persistent()
            .set(&cl_key, &(already_claimed + claimable));

        env.events().publish(
            (TOPIC_FINANCING, EVT_CLAIMED),
            (proposal_id, contributor, claimable),
        );

        Ok(claimable)
    }

    /// Refund contribution if deadline expires without meeting minimum threshold
    pub fn refund_unsuccessful(
        env: Env,
        contributor: Address,
        proposal_id: String,
    ) -> Result<i128, FinancingError> {
        contributor.require_auth();

        let p_key = DataKey::Proposal(proposal_id.clone());
        let mut proposal: FinancingProposal = env
            .storage()
            .persistent()
            .get(&p_key)
            .ok_or(FinancingError::NotFound)?;

        // Must be past deadline and under threshold
        if env.ledger().timestamp() <= proposal.deadline {
            return Err(FinancingError::CampaignNotActive);
        }
        if proposal.current_funded >= proposal.min_threshold {
            return Err(FinancingError::CampaignSuccessful);
        }

        let c_key = DataKey::Contribution(proposal_id.clone(), contributor.clone());
        let contribution: i128 = env
            .storage()
            .persistent()
            .get(&c_key)
            .ok_or(FinancingError::NothingToClaim)?;

        if contribution <= 0 {
            return Err(FinancingError::NothingToClaim);
        }

        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(&env.current_contract_address(), &contributor, &contribution);

        env.storage().persistent().set(&c_key, &0i128);

        proposal.status = ProposalStatus::ExpiredRefund;
        env.storage().persistent().set(&p_key, &proposal);

        env.events().publish(
            (TOPIC_FINANCING, EVT_REFUNDED),
            (proposal_id, contributor, contribution),
        );

        Ok(contribution)
    }

    /// Calculate repayment yield split in 10,000 basis points
    pub fn calculate_repayment_split(
        total_payout: i128,
        principal_bps: u32,
        yield_bps: u32,
    ) -> Result<(i128, i128), FinancingError> {
        if principal_bps + yield_bps > 10_000 {
            return Err(FinancingError::InvalidAmount);
        }
        if total_payout <= 0 {
            return Err(FinancingError::InvalidAmount);
        }
        let yield_amount = (total_payout * (yield_bps as i128)) / 10_000;
        let principal_amount = total_payout - yield_amount; // Absorb any fractional dust remainder
        Ok((principal_amount, yield_amount))
    }

    /// Claim refund for unfulfilled campaign expired past deadline
    pub fn claim_expired_campaign_refund(
        env: Env,
        contributor: Address,
        proposal_id: String,
    ) -> Result<i128, FinancingError> {
        contributor.require_auth();

        let p_key = DataKey::Proposal(proposal_id.clone());
        let mut proposal: FinancingProposal = env
            .storage()
            .persistent()
            .get(&p_key)
            .ok_or(FinancingError::NotFound)?;

        if env.ledger().timestamp() <= proposal.deadline {
            return Err(FinancingError::CampaignNotActive);
        }

        if proposal.current_funded >= proposal.min_threshold {
            return Err(FinancingError::CampaignSuccessful);
        }

        let c_key = DataKey::Contribution(proposal_id.clone(), contributor.clone());
        let contribution: i128 = env
            .storage()
            .persistent()
            .get(&c_key)
            .ok_or(FinancingError::NothingToClaim)?;

        if contribution <= 0 {
            return Err(FinancingError::NothingToClaim);
        }

        let token_client = token::Client::new(&env, &proposal.token);
        token_client.transfer(&env.current_contract_address(), &contributor, &contribution);

        env.storage().persistent().remove(&c_key);
        proposal.status = ProposalStatus::ExpiredRefund;
        env.storage().persistent().set(&p_key, &proposal);

        env.events().publish(
            (TOPIC_FINANCING, EVT_REFUNDED),
            (proposal_id, contributor, contribution),
        );

        Ok(contribution)
    }

    /// Read proposal details
    pub fn get_proposal(env: Env, proposal_id: String) -> Result<FinancingProposal, FinancingError> {
        let key = DataKey::Proposal(proposal_id);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(FinancingError::NotFound)
    }

    /// Check if proposal exists
    pub fn has_proposal(env: Env, proposal_id: String) -> bool {
        let key = DataKey::Proposal(proposal_id);
        env.storage().persistent().has(&key)
    }

    /// Query contributor's total amount for a proposal
    pub fn get_contribution(env: Env, proposal_id: String, contributor: Address) -> i128 {
        let key = DataKey::Contribution(proposal_id, contributor);
        env.storage().persistent().get(&key).unwrap_or(0)
    }

    /// Query contributor's claimed repayment share
    pub fn get_repayment_claimed(env: Env, proposal_id: String, contributor: Address) -> i128 {
        let key = DataKey::RepaymentClaimed(proposal_id, contributor);
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{token, Env, String};

    fn create_test_token<'a>(env: &Env, admin: &Address) -> (Address, token::StellarAssetClient<'a>) {
        let contract_id = env.register_stellar_asset_contract_v2(admin.clone());
        let client = token::StellarAssetClient::new(env, &contract_id.address());
        (contract_id.address(), client)
    }

    #[test]
    fn test_create_proposal_and_query() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);

        let contract_id = env.register(ProductionFinancingContract, ());
        let client = ProductionFinancingContractClient::new(&env, &contract_id);

        let applicant = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_addr, _) = create_test_token(&env, &admin);

        let proposal_id = String::from_str(&env, "prop-fw26-silk");
        let purpose = String::from_str(&env, "Mulberry silk procurement & ethical tailoring");
        let meta_uri = String::from_str(&env, "ipfs://QmSilkProp123");

        client.create_proposal(
            &applicant,
            &proposal_id,
            &token_addr,
            &50_000_0000000,
            &30_000_0000000,
            &2_000,
            &55_000_0000000,
            &purpose,
            &meta_uri,
        );

        assert!(client.has_proposal(&proposal_id));
        let p = client.get_proposal(&proposal_id);
        assert_eq!(p.target_amount, 50_000_0000000);
        assert_eq!(p.min_threshold, 30_000_0000000);
        assert_eq!(p.current_funded, 0);
        assert_eq!(p.status, ProposalStatus::FundingActive);
    }

    #[test]
    fn test_contribute_and_release_flow() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);

        let contract_id = env.register(ProductionFinancingContract, ());
        let client = ProductionFinancingContractClient::new(&env, &contract_id);

        let applicant = Address::generate(&env);
        let contributor = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_addr, token_admin) = create_test_token(&env, &admin);

        token_admin.mint(&contributor, &60_000_0000000);

        let proposal_id = String::from_str(&env, "prop-denim-run");
        let purpose = String::from_str(&env, "Organic denim manufacturing run");
        let meta_uri = String::from_str(&env, "ipfs://QmDenimRun");

        client.create_proposal(
            &applicant,
            &proposal_id,
            &token_addr,
            &50_000_0000000,
            &25_000_0000000,
            &2_000,
            &55_000_0000000,
            &purpose,
            &meta_uri,
        );

        // Contributor funds proposal
        client.contribute_funds(&contributor, &proposal_id, &50_000_0000000);

        let p = client.get_proposal(&proposal_id);
        assert_eq!(p.current_funded, 50_000_0000000);
        assert_eq!(p.status, ProposalStatus::Funded);

        // Applicant releases funds
        client.release_funds(&applicant, &proposal_id);

        let p_after = client.get_proposal(&proposal_id);
        assert_eq!(p_after.status, ProposalStatus::ProductionActive);

        let token_client = token::Client::new(&env, &token_addr);
        assert_eq!(token_client.balance(&applicant), 50_000_0000000);
    }

    #[test]
    fn test_repayment_and_proportional_claim() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);

        let contract_id = env.register(ProductionFinancingContract, ());
        let client = ProductionFinancingContractClient::new(&env, &contract_id);

        let applicant = Address::generate(&env);
        let contributor_a = Address::generate(&env);
        let contributor_b = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_addr, token_admin) = create_test_token(&env, &admin);

        token_admin.mint(&contributor_a, &60_000_0000000);
        token_admin.mint(&contributor_b, &40_000_0000000);
        token_admin.mint(&applicant, &120_000_0000000);

        let proposal_id = String::from_str(&env, "prop-cashmere");
        let purpose = String::from_str(&env, "Knitwear cashmere yarn");
        let meta_uri = String::from_str(&env, "ipfs://QmCashmere");

        client.create_proposal(
            &applicant,
            &proposal_id,
            &token_addr,
            &100_000_0000000,
            &50_000_0000000,
            &2_000,
            &110_000_0000000, // 10% premium repayment
            &purpose,
            &meta_uri,
        );

        // Contributor A contributes 60%
        client.contribute_funds(&contributor_a, &proposal_id, &60_000_0000000);
        // Contributor B contributes 40%
        client.contribute_funds(&contributor_b, &proposal_id, &40_000_0000000);

        // Release funds
        client.release_funds(&applicant, &proposal_id);

        // Applicant makes full repayment of 110
        client.make_repayment(&applicant, &proposal_id, &110_000_0000000);

        let p = client.get_proposal(&proposal_id);
        assert_eq!(p.status, ProposalStatus::Repaid);

        // Contributor A claims share: 60% of 110 = 66
        let claimed_a = client.claim_repayment_share(&contributor_a, &proposal_id);
        assert_eq!(claimed_a, 66_000_0000000);

        // Contributor B claims share: 40% of 110 = 44
        let claimed_b = client.claim_repayment_share(&contributor_b, &proposal_id);
        assert_eq!(claimed_b, 44_000_0000000);
    }

    #[test]
    fn test_unsuccessful_campaign_refund() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);

        let contract_id = env.register(ProductionFinancingContract, ());
        let client = ProductionFinancingContractClient::new(&env, &contract_id);

        let applicant = Address::generate(&env);
        let contributor = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_addr, token_admin) = create_test_token(&env, &admin);

        token_admin.mint(&contributor, &20_000_0000000);

        let proposal_id = String::from_str(&env, "prop-failed-run");
        let purpose = String::from_str(&env, "High threshold project");
        let meta_uri = String::from_str(&env, "ipfs://QmFailed");

        client.create_proposal(
            &applicant,
            &proposal_id,
            &token_addr,
            &100_000_0000000,
            &50_000_0000000, // min threshold is 50
            &2_000,          // deadline at 2,000
            &110_000_0000000,
            &purpose,
            &meta_uri,
        );

        // Contributes only 20 (under 50 threshold)
        client.contribute_funds(&contributor, &proposal_id, &20_000_0000000);

        // Fast forward ledger past deadline
        env.ledger().set_timestamp(2_500);

        // Contributor requests refund
        let refunded = client.refund_unsuccessful(&contributor, &proposal_id);
        assert_eq!(refunded, 20_000_0000000);

        let token_client = token::Client::new(&env, &token_addr);
        assert_eq!(token_client.balance(&contributor), 20_000_0000000);
    }

    #[test]
    fn test_duplicate_and_invalid_proposals_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);

        let contract_id = env.register(ProductionFinancingContract, ());
        let client = ProductionFinancingContractClient::new(&env, &contract_id);

        let applicant = Address::generate(&env);
        let admin = Address::generate(&env);
        let (token_addr, _) = create_test_token(&env, &admin);

        let proposal_id = String::from_str(&env, "prop-dup");
        let purpose = String::from_str(&env, "Duplication test");
        let meta_uri = String::from_str(&env, "ipfs://QmDup");

        client.create_proposal(
            &applicant,
            &proposal_id,
            &token_addr,
            &100_000_000_0000000,
            &50_000_000_0000000,
            &2_000,
            &11_000_0000000,
            &purpose,
            &meta_uri,
        );

        // Duplicate registration must fail
        let res = client.try_create_proposal(
            &applicant,
            &proposal_id,
            &token_addr,
            &100_000_000_0000000,
            &50_000_000_0000000,
            &2_000,
            &11_000_0000000,
            &purpose,
            &meta_uri,
        );
        assert!(res.is_err());
    }
}
