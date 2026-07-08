import { useState } from 'react'
import { Search, Trophy, ThumbsUp, Loader2 } from 'lucide-react'
import TierBadge from '../components/TierBadge'
import { MOCK_LEADERBOARD, MOCK_ATTESTATIONS, truncateAddress, tierToEmoji } from '../lib/mockData'
import { TIER_COLORS } from '../lib/constants'
import LevelPips from '../components/LevelPips'
import { useLuminaryStore } from '../lib/store'

export default function Leaderboard() {
  const [search, setSearch]         = useState('')
  const [endorsingId, setEndorsing] = useState<number | null>(null)
  const { addNotification, isConnected } = useLuminaryStore()

  const filtered = MOCK_LEADERBOARD.filter(r =>
    r.subject.toLowerCase().includes(search.toLowerCase())
  )

  const handleEndorse = async (attId: number) => {
    if (!isConnected) {
      addNotification('error', 'Connect your wallet to endorse')
      return
    }
    setEndorsing(attId)
    await new Promise(r => setTimeout(r, 1200))
    setEndorsing(null)
    addNotification('success', `Endorsement recorded on-chain!`)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 pt-8 space-y-8">

      <div>
        <h1 className="font-display font-bold text-3xl text-star mb-2">Leaderboard</h1>
        <p className="text-muted">Top reputation holders on the Luminary protocol</p>
      </div>

      {/* Podium */}
      <div className="grid grid-cols-3 gap-4 items-end">
        {[1, 0, 2].map((rank, colIdx) => {
          const entry = MOCK_LEADERBOARD[rank]
          if (!entry) return <div key={colIdx} />
          const color = TIER_COLORS[entry.tier]
          const heights = ['h-28', 'h-36', 'h-24']
          return (
            <div
              key={rank}
              className={`glass-card flex flex-col items-center justify-end p-4 ${heights[colIdx]} relative`}
              style={{ borderColor: `${color}30` }}
            >
              {colIdx === 0 && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Trophy size={24} className="text-star" style={{ filter: 'drop-shadow(0 0 8px #E8D9A0)' }} />
                </div>
              )}
              <div className="text-2xl mb-2">{tierToEmoji(entry.tier)}</div>
              <div className="text-xs font-mono text-dim mb-1">{truncateAddress(entry.subject, 4)}</div>
              <TierBadge tier={entry.tier} size="sm" />
              <div className="font-display font-bold mt-2" style={{ color }}>
                {entry.score.toLocaleString()}
              </div>
              <div className="text-xs text-dim">#{rank + 1}</div>
            </div>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
        <input
          className="input-field pl-10"
          placeholder="Search by address…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Full table */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 p-4 border-b border-white/[0.06] text-xs font-display text-dim uppercase tracking-wider">
          <span>#</span>
          <span>Account</span>
          <span className="hidden sm:block">Tier</span>
          <span>Score</span>
          <span></span>
        </div>
        {filtered.map((entry, i) => {
          const color = TIER_COLORS[entry.tier]
          return (
            <div
              key={entry.subject}
              className="grid grid-cols-[2rem_1fr_auto_auto] sm:grid-cols-[2rem_1fr_auto_auto_auto] gap-x-4 items-center p-4 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-mono text-sm text-dim">{i + 1}</span>
              <div>
                <div className="font-mono text-sm text-star">{truncateAddress(entry.subject)}</div>
                <div className="text-xs text-dim">{entry.attestation_count} attestations</div>
              </div>
              <div className="hidden sm:block">
                <TierBadge tier={entry.tier} size="sm" />
              </div>
              <div className="font-display font-bold text-sm" style={{ color }}>
                {entry.score.toLocaleString()}
              </div>
              <div className="hidden sm:block" />
            </div>
          )
        })}
      </div>

      {/* Recent attestations with endorsement */}
      <div>
        <h2 className="font-display font-bold text-xl text-star mb-4">All Attestations</h2>
        <div className="space-y-3">
          {MOCK_ATTESTATIONS.map(att => (
            <div key={att.id} className="glass-card p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-display font-medium text-sm text-star mb-1">{att.skill}</div>
                <div className="text-xs text-dim font-mono">
                  <span className="text-pulsar">{truncateAddress(att.attester)}</span>
                  <span className="mx-2">→</span>
                  <span>{truncateAddress(att.subject)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <LevelPips level={att.level} />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dim">{att.endorsement_count}</span>
                  <button
                    onClick={() => handleEndorse(att.id)}
                    disabled={endorsingId === att.id}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-white/10 text-dim hover:text-pulsar hover:border-pulsar/30 transition-all"
                  >
                    {endorsingId === att.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <ThumbsUp size={12} />
                    }
                    Endorse
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
