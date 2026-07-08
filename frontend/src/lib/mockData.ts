import type { Attestation, ReputationScore } from './store'

export const MOCK_ATTESTATIONS: Attestation[] = [
  {
    id: 0,
    attester: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    subject:  'GBUHRWJBKGRAOXA5VD4DQNWH7NG3QKZXHQMK6QNMKK2FOPWWK3UXPBS',
    skill:    'Soroban Development',
    level:    5,
    timestamp: 1719100000,
    revoked:  false,
    endorsement_count: 12,
  },
  {
    id: 1,
    attester: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    subject:  'GBUHRWJBKGRAOXA5VD4DQNWH7NG3QKZXHQMK6QNMKK2FOPWWK3UXPBS',
    skill:    'Rust Programming',
    level:    4,
    timestamp: 1719200000,
    revoked:  false,
    endorsement_count: 8,
  },
  {
    id: 2,
    attester: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGB9ABODAZDBEKVX7BBHPS',
    subject:  'GBUHRWJBKGRAOXA5VD4DQNWH7NG3QKZXHQMK6QNMKK2FOPWWK3UXPBS',
    skill:    'DeFi Protocol Design',
    level:    3,
    timestamp: 1719300000,
    revoked:  false,
    endorsement_count: 5,
  },
  {
    id: 3,
    attester: 'GBHSCSZBKS5SFXNM5OLZJR4E2MGBDKJBCQZQKGXFB5MBVKX4IIYOQK',
    subject:  'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    skill:    'Smart Contract Development',
    level:    5,
    timestamp: 1719050000,
    revoked:  false,
    endorsement_count: 20,
  },
  {
    id: 4,
    attester: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGB9ABODAZDBEKVX7BBHPS',
    subject:  'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    skill:    'Security Auditing',
    level:    4,
    timestamp: 1719150000,
    revoked:  false,
    endorsement_count: 7,
  },
]

export const MOCK_LEADERBOARD: ReputationScore[] = [
  { subject: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37', score: 1240, tier: 'Luminary',     attestation_count: 8,  last_updated: 1719350000 },
  { subject: 'GBUHRWJBKGRAOXA5VD4DQNWH7NG3QKZXHQMK6QNMKK2FOPWWK3UXPBS', score: 870,  tier: 'Master',       attestation_count: 5,  last_updated: 1719340000 },
  { subject: 'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGB9ABODAZDBEKVX7BBHPS',  score: 640,  tier: 'Expert',       attestation_count: 6,  last_updated: 1719330000 },
  { subject: 'GBHSCSZBKS5SFXNM5OLZJR4E2MGBDKJBCQZQKGXFB5MBVKX4IIYOQK',  score: 380,  tier: 'Practitioner', attestation_count: 4,  last_updated: 1719320000 },
  { subject: 'GCHNPAHOGVKZVN3KG4DNUXQRRLXBCFSCHHZRXZRN4MMRHVZQMFUKYOF',  score: 120,  tier: 'Apprentice',   attestation_count: 2,  last_updated: 1719310000 },
]

export function truncateAddress(addr: string, chars = 6): string {
  return `${addr.slice(0, chars)}…${addr.slice(-4)}`
}

export function tierToEmoji(tier: string): string {
  const map: Record<string, string> = {
    Unranked:     '○',
    Apprentice:   '◈',
    Practitioner: '◆',
    Expert:       '✦',
    Master:       '★',
    Luminary:     '✸',
  }
  return map[tier] || '○'
}
