interface LevelPipsProps {
  level: number
  max?: number
}

const LEVEL_LABELS = ['', 'Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']

export default function LevelPips({ level, max = 5 }: LevelPipsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`level-pip ${i < level ? 'filled' : 'empty'}`}
          />
        ))}
      </div>
      <span className="text-xs text-dim font-mono">{LEVEL_LABELS[level] || `L${level}`}</span>
    </div>
  )
}
