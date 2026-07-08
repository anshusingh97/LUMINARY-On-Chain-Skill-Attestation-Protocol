import { useState } from 'react'
import { Keypair } from '@stellar/stellar-sdk'
import { Wallet, RefreshCw, Eye, EyeOff, Loader2, Copy, ExternalLink } from 'lucide-react'
import { useLuminaryStore } from '../lib/store'
import TierBadge from '../components/TierBadge'
import LevelPips from '../components/LevelPips'
import { MOCK_ATTESTATIONS, truncateAddress } from '../lib/mockData'
import { TIER_COLORS } from '../lib/constants'

export default function Profile() {
  const {
    isConnected, walletPubKey, walletKey,
    setWallet, disconnect,
    score, setScore, setLoadingScore,
    attestations, setAttestations,
    addNotification,
  } = useLuminaryStore()

  const [secretInput, setSecretInput] = useState('')
  const [showSecret, setShowSecret]   = useState(false)
  const [isLoading, setIsLoading]     = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      let kp: Keypair
      if (secretInput.trim()) {
        kp = Keypair.fromSecret(secretInput.trim())
      } else {
        kp = Keypair.random()
        addNotification('info', 'Generated a new testnet keypair. Save your secret key!')
      }
      setWallet(kp.secret(), kp.publicKey())
      // Load mock data
      setAttestations(MOCK_ATTESTATIONS.filter(a => a.subject === MOCK_ATTESTATIONS[0].subject))
      setScore({
        subject: kp.publicKey(),
        score: 0,
        tier: 'Unranked',
        attestation_count: 0,
        last_updated: Date.now() / 1000,
      })
      addNotification('success', 'Wallet connected successfully!')
    } catch {
      addNotification('error', 'Invalid secret key format')
    } finally {
      setIsLoading(false)
      setSecretInput('')
    }
  }

  const handleRefreshScore = async () => {
    setLoadingScore(true)
    try {
      await new Promise(r => setTimeout(r, 1500))
      setScore({
        subject: walletPubKey,
        score: 640,
        tier: 'Expert',
        attestation_count: 5,
        last_updated: Date.now() / 1000,
      })
      addNotification('success', 'Reputation score refreshed from chain!')
    } catch {
      addNotification('error', 'Failed to fetch score')
    } finally {
      setLoadingScore(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification('info', 'Copied to clipboard')
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 pb-20 pt-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pulsar/20 to-nova/20 border border-pulsar/20 flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-pulsar" />
          </div>
          <h1 className="font-display font-bold text-3xl text-star mb-2">Connect Wallet</h1>
          <p className="text-muted text-sm">Enter your Stellar secret key to interact with Luminary, or generate a new testnet keypair.</p>
        </div>

        <div className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-display font-medium text-star mb-2">Secret Key</label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                className="input-field pr-10 font-mono text-sm"
                placeholder="S... (leave empty to generate new)"
                value={secretInput}
                onChange={e => setSecretInput(e.target.value)}
              />
              <button
                onClick={() => setShowSecret(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-star"
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-xs text-dim bg-white/[0.03] rounded-lg p-3 border border-white/[0.05]">
            ⚠️ Never enter a mainnet secret key. This app runs on <strong className="text-star">Stellar Testnet</strong> only.
          </div>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isLoading
              ? <><Loader2 size={16} className="animate-spin" /> Connecting…</>
              : secretInput ? 'Connect Wallet' : 'Generate & Connect'
            }
          </button>
        </div>
      </div>
    )
  }

  const tierColor = score ? TIER_COLORS[score.tier] || '#4B5580' : '#4B5580'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20 pt-8 space-y-6">

      {/* Wallet card */}
      <div className="glass-card p-6 animated-border" style={{ '--angle': '0deg' } as React.CSSProperties}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-dim font-display uppercase tracking-wider mb-1">Your Wallet</div>
            <div className="font-mono text-sm text-star break-all">{walletPubKey}</div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => copyToClipboard(walletPubKey)} className="btn-ghost py-1.5 px-2">
              <Copy size={14} />
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${walletPubKey}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-ghost py-1.5 px-2"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-quasar animate-pulse" />
          <span className="text-xs text-quasar font-mono">Connected to Testnet</span>
        </div>
      </div>

      {/* Reputation score */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-star">Reputation Score</h2>
          <button onClick={handleRefreshScore} className="btn-ghost py-1.5 px-3 flex items-center gap-1.5 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {score ? (
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-2xl flex flex-col items-center justify-center shrink-0"
              style={{ background: `${tierColor}12`, border: `1px solid ${tierColor}30` }}
            >
              <div className="text-3xl font-display font-bold" style={{ color: tierColor }}>
                {score.score}
              </div>
              <div className="text-xs text-dim">pts</div>
            </div>
            <div className="space-y-2">
              <TierBadge tier={score.tier} size="lg" />
              <div className="text-sm text-muted">
                {score.attestation_count} active attestation{score.attestation_count !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-dim font-mono">
                Updated {score.last_updated > 0
                  ? new Date(score.last_updated * 1000).toLocaleDateString()
                  : 'never'}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted py-8">
            <p className="text-sm mb-4">No score computed yet. Receive attestations to build your reputation.</p>
          </div>
        )}
      </div>

      {/* Attestations */}
      <div className="glass-card p-6">
        <h2 className="font-display font-bold text-xl text-star mb-5">My Attestations</h2>
        {attestations.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">No attestations received yet.</p>
        ) : (
          <div className="space-y-3">
            {attestations.map(att => (
              <div key={att.id} className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-medium text-sm text-star mb-1">{att.skill}</div>
                  <div className="text-xs text-dim font-mono">from {truncateAddress(att.attester)}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <LevelPips level={att.level} />
                  <div className="text-xs text-dim">{att.endorsement_count} ✦</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={disconnect} className="btn-ghost w-full text-flare border-flare/20 hover:border-flare/40">
        Disconnect Wallet
      </button>
    </div>
  )
}
