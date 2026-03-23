import useGameStore, { GAMES } from '../../stores/useGameStore'

export default function DecisionOverlay({ qValues }) {
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  if (!qValues || qValues.length === 0) return null

  const maxIdx = qValues.indexOf(Math.max(...qValues))
  const minQ = Math.min(...qValues)
  const maxQ = Math.max(...qValues)
  const range = maxQ - minQ || 1

  return (
    <div className="rounded-xl p-4 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3 font-medium">Model Decision</p>
      <div className="space-y-2.5">
        {qValues.map((q, i) => {
          const normalized = (q - minQ) / range
          const isMax = i === maxIdx
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className={`text-[11px] font-mono w-16 ${isMax ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
                {game.actionLabels[i] || `A${i}`}
              </span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.max(normalized * 100, 2)}%`,
                    backgroundColor: isMax ? '#22C55E' : '#3B82F6',
                    opacity: isMax ? 1 : 0.3,
                  }}
                />
              </div>
              <span className={`text-[11px] font-mono w-14 text-right tabular-nums ${isMax ? 'text-success' : 'text-text-muted'}`}>
                {q.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
