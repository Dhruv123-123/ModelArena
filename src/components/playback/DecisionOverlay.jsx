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
    <div className="rounded-xl p-4 bg-bg-hover border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-secondary text-lg">psychology</span>
        <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted font-black">Model Decision</p>
      </div>
      <div className="space-y-2.5">
        {qValues.map((q, i) => {
          const normalized = (q - minQ) / range
          const isMax = i === maxIdx
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className={`text-[10px] font-mono w-16 ${isMax ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
                {game.actionLabels[i] || `A${i}`}
              </span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-bg-primary">
                <div
                  className="h-full rounded-full transition-all duration-150"
                  style={{
                    width: `${Math.max(normalized * 100, 2)}%`,
                    backgroundColor: isMax ? 'var(--color-primary)' : 'var(--color-secondary)',
                    opacity: isMax ? 1 : 0.3,
                  }}
                />
              </div>
              <span className={`text-[10px] font-mono w-14 text-right tabular-nums ${isMax ? 'text-primary font-bold' : 'text-text-muted'}`}>
                {q.toFixed(2)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
