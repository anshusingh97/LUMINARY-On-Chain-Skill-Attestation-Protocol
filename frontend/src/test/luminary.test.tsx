import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { truncateAddress, tierToEmoji, MOCK_ATTESTATIONS, MOCK_LEADERBOARD } from '../lib/mockData'
import { TIER_COLORS } from '../lib/constants'
import TierBadge from '../components/TierBadge'
import LevelPips from '../components/LevelPips'

// ─── Utility Tests ────────────────────────────────────────────────────────────

describe('truncateAddress', () => {
  it('shortens a full Stellar address', () => {
    const addr   = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37'
    const result = truncateAddress(addr)
    expect(result).toBe('GDQP2K…4W37')
    expect(result.length).toBeLessThan(addr.length)
  })

  it('respects custom char count', () => {
    const addr   = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37'
    const result = truncateAddress(addr, 4)
    expect(result.startsWith('GDQP')).toBe(true)
    expect(result.includes('…')).toBe(true)
  })
})

describe('tierToEmoji', () => {
  it('returns correct emoji for each tier', () => {
    expect(tierToEmoji('Unranked')).toBe('○')
    expect(tierToEmoji('Apprentice')).toBe('◈')
    expect(tierToEmoji('Practitioner')).toBe('◆')
    expect(tierToEmoji('Expert')).toBe('✦')
    expect(tierToEmoji('Master')).toBe('★')
    expect(tierToEmoji('Luminary')).toBe('✸')
  })

  it('falls back to ○ for unknown tier', () => {
    expect(tierToEmoji('Unknown')).toBe('○')
  })
})

// ─── Mock Data Tests ──────────────────────────────────────────────────────────

describe('MOCK_ATTESTATIONS', () => {
  it('has at least 4 attestations', () => {
    expect(MOCK_ATTESTATIONS.length).toBeGreaterThanOrEqual(4)
  })

  it('all attestations have required fields', () => {
    MOCK_ATTESTATIONS.forEach(att => {
      expect(att).toHaveProperty('id')
      expect(att).toHaveProperty('attester')
      expect(att).toHaveProperty('subject')
      expect(att).toHaveProperty('skill')
      expect(att.level).toBeGreaterThanOrEqual(1)
      expect(att.level).toBeLessThanOrEqual(5)
    })
  })

  it('none of the mock attestations are revoked', () => {
    MOCK_ATTESTATIONS.forEach(att => {
      expect(att.revoked).toBe(false)
    })
  })
})

describe('MOCK_LEADERBOARD', () => {
  it('is sorted by score descending', () => {
    for (let i = 0; i < MOCK_LEADERBOARD.length - 1; i++) {
      expect(MOCK_LEADERBOARD[i].score).toBeGreaterThanOrEqual(MOCK_LEADERBOARD[i + 1].score)
    }
  })

  it('all entries have valid tiers', () => {
    const validTiers = ['Unranked','Apprentice','Practitioner','Expert','Master','Luminary']
    MOCK_LEADERBOARD.forEach(entry => {
      expect(validTiers).toContain(entry.tier)
    })
  })
})

// ─── Constants Tests ──────────────────────────────────────────────────────────

