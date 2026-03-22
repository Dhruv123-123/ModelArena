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
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Model Decision</p>
      <div className="space-y-1.5">
        {qValues.map((q, i) => {
          const normalized = (q - minQ) / range
          const isMax = i === maxIdx
          return (
            <div key={i} className="flex items-center gap-2">
              <span className={`text-[10px] font-mono w-16 ${isMax ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
                {game.actionLabels[i] || `A${i}`}
              </span>
              <div className="flex-1 h-3 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.max(normalized * 100, 2)}%`,
                    backgroundColor: isMax ? '#22C55E' : '#3B82F6',
                    opacity: isMax ? 1 : 0.4,
                  }}
                />
              </div>
              <span className={`text-[10px] font-mono w-14 text-right ${isMax ? 'text-success' : 'text-text-muted'}`}>
                {q.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
