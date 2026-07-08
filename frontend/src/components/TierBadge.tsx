import { TIER_COLORS } from '../lib/constants'
import { tierToEmoji } from '../lib/mockData'

interface TierBadgeProps {
  tier: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export default function TierBadge({ tier, size = 'md', showIcon = true }: TierBadgeProps) {
  const color = TIER_COLORS[tier] || '#4B5580'

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-3 py-1 gap-1.5',
    lg: 'text-sm px-4 py-1.5 gap-2',
  }

  return (
    <span
      className={`tier-badge font-display font-semibold ${sizeClasses[size]}`}
      style={{
        color,
        background:  `${color}18`,
        borderColor: `${color}40`,
        border:      '1px solid',
      }}
    >
      {showIcon && <span>{tierToEmoji(tier)}</span>}
      {tier}
    </span>
  )
}
