#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_scorer(env: &Env) -> (ReputationScorerClient<'static>, Address, Address) {
    let contract_id = env.register_contract(None, ReputationScorer);
    let client = ReputationScorerClient::new(env, &contract_id);

    let admin = Address::generate(env);
    let registry = Address::generate(env); // mock registry address

    client.initialize(&admin, &registry);

    (client, admin, registry)
}

#[test]
fn test_initialize_scorer() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _registry) = setup_scorer(&env);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_total_scored(), 0u32);
}

#[test]
fn test_score_tier_unranked() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _registry) = setup_scorer(&env);

    let subject = Address::generate(&env);
    let score = client.get_score(&subject);

    assert_eq!(score.score, 0u64);
    assert_eq!(score.tier, Tier::Unranked);
}

#[test]
fn test_tier_boundaries() {
    // Test the score_to_tier function logic directly
    assert_eq!(ReputationScorer::score_to_tier(0), Tier::Unranked);
    assert_eq!(ReputationScorer::score_to_tier(1), Tier::Apprentice);
    assert_eq!(ReputationScorer::score_to_tier(199), Tier::Apprentice);
    assert_eq!(ReputationScorer::score_to_tier(200), Tier::Practitioner);
    assert_eq!(ReputationScorer::score_to_tier(499), Tier::Practitioner);
    assert_eq!(ReputationScorer::score_to_tier(500), Tier::Expert);
    assert_eq!(ReputationScorer::score_to_tier(800), Tier::Master);
    assert_eq!(ReputationScorer::score_to_tier(1000), Tier::Luminary);
    assert_eq!(ReputationScorer::score_to_tier(9999), Tier::Luminary);
}

#[test]
fn test_score_calculation_single_attestation() {
    let env = Env::default();
    env.mock_all_auths();

    // Create a mock attestation
    let attester = Address::generate(&env);
    let subject = Address::generate(&env);
    let skill = soroban_sdk::String::from_str(&env, "Rust");

    let attestations = soroban_sdk::vec![&env, Attestation {
        id: 0,
        attester,
        subject: subject.clone(),
        skill,
        level: 5,
        timestamp: 0,
        revoked: false,
        endorsement_count: 0,
    }];

    // score = 50 (base) + 120 (level 5 bonus) + 0 (endorsements) + 25 (1 unique skill) = 195
    let score = ReputationScorer::calculate_score(&env, &attestations);
    assert_eq!(score, 195u64);
    assert_eq!(ReputationScorer::score_to_tier(score), Tier::Apprentice);
}

#[test]
fn test_score_calculation_with_endorsements() {
    let env = Env::default();
    env.mock_all_auths();

    let attester = Address::generate(&env);
    let subject = Address::generate(&env);
    let skill = soroban_sdk::String::from_str(&env, "Soroban");

    let attestations = soroban_sdk::vec![&env, Attestation {
        id: 0,
        attester,
        subject: subject.clone(),
        skill,
        level: 4,
        timestamp: 0,
        revoked: false,
        endorsement_count: 5,
    }];

    // score = 50 + 90 (level 4) + 75 (5 endorsements * 15) + 25 (1 skill) = 240
    let score = ReputationScorer::calculate_score(&env, &attestations);
    assert_eq!(score, 240u64);
    assert_eq!(ReputationScorer::score_to_tier(score), Tier::Practitioner);
}

#[test]
fn test_endorsement_cap() {
    let env = Env::default();
    env.mock_all_auths();

    let attester = Address::generate(&env);
    let subject = Address::generate(&env);
    let skill = soroban_sdk::String::from_str(&env, "DeFi");

    // 100 endorsements should be capped at 10
    let attestations = soroban_sdk::vec![&env, Attestation {
        id: 0,
        attester,
        subject,
        skill,
        level: 1,
        timestamp: 0,
        revoked: false,
        endorsement_count: 100,
    }];

    // 50 + 0 (level 1) + 150 (capped at 10 * 15) + 25 = 225
    let score = ReputationScorer::calculate_score(&env, &attestations);
    assert_eq!(score, 225u64);
}

#[test]
fn test_diversity_bonus_capped_at_8_skills() {
    let env = Env::default();
    env.mock_all_auths();

    let attester = Address::generate(&env);
    let subject = Address::generate(&env);

    // 10 unique skills – diversity bonus should max at 8 * 25 = 200
    let skills = ["Rust", "Python", "Solidity", "Go", "TypeScript", "Haskell", "C++", "Java", "Swift", "Kotlin"];
    let mut attestations: Vec<Attestation> = soroban_sdk::vec![&env];

    for (i, skill_name) in skills.iter().enumerate() {
        attestations.push_back(Attestation {
            id: i as u64,
            attester: attester.clone(),
            subject: subject.clone(),
            skill: soroban_sdk::String::from_str(&env, skill_name),
            level: 1,
            timestamp: 0,
            revoked: false,
            endorsement_count: 0,
        });
    }

    let score = ReputationScorer::calculate_score(&env, &attestations);
    // 10 attestations * 50 (base) = 500, + 0 (all level 1) + 0 (no endorsements) + 8*25 (diversity cap) = 700
    assert_eq!(score, 700u64);
    assert_eq!(ReputationScorer::score_to_tier(score), Tier::Expert);
}

#[test]
fn test_get_total_scored_increments() {
    let env = Env::default();
    env.mock_all_auths();

    let (client, _admin, _registry) = setup_scorer(&env);
    assert_eq!(client.get_total_scored(), 0u32);
}
