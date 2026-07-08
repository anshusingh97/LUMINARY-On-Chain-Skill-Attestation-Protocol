import { create } from 'zustand'

export interface Attestation {
  id: number
  attester: string
  subject: string
  skill: string
  level: number
  timestamp: number
  revoked: boolean
  endorsement_count: number
}

export interface ReputationScore {
  subject: string
  score: number
  tier: string
  attestation_count: number
  last_updated: number
}

interface LuminaryStore {
  // Wallet
  walletKey:    string
  walletPubKey: string
  isConnected:  boolean
  setWallet:    (secretKey: string, pubKey: string) => void
  disconnect:   () => void

  // Attestations
  attestations:     Attestation[]
  isLoadingAttest:  boolean
  setAttestations:  (a: Attestation[]) => void
  setLoadingAttest: (v: boolean) => void

  // Reputation
  score:         ReputationScore | null
  isLoadingScore: boolean
  setScore:      (s: ReputationScore | null) => void
  setLoadingScore:(v: boolean) => void

  // UI
  activeTab: 'explore' | 'attest' | 'profile' | 'leaderboard'
  setTab:    (t: 'explore' | 'attest' | 'profile' | 'leaderboard') => void

  // Notifications
  notifications: { id: string; type: 'success' | 'error' | 'info'; message: string }[]
  addNotification: (type: 'success' | 'error' | 'info', message: string) => void
  removeNotification: (id: string) => void
}

export const useLuminaryStore = create<LuminaryStore>((set, get) => ({
  walletKey:    '',
  walletPubKey: '',
  isConnected:  false,
  setWallet: (secretKey, pubKey) => set({ walletKey: secretKey, walletPubKey: pubKey, isConnected: true }),
  disconnect:   () => set({ walletKey: '', walletPubKey: '', isConnected: false, score: null, attestations: [] }),

  attestations:     [],
  isLoadingAttest:  false,
  setAttestations:  (a) => set({ attestations: a }),
  setLoadingAttest: (v) => set({ isLoadingAttest: v }),

  score:          null,
  isLoadingScore: false,
  setScore:       (s) => set({ score: s }),
  setLoadingScore:(v) => set({ isLoadingScore: v }),

  activeTab: 'explore',
  setTab:    (t) => set({ activeTab: t }),

  notifications: [],
  addNotification: (type, message) => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ notifications: [...s.notifications, { id, type, message }] }))
    setTimeout(() => get().removeNotification(id), 4000)
  },
  removeNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),
}))
