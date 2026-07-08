#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, contractclient,
    symbol_short, vec,
    Address, Env, String, Symbol, Vec,
    log,
};

// ─── Inter-Contract Interface ─────────────────────────────────────────────────
// This defines the client interface for calling the AttestationRegistry contract

#[contracttype]
#[derive(Clone, Debug)]
pub struct Attestation {
    pub id: u64,
    pub attester: Address,
    pub subject: Address,
    pub skill: String,
    pub level: u32,
    pub timestamp: u64,
    pub revoked: bool,
    pub endorsement_count: u32,
}

#[contractclient(name = "AttestationRegistryClient")]
pub trait AttestationRegistryInterface {
    fn get_active_attestations(env: Env, subject: Address) -> Vec<Attestation>;
    fn get_attestation_count(env: Env, subject: Address) -> u32;
}

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN: Symbol    = symbol_short!("ADMIN");
const REGISTRY: Symbol = symbol_short!("REGISTRY");

#[contracttype]
pub enum DataKey {
    Score(Address),
    Tier(Address),
    LastUpdated(Address),
    TotalScored,
}

// ─── Score Tiers ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum Tier {
    Unranked,
    Apprentice,   // 1-199
    Practitioner, // 200-499
    Expert,       // 500-799
    Master,       // 800-999
    Luminary,     // 1000+
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct ReputationScore {
    pub subject: Address,
    pub score: u64,
    pub tier: Tier,
    pub attestation_count: u32,
    pub last_updated: u64,
}

// ─── Events ──────────────────────────────────────────────────────────────────

const SCORED: Symbol   = symbol_short!("SCORED");
const TIER_UP: Symbol  = symbol_short!("TIER_UP");

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct ReputationScorer;

#[contractimpl]
impl ReputationScorer {

    pub fn initialize(env: Env, admin: Address, registry_address: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&REGISTRY, &registry_address);
        env.storage().instance().set(&DataKey::TotalScored, &0u32);
    }

    /// Compute and store a reputation score for a subject
    /// This calls into the AttestationRegistry (inter-contract communication)
    pub fn compute_score(env: Env, subject: Address) -> ReputationScore {
        let registry_address: Address = env.storage().instance()
            .get(&REGISTRY)
            .expect("not initialized");

        // ── Inter-Contract Call ──────────────────────────────────────────────
        let registry = AttestationRegistryClient::new(&env, &registry_address);
        let attestations = registry.get_active_attestations(&subject);
        // ────────────────────────────────────────────────────────────────────

        let prev_tier = env.storage().persistent()
            .get(&DataKey::Tier(subject.clone()))
            .unwrap_or(Tier::Unranked);

        let score = Self::calculate_score(&env, &attestations);
        let tier = Self::score_to_tier(score);
        let attestation_count = attestations.len();
        let timestamp = env.ledger().timestamp();

        let reputation = ReputationScore {
            subject: subject.clone(),
            score,
            tier: tier.clone(),
            attestation_count,
            last_updated: timestamp,
        };

        let is_new = !env.storage().persistent().has(&DataKey::Score(subject.clone()));

        env.storage().persistent().set(&DataKey::Score(subject.clone()), &score);
        env.storage().persistent().set(&DataKey::Tier(subject.clone()), &tier.clone());
        env.storage().persistent().set(&DataKey::LastUpdated(subject.clone()), &timestamp);

        if is_new {
            let total: u32 = env.storage().instance().get(&DataKey::TotalScored).unwrap_or(0u32);
            env.storage().instance().set(&DataKey::TotalScored, &(total + 1));
        }

        // Emit score event
        env.events().publish(
            (SCORED, subject.clone()),
            (score, attestation_count),
        );

        // Emit tier-up event if tier improved
        if prev_tier != tier {
            env.events().publish(
                (TIER_UP, subject.clone()),
                (score,),
            );
        }

        log!(&env, "Score computed for subject: score={} tier", score);

        reputation
    }

    /// Core scoring algorithm:
    /// - Base: 50 points per active attestation
    /// - Level bonus: (level - 1) * 30 per attestation
    /// - Endorsement bonus: 15 per endorsement (capped at 10 per attestation)
    /// - Diversity bonus: 25 per unique skill (up to 8 skills)
    fn calculate_score(env: &Env, attestations: &Vec<Attestation>) -> u64 {
        if attestations.is_empty() {
            return 0;
        }

        let mut total_score: u64 = 0;
        let mut unique_skills: Vec<String> = vec![env];

        for att in attestations.iter() {
            // Base score
            total_score += 50;

            // Level bonus (level 1 = +0, level 5 = +120)
            total_score += (att.level as u64 - 1) * 30;

            // Endorsement bonus (capped at 10 endorsements per attestation)
            let capped_endorsements = att.endorsement_count.min(10) as u64;
            total_score += capped_endorsements * 15;

            // Track unique skills for diversity bonus
            let mut found = false;
            for skill in unique_skills.iter() {
                if skill == att.skill {
                    found = true;
                    break;
                }
            }
            if !found {
                unique_skills.push_back(att.skill.clone());
            }
        }

        // Diversity bonus (up to 8 unique skills, 25 pts each = 200 max)
        let diversity_count = unique_skills.len().min(8) as u64;
        total_score += diversity_count * 25;

        total_score
    }

    fn score_to_tier(score: u64) -> Tier {
        match score {
            0       => Tier::Unranked,
            1..=199 => Tier::Apprentice,
            200..=499 => Tier::Practitioner,
            500..=799 => Tier::Expert,
            800..=999 => Tier::Master,
            _         => Tier::Luminary,
        }
    }

    // ─── Query Methods ───────────────────────────────────────────────────────

    pub fn get_score(env: Env, subject: Address) -> ReputationScore {
        let score: u64 = env.storage().persistent()
            .get(&DataKey::Score(subject.clone()))
            .unwrap_or(0u64);
        let tier: Tier = env.storage().persistent()
            .get(&DataKey::Tier(subject.clone()))
            .unwrap_or(Tier::Unranked);
        let last_updated: u64 = env.storage().persistent()
            .get(&DataKey::LastUpdated(subject.clone()))
            .unwrap_or(0u64);

        ReputationScore {
            subject: subject.clone(),
            score,
            tier,
            attestation_count: 0,
            last_updated,
        }
    }

    pub fn get_total_scored(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TotalScored).unwrap_or(0u32)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }
}

mod test;
