import { Compass, Star, User, Trophy, Zap } from 'lucide-react'
import { useLuminaryStore } from '../lib/store'
import { truncateAddress } from '../lib/mockData'
import { clsx } from 'clsx'

const TABS = [
  { id: 'explore',     label: 'Explore',     icon: Compass },
  { id: 'attest',      label: 'Attest',      icon: Star },
  { id: 'profile',     label: 'Profile',     icon: User },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
] as const

export default function Navigation() {
  const { activeTab, setTab, isConnected, walletPubKey, disconnect } = useLuminaryStore()

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl border-b border-white/[0.06]"
         style={{ background: 'rgba(7,8,15,0.85)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <button
          onClick={() => setTab('explore')}
          className="flex items-center gap-2.5 group"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pulsar to-nova flex items-center justify-center"
                 style={{ boxShadow: '0 0 16px rgba(167,139,250,0.4)' }}>
              <Zap size={16} className="text-void" fill="currentColor" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-quasar animate-pulse-slow" />
          </div>
          <div>
            <span className="font-display font-bold text-lg gradient-text">LUMINARY</span>
            <div className="text-[10px] text-dim font-mono -mt-1 hidden sm:block">ON-CHAIN REPUTATION</div>
          </div>
        </button>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.03] rounded-xl border border-white/[0.06] p-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-display font-medium transition-all duration-200',
                  active
                    ? 'bg-white/[0.08] text-star'
                    : 'text-dim hover:text-muted'
                )}
              >
                <Icon size={14} className={active ? 'text-pulsar' : ''} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Wallet */}
        {isConnected ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 glass-card px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-quasar animate-pulse" />
              <span className="text-xs font-mono text-muted">{truncateAddress(walletPubKey)}</span>
            </div>
            <button onClick={disconnect} className="btn-ghost text-sm py-1.5 px-3">
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={() => setTab('profile')} className="btn-primary text-sm">
            Connect Wallet
          </button>
        )}
      </div>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-t border-white/[0.06]">
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-display font-medium transition-all',
                active ? 'text-star' : 'text-dim'
              )}
            >
              <Icon size={16} className={active ? 'text-pulsar' : ''} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
