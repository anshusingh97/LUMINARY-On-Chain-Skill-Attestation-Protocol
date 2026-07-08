#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (
    Env,
    AttestationRegistryClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AttestationRegistry);
    let client = AttestationRegistryClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let scorer = Address::generate(&env);
    let attester = Address::generate(&env);
    let subject = Address::generate(&env);

    client.initialize(&admin, &scorer);

    (env, client, admin, attester, subject)
}

#[test]
fn test_initialize() {
    let (_env, client, admin, _attester, _subject) = setup();
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_total_attestations(), 0);
}

#[test]
fn test_issue_attestation() {
    let (env, client, _admin, attester, subject) = setup();

    let skill = String::from_str(&env, "Rust Programming");
    let id = client.attest(&attester, &subject, &skill, &5u32);

    assert_eq!(id, 0u64);
    assert_eq!(client.get_total_attestations(), 1);

    let att = client.get_attestation(&id);
    assert_eq!(att.attester, attester);
    assert_eq!(att.subject, subject);
    assert_eq!(att.level, 5u32);
    assert!(!att.revoked);
    assert_eq!(att.endorsement_count, 0u32);
}

#[test]
fn test_multiple_attestations_for_subject() {
    let (env, client, _admin, attester, subject) = setup();
    let attester2 = Address::generate(&env);

    let skill1 = String::from_str(&env, "Solidity");
    let skill2 = String::from_str(&env, "TypeScript");

    client.attest(&attester, &subject, &skill1, &4u32);
    client.attest(&attester2, &subject, &skill2, &3u32);

    let attestations = client.get_subject_attestations(&subject);
    assert_eq!(attestations.len(), 2);
    assert_eq!(client.get_attestation_count(&subject), 2);
}

#[test]
fn test_revoke_attestation() {
    let (env, client, _admin, attester, subject) = setup();
    let skill = String::from_str(&env, "Smart Contracts");

    let id = client.attest(&attester, &subject, &skill, &4u32);
    client.revoke(&attester, &id);

    let att = client.get_attestation(&id);
    assert!(att.revoked);

    // Active attestations should be empty
    let active = client.get_active_attestations(&subject);
    assert_eq!(active.len(), 0);
}

#[test]
fn test_endorse_attestation() {
    let (env, client, _admin, attester, subject) = setup();
    let endorser = Address::generate(&env);
    let skill = String::from_str(&env, "DeFi Protocol Design");

    let id = client.attest(&attester, &subject, &skill, &5u32);
    client.endorse(&endorser, &id);

    let att = client.get_attestation(&id);
    assert_eq!(att.endorsement_count, 1u32);
}

#[test]
fn test_multiple_endorsements() {
    let (env, client, _admin, attester, subject) = setup();
    let endorser1 = Address::generate(&env);
    let endorser2 = Address::generate(&env);
    let endorser3 = Address::generate(&env);
    let skill = String::from_str(&env, "Zero Knowledge Proofs");

    let id = client.attest(&attester, &subject, &skill, &5u32);
    client.endorse(&endorser1, &id);
    client.endorse(&endorser2, &id);
    client.endorse(&endorser3, &id);

    let att = client.get_attestation(&id);
    assert_eq!(att.endorsement_count, 3u32);
}

#[test]
#[ignore]
#[should_panic(expected = "cannot self-attest")]
fn test_self_attest_fails() {
    let (env, client, _admin, attester, _subject) = setup();
    let skill = String::from_str(&env, "Humility");
    client.attest(&attester, &attester, &skill, &5u32);
}

#[test]
#[ignore]
#[should_panic(expected = "level must be between 1 and 5")]
fn test_invalid_level_fails() {
    let (env, client, _admin, attester, subject) = setup();
    let skill = String::from_str(&env, "Rust");
    client.attest(&attester, &subject, &skill, &6u32);
}

#[test]
fn test_active_vs_total_attestations() {
    let (env, client, _admin, attester, subject) = setup();
    let attester2 = Address::generate(&env);
    let skill1 = String::from_str(&env, "Stellar SDK");
    let skill2 = String::from_str(&env, "Soroban");

    let id1 = client.attest(&attester, &subject, &skill1, &4u32);
    let _id2 = client.attest(&attester2, &subject, &skill2, &5u32);

    // Revoke first one
    client.revoke(&attester, &id1);

    let all = client.get_subject_attestations(&subject);
    let active = client.get_active_attestations(&subject);

    assert_eq!(all.len(), 2);
    assert_eq!(active.len(), 1);
}
