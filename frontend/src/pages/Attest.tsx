import { useState } from 'react'
import { Star, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react'
import { useLuminaryStore } from '../lib/store'
import { SKILL_CATEGORIES } from '../lib/constants'
import LevelPips from '../components/LevelPips'
import { clsx } from 'clsx'

const LEVEL_DESCRIPTIONS = [
  '',
  'Novice — Basic familiarity, learning the fundamentals',
  'Beginner — Can complete guided tasks independently',
  'Intermediate — Solid working knowledge, handles most scenarios',
  'Advanced — Deep expertise, teaches and leads others',
  'Expert — Authoritative mastery, pushes the field forward',
]

export default function Attest() {
  const { isConnected, walletPubKey, addNotification } = useLuminaryStore()

  const [form, setForm] = useState({
    subject: '',
    skill:   '',
    customSkill: '',
    level:   3,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted]       = useState<{ id: string; txHash: string } | null>(null)

  const handleSubmit = async () => {
    if (!isConnected) {
      addNotification('error', 'Please connect your wallet first')
      return
    }
    if (!form.subject.trim()) {
      addNotification('error', 'Subject address is required')
      return
    }
    if (form.subject === walletPubKey) {
      addNotification('error', 'You cannot attest your own skills')
      return
    }
    const skillName = form.skill === '__custom__' ? form.customSkill : form.skill
    if (!skillName) {
      addNotification('error', 'Please select or enter a skill')
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate transaction (replace with real call in production)
      await new Promise(r => setTimeout(r, 2000))
      const mockId   = Math.floor(Math.random() * 9000 + 1000).toString()
      const mockHash = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')
      setSubmitted({ id: mockId, txHash: mockHash })
      addNotification('success', `Attestation #${mockId} issued successfully!`)
    } catch (err) {
      addNotification('error', `Transaction failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20 pt-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-star mb-2">Issue Attestation</h1>
        <p className="text-muted">Vouch for a peer's skill on the Stellar blockchain. Attestations are permanent and verifiable.</p>
      </div>

      {!isConnected && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3 border-pulsar/20">
          <Info size={16} className="text-pulsar mt-0.5 shrink-0" />
          <p className="text-sm text-muted">
            Connect your wallet in the <strong className="text-star">Profile</strong> tab to issue real on-chain attestations.
            You can still preview the form below.
          </p>
        </div>
      )}

      {submitted ? (
        <div className="glass-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-quasar/20 border border-quasar/40 flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-quasar" />
          </div>
          <h2 className="font-display font-bold text-xl text-star">Attestation Issued!</h2>
          <p className="text-muted text-sm">
            Your attestation has been recorded on-chain and the reputation score will update shortly.
          </p>
          <div className="space-y-2 text-left">
            <div className="glass-card p-3">
              <div className="text-xs text-dim mb-1">Attestation ID</div>
              <div className="font-mono text-sm text-star">#{submitted.id}</div>
            </div>
            <div className="glass-card p-3">
              <div className="text-xs text-dim mb-1">Transaction Hash</div>
              <div className="font-mono text-xs text-pulsar break-all">{submitted.txHash}</div>
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(null); setForm({ subject: '', skill: '', customSkill: '', level: 3 }) }}
            className="btn-primary w-full"
          >
            Issue Another
          </button>
        </div>
      ) : (
        <div className="glass-card p-6 space-y-6">

          {/* Subject */}
          <div>
            <label className="block text-sm font-display font-medium text-star mb-2">
              Subject Address <span className="text-flare">*</span>
            </label>
            <input
              className="input-field font-mono text-sm"
              placeholder="G... (Stellar public key)"
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            />
            <p className="text-xs text-dim mt-1.5">The wallet address of the person you're attesting</p>
          </div>

          {/* Skill */}
          <div>
            <label className="block text-sm font-display font-medium text-star mb-2">
              Skill <span className="text-flare">*</span>
            </label>
            <select
              className="input-field"
              value={form.skill}
              onChange={e => setForm(f => ({ ...f, skill: e.target.value }))}
            >
              <option value="" disabled>Select a skill…</option>
              {SKILL_CATEGORIES.map(s => (
                <option key={s} value={s} style={{ background: '#0D1021' }}>{s}</option>
              ))}
              <option value="__custom__" style={{ background: '#0D1021' }}>+ Custom skill…</option>
            </select>

            {form.skill === '__custom__' && (
              <input
                className="input-field mt-3"
                placeholder="Enter skill name"
                value={form.customSkill}
                onChange={e => setForm(f => ({ ...f, customSkill: e.target.value }))}
              />
            )}
          </div>

          {/* Level */}
          <div>
            <label className="block text-sm font-display font-medium text-star mb-3">
              Proficiency Level
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <LevelPips level={form.level} />
                <span className="text-xs font-mono text-pulsar">Level {form.level}</span>
              </div>
              <input
                type="range"
                min={1} max={5} step={1}
                value={form.level}
                onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) }))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <p className="text-xs text-muted italic">{LEVEL_DESCRIPTIONS[form.level]}</p>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl border border-dashed border-white/10 p-4 space-y-2">
            <div className="text-xs text-dim font-display uppercase tracking-wider mb-3">Preview</div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dim">Attester:</span>
              <span className="font-mono text-muted">{walletPubKey ? `${walletPubKey.slice(0,8)}…` : '(not connected)'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dim">Subject:</span>
              <span className="font-mono text-muted">{form.subject ? `${form.subject.slice(0,8)}…` : '(not set)'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dim">Skill:</span>
              <span className="text-star">{(form.skill === '__custom__' ? form.customSkill : form.skill) || '(not set)'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-dim">Level:</span>
              <LevelPips level={form.level} />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={clsx(
              'btn-primary w-full flex items-center justify-center gap-2',
              isSubmitting && 'opacity-70 cursor-not-allowed'
            )}
          >
            {isSubmitting
              ? <><Loader2 size={16} className="animate-spin" /> Submitting to Soroban…</>
              : <><Star size={16} /> Issue Attestation</>
            }
          </button>
        </div>
      )}
    </div>
  )
}