describe('TIER_COLORS', () => {
  it('defines colors for all six tiers', () => {
    const tiers = ['Unranked','Apprentice','Practitioner','Expert','Master','Luminary']
    tiers.forEach(tier => {
      expect(TIER_COLORS[tier]).toBeDefined()
      expect(TIER_COLORS[tier]).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })
})

// ─── Component Tests ──────────────────────────────────────────────────────────

describe('TierBadge', () => {
  it('renders tier name', () => {
    render(<TierBadge tier="Expert" />)
    expect(screen.getByText('Expert')).toBeInTheDocument()
  })

  it('renders tier icon by default', () => {
    render(<TierBadge tier="Master" />)
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('hides icon when showIcon=false', () => {
    render(<TierBadge tier="Luminary" showIcon={false} />)
    expect(screen.queryByText('✸')).not.toBeInTheDocument()
    expect(screen.getByText('Luminary')).toBeInTheDocument()
  })

  it('applies correct color for Luminary tier', () => {
    const { container } = render(<TierBadge tier="Luminary" />)
    const badge = container.querySelector('.tier-badge')
    expect(badge).toHaveStyle({ color: '#E8D9A0' })
  })
})

describe('LevelPips', () => {
  it('renders correct number of filled pips', () => {
    const { container } = render(<LevelPips level={3} />)
    const filled = container.querySelectorAll('.level-pip.filled')
    const empty  = container.querySelectorAll('.level-pip.empty')
    expect(filled.length).toBe(3)
    expect(empty.length).toBe(2)
  })

  it('renders all filled pips at level 5', () => {
    const { container } = render(<LevelPips level={5} />)
    const filled = container.querySelectorAll('.level-pip.filled')
    expect(filled.length).toBe(5)
  })

  it('renders all empty pips at level 0', () => {
    const { container } = render(<LevelPips level={0} />)
    const filled = container.querySelectorAll('.level-pip.filled')
    expect(filled.length).toBe(0)
  })

  it('shows correct level label', () => {
    render(<LevelPips level={4} />)
    expect(screen.getByText('Advanced')).toBeInTheDocument()
  })
})

// ─── Scoring Algorithm Tests (pure JS mirror of Rust logic) ──────────────────

describe('Scoring Algorithm', () => {
  function calculateScore(attestations: {level: number; endorsement_count: number; skill: string}[]) {
    if (attestations.length === 0) return 0
    let total = 0
    const uniqueSkills = new Set<string>()
    for (const att of attestations) {
      total += 50
      total += (att.level - 1) * 30
      total += Math.min(att.endorsement_count, 10) * 15
      uniqueSkills.add(att.skill)
    }
    total += Math.min(uniqueSkills.size, 8) * 25
    return total
  }

  it('returns 0 for no attestations', () => {
    expect(calculateScore([])).toBe(0)
  })

  it('calculates correctly for single level-5 attestation', () => {
    // 50 + 120 + 0 + 25 = 195
    expect(calculateScore([{ level: 5, endorsement_count: 0, skill: 'Rust' }])).toBe(195)
  })

  it('caps endorsements at 10', () => {
    // 50 + 0 + 150 + 25 = 225
    expect(calculateScore([{ level: 1, endorsement_count: 100, skill: 'Go' }])).toBe(225)
  })

  it('caps diversity bonus at 8 skills', () => {
    const skills = ['A','B','C','D','E','F','G','H','I','J']
    const atts = skills.map(s => ({ level: 1, endorsement_count: 0, skill: s }))
    // 10*50 + 0 + 0 + 8*25 = 700
    expect(calculateScore(atts)).toBe(700)
  })

  it('awards diversity bonus for unique skills only', () => {
    // 2 attestations same skill = 1 unique
    const atts = [
      { level: 2, endorsement_count: 0, skill: 'Rust' },
      { level: 2, endorsement_count: 0, skill: 'Rust' },
    ]
    // 2*50 + 2*30 + 1*25 = 185
    expect(calculateScore(atts)).toBe(185)
  })
})

// ─── Tier Boundary Tests ──────────────────────────────────────────────────────

describe('Tier Boundaries', () => {
  function scoreToTier(score: number) {
    if (score === 0)         return 'Unranked'
    if (score <= 199)        return 'Apprentice'
    if (score <= 499)        return 'Practitioner'
    if (score <= 799)        return 'Expert'
    if (score <= 999)        return 'Master'
    return 'Luminary'
  }

  it('score 0 → Unranked',     () => expect(scoreToTier(0)).toBe('Unranked'))
  it('score 1 → Apprentice',   () => expect(scoreToTier(1)).toBe('Apprentice'))
  it('score 199 → Apprentice', () => expect(scoreToTier(199)).toBe('Apprentice'))
  it('score 200 → Practitioner',() => expect(scoreToTier(200)).toBe('Practitioner'))
  it('score 500 → Expert',     () => expect(scoreToTier(500)).toBe('Expert'))
  it('score 800 → Master',     () => expect(scoreToTier(800)).toBe('Master'))
  it('score 1000 → Luminary',  () => expect(scoreToTier(1000)).toBe('Luminary'))
  it('score 9999 → Luminary',  () => expect(scoreToTier(9999)).toBe('Luminary'))
})
