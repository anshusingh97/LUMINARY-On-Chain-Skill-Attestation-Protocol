export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const SOROBAN_RPC_URL   = 'https://soroban-testnet.stellar.org'
export const HORIZON_URL       = 'https://horizon-testnet.stellar.org'
export const FRIENDBOT_URL     = 'https://friendbot.stellar.org'

// Deployed contract addresses (testnet — update after deployment)
export const ATTESTATION_REGISTRY_ID = import.meta.env.VITE_ATTESTATION_REGISTRY_ID ||
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'
export const REPUTATION_SCORER_ID    = import.meta.env.VITE_REPUTATION_SCORER_ID    ||
  'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM'

export const TIER_LABELS: Record<string, string> = {
  Unranked:     'Unranked',
  Apprentice:   'Apprentice',
  Practitioner: 'Practitioner',
  Expert:       'Expert',
  Master:       'Master',
  Luminary:     'Luminary',
}

export const TIER_COLORS: Record<string, string> = {
  Unranked:     '#4B5580',
  Apprentice:   '#60A5FA',
  Practitioner: '#34D399',
  Expert:       '#A78BFA',
  Master:       '#F472B6',
  Luminary:     '#E8D9A0',
}

export const SKILL_CATEGORIES = [
  'Smart Contract Development',
  'DeFi Protocol Design',
  'Frontend Engineering',
  'Rust Programming',
  'Soroban Development',
  'Stellar SDK',
  'Zero Knowledge Proofs',
  'Cryptography',
  'Security Auditing',
  'Technical Writing',
  'System Architecture',
  'DevOps & CI/CD',
  'TypeScript / JavaScript',
  'Blockchain Research',
  'Tokenomics',
]
