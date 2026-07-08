import { ArrowRight, Shield, Zap, Users, Star } from 'lucide-react'
import { useLuminaryStore } from '../lib/store'
import { MOCK_ATTESTATIONS, truncateAddress, tierToEmoji } from '../lib/mockData'
import { TIER_COLORS } from '../lib/constants'
import LevelPips from '../components/LevelPips'

const STATS = [
  { label: 'Active Attesters',    value: '2,847',  delta: '+12%' },
  { label: 'Attestations Issued', value: '18,492', delta: '+8%'  },
  { label: 'Skills Tracked',      value: '342',    delta: '+5%'  },
  { label: 'Luminary Holders',    value: '94',     delta: '+3%'  },
]

const FEATURES = [
  {
    icon: Shield,
    title: 'Tamper-Proof Credentials',
    description: 'Every skill endorsement is inscribed on Stellar Soroban — immutable, verifiable, and decentralized.',
    color: '#A78BFA',
  },
  {
    icon: Zap,
    title: 'Inter-Contract Scoring',
    description: 'Our Reputation Scorer cross-calls the Attestation Registry on-chain to compute real-time reputation scores.',
    color: '#60A5FA',
  },
  {
    icon: Users,
    title: 'Peer Endorsements',
    description: 'Community-validated skills. Endorse attestations you\'ve witnessed first-hand to amplify reputation signal.',
    color: '#34D399',
  },
  {
    icon: Star,
    title: 'Dynamic Tiers',
    description: 'Six reputation tiers from Apprentice to Luminary, calculated algorithmically from attestation quality and diversity.',
    color: '#E8D9A0',
  },
]

export default function Explore() {
  const { setTab } = useLuminaryStore()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-20">

      {/* Hero */}
      <section className="pt-16 pb-8 text-center relative">
        <div className="absolute inset-0 bg-stellar pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 mb-8 text-xs font-mono text-muted">
            <div className="w-1.5 h-1.5 rounded-full bg-quasar animate-pulse" />
            Live on Stellar Testnet · Soroban Smart Contracts
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-7xl leading-none mb-6">
            <span className="gradient-text">Reputation</span>
            <br />
            <span className="text-star">you can trust.</span>
          </h1>

          <p className="max-w-xl mx-auto text-muted text-lg leading-relaxed mb-10">
            Luminary is a decentralized skill attestation protocol on Stellar Soroban.
            Build your on-chain reputation through peer-verified endorsements — portable, permanent, and provable.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => setTab('attest')} className="btn-primary flex items-center gap-2">
              Issue Attestation <ArrowRight size={16} />
            </button>
            <button onClick={() => setTab('leaderboard')} className="btn-ghost flex items-center gap-2">
              View Leaderboard <Star size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(stat => (
          <div key={stat.label} className="glass-card p-6 text-center">
            <div className="font-display font-bold text-2xl sm:text-3xl gradient-text mb-1">{stat.value}</div>
            <div className="text-xs text-dim mb-2">{stat.label}</div>
            <div className="text-xs text-quasar font-mono">{stat.delta} this month</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section>
        <h2 className="font-display font-bold text-2xl text-star mb-8 text-center">
          How Luminary Works
        </h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="glass-card p-6 flex gap-4 group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}
                >
                  <Icon size={18} style={{ color: f.color }} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-star mb-2">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Tier system */}
      <section>
        <h2 className="font-display font-bold text-2xl text-star mb-2 text-center">Reputation Tiers</h2>
        <p className="text-center text-muted text-sm mb-8">Computed on-chain by the Reputation Scorer contract</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['Unranked','Apprentice','Practitioner','Expert','Master','Luminary'].map((tier, i) => {
            const thresholds = [0, 1, 200, 500, 800, 1000]
            const color = TIER_COLORS[tier]
            return (
              <div key={tier} className="glass-card p-4 text-center group hover:scale-105 transition-transform">
                <div className="text-3xl mb-3" style={{ filter: `drop-shadow(0 0 8px ${color})` }}>
                  {['○','◈','◆','✦','★','✸'][i]}
                </div>
                <div className="font-display font-semibold text-sm mb-1" style={{ color }}>{tier}</div>
                <div className="text-xs font-mono text-dim">{thresholds[i]}+ pts</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent attestations */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-2xl text-star">Recent Attestations</h2>
          <button onClick={() => setTab('leaderboard')} className="text-sm text-pulsar hover:text-star transition-colors font-display flex items-center gap-1">
            See all <ArrowRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {MOCK_ATTESTATIONS.slice(0, 4).map(att => (
            <div key={att.id} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pulsar/20 to-nova/20 border border-pulsar/20 flex items-center justify-center shrink-0">
                <span className="text-lg">{tierToEmoji('Expert')}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-star font-display font-medium mb-1 truncate">{att.skill}</div>
                <div className="text-xs text-dim font-mono">
                  <span className="text-pulsar">{truncateAddress(att.attester)}</span>
                  <span className="mx-2">→</span>
                  <span>{truncateAddress(att.subject)}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <LevelPips level={att.level} />
                <div className="text-xs text-dim">{att.endorsement_count} endorsements</div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
