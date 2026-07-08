import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useLuminaryStore } from '../lib/store'

export default function Notifications() {
  const { notifications, removeNotification } = useLuminaryStore()

  if (!notifications.length) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
      {notifications.map(n => (
        <div
          key={n.id}
          className="glass-card flex items-start gap-3 p-4 shadow-xl"
          style={{
            borderColor: n.type === 'success' ? 'rgba(52,211,153,0.3)'
                       : n.type === 'error'   ? 'rgba(244,114,182,0.3)'
                       :                        'rgba(167,139,250,0.3)',
          }}
        >
          {n.type === 'success' && <CheckCircle className="text-quasar shrink-0 mt-0.5" size={16} />}
          {n.type === 'error'   && <XCircle     className="text-flare  shrink-0 mt-0.5" size={16} />}
          {n.type === 'info'    && <Info         className="text-pulsar shrink-0 mt-0.5" size={16} />}
          <p className="text-sm text-star flex-1">{n.message}</p>
          <button onClick={() => removeNotification(n.id)} className="text-dim hover:text-star transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
