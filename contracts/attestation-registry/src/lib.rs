#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, events, log, symbol_short, vec, Address, Env, Map,
    String, Symbol, Vec,
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const ADMIN: Symbol = symbol_short!("ADMIN");
const SCORER: Symbol = symbol_short!("SCORER");

// ─── Data Types ──────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
pub struct Attestation {
    pub id: u64,
    pub attester: Address,
    pub subject: Address,
    pub skill: String,
    pub level: u32, // 1-5 proficiency level
    pub timestamp: u64,
    pub revoked: bool,
    pub endorsement_count: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct AttestationSummary {
    pub total: u32,
    pub skills: Vec<String>,
}

#[contracttype]
pub enum DataKey {
    Attestation(u64),
    SubjectAttestations(Address),
    AttesterAttestations(Address),
    NextId,
    TrustedAttesters,
}

// ─── Events ──────────────────────────────────────────────────────────────────

const ATTESTED: Symbol = symbol_short!("ATTESTED");
const REVOKED_EV: Symbol = symbol_short!("REVOKED");
const ENDORSED: Symbol = symbol_short!("ENDORSED");

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct AttestationRegistry;

#[contractimpl]
impl AttestationRegistry {
    /// Initialize the registry with an admin and optional reputation scorer address
    pub fn initialize(env: Env, admin: Address, scorer_address: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&SCORER, &scorer_address);
        env.storage().instance().set(&DataKey::NextId, &0u64);

        // Initialize trusted attesters list
        let trusted: Vec<Address> = vec![&env];
        env.storage()
            .instance()
            .set(&DataKey::TrustedAttesters, &trusted);
    }

    /// Add a trusted attester (only admin)
    pub fn add_trusted_attester(env: Env, attester: Address) {
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        admin.require_auth();

        let mut trusted: Vec<Address> = env
            .storage()
            .instance()
            .get(&DataKey::TrustedAttesters)
            .unwrap_or(vec![&env]);
        trusted.push_back(attester);
        env.storage()
            .instance()
            .set(&DataKey::TrustedAttesters, &trusted);
    }

    /// Issue a skill attestation for a subject
    pub fn attest(env: Env, attester: Address, subject: Address, skill: String, level: u32) -> u64 {
        attester.require_auth();

        // Validate level range
        if level < 1 || level > 5 {
            panic!("level must be between 1 and 5");
        }

        // Cannot attest yourself
        if attester == subject {
            panic!("cannot self-attest");
        }

        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64);
        let timestamp = env.ledger().timestamp();

        let attestation = Attestation {
            id,
            attester: attester.clone(),
            subject: subject.clone(),
            skill: skill.clone(),
            level,
            timestamp,
            revoked: false,
            endorsement_count: 0,
        };

        // Store attestation
        env.storage()
            .persistent()
            .set(&DataKey::Attestation(id), &attestation);

        // Update subject's attestation list
        let mut subject_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::SubjectAttestations(subject.clone()))
            .unwrap_or(vec![&env]);
        subject_list.push_back(id);
        env.storage().persistent().set(
            &DataKey::SubjectAttestations(subject.clone()),
            &subject_list,
        );

        // Update attester's given list
        let mut attester_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::AttesterAttestations(attester.clone()))
            .unwrap_or(vec![&env]);
        attester_list.push_back(id);
        env.storage().persistent().set(
            &DataKey::AttesterAttestations(attester.clone()),
            &attester_list,
        );

        // Increment ID counter
        env.storage().instance().set(&DataKey::NextId, &(id + 1));

        // Emit event
        env.events().publish(
            (ATTESTED, attester.clone()),
            (id, subject.clone(), skill.clone(), level),
        );

        log!(
            &env,
            "Attestation issued: id={} subject={} skill={} level={}",
            id,
            subject,
            skill,
            level
        );

        id
    }

    /// Revoke an attestation (only original attester)
    pub fn revoke(env: Env, attester: Address, attestation_id: u64) {
        attester.require_auth();

        let mut attestation: Attestation = env
            .storage()
            .persistent()
            .get(&DataKey::Attestation(attestation_id))
            .expect("attestation not found");

        if attestation.attester != attester {
            panic!("only the attester can revoke");
        }
        if attestation.revoked {
            panic!("already revoked");
        }

        attestation.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.events()
            .publish((REVOKED_EV, attester), (attestation_id,));
    }

    /// Endorse an existing attestation
    pub fn endorse(env: Env, endorser: Address, attestation_id: u64) {
        endorser.require_auth();

        let mut attestation: Attestation = env
            .storage()
            .persistent()
            .get(&DataKey::Attestation(attestation_id))
            .expect("attestation not found");

        if attestation.revoked {
            panic!("cannot endorse a revoked attestation");
        }
        if attestation.attester == endorser || attestation.subject == endorser {
            panic!("attester and subject cannot endorse");
        }

        attestation.endorsement_count += 1;
        env.storage()
            .persistent()
            .set(&DataKey::Attestation(attestation_id), &attestation);

        env.events().publish(
            (ENDORSED, endorser),
            (attestation_id, attestation.endorsement_count),
        );
    }

    // ─── Query Methods ───────────────────────────────────────────────────────

    pub fn get_attestation(env: Env, id: u64) -> Attestation {
        env.storage()
            .persistent()
            .get(&DataKey::Attestation(id))
            .expect("attestation not found")
    }

    pub fn get_subject_attestations(env: Env, subject: Address) -> Vec<Attestation> {
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::SubjectAttestations(subject.clone()))
            .unwrap_or(vec![&env]);

        let mut result: Vec<Attestation> = vec![&env];
        for id in ids.iter() {
            if let Some(att) = env.storage().persistent().get(&DataKey::Attestation(id)) {
                result.push_back(att);
            }
        }
        result
    }

    pub fn get_active_attestations(env: Env, subject: Address) -> Vec<Attestation> {
        let all = Self::get_subject_attestations(env.clone(), subject);
        let mut active: Vec<Attestation> = vec![&env];
        for att in all.iter() {
            if !att.revoked {
                active.push_back(att);
            }
        }
        active
    }

    pub fn get_attestation_count(env: Env, subject: Address) -> u32 {
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::SubjectAttestations(subject))
            .unwrap_or(vec![&env]);
        ids.len()
    }

    pub fn get_total_attestations(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::NextId)
            .unwrap_or(0u64)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }
}

mod test;
