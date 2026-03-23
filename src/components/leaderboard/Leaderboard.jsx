import { motion } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useLeaderboardStore from '../../stores/useLeaderboardStore'
import ModelComparison from './ModelComparison'

function getTier(score, tiers) {
  if (typeof tiers.gold === 'number') {
    if (score >= tiers.gold) return { label: 'Gold', color: '#EAB308', icon: '🥇' }
    if (score >= tiers.silver) return { label: 'Silver', color: '#94A3B8', icon: '🥈' }
    if (score >= tiers.bronze) return { label: 'Bronze', color: '#CD7F32', icon: '🥉' }
  }
  return null
}

export default function Leaderboard() {
  const { activeGameId } = useGameStore()
  const game = GAMES[activeGameId]
  const { entries, removeEntry, clearGame } = useLeaderboardStore()
  const gameEntries = entries[activeGameId] || []

  return (
    <div className="h-full flex">
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold tracking-tight">{game.name} Leaderboard</h2>
        {gameEntries.length > 0 && (
          <button onClick={() => clearGame(activeGameId)}
            className="text-xs text-text-muted hover:text-error transition-colors px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>Clear All</button>
        )}
      </div>

      {/* Tier targets */}
      {typeof game.tiers.gold === 'number' && (
        <div className="flex gap-2 mb-6">
          {[
            { ...game.tiers, label: 'bronze', color: '#CD7F32' },
          ].map(() => null)}
          {Object.entries(game.tiers).map(([tier, target]) => (
            <div key={tier} className="px-4 py-2.5 rounded-lg text-center flex-1 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] text-text-muted capitalize mb-0.5">{tier}</p>
              <p className="text-sm font-mono font-semibold text-text-primary tabular-nums">{target}</p>
            </div>
          ))}
        </div>
      )}

      {gameEntries.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={{ border: '2px dashed rgba(255,255,255,0.06)' }}>
          <p className="text-text-muted text-sm">No models trained yet</p>
          <p className="text-text-ghost text-xs mt-1">Train a model to see it here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {gameEntries.map((entry, idx) => {
            const tier = getTier(entry.bestScore, game.tiers)
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-bg-hover"
                style={{ border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-sm font-mono font-bold text-text-muted w-8 tabular-nums">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-text-primary">{entry.modelName}</span>
                    {tier && <span className="text-xs" style={{ color: tier.color }}>{tier.icon}</span>}
                  </div>
                  <span className="text-[11px] font-mono text-text-muted">{entry.architecture} &middot; {entry.episodes} eps</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-text-primary tabular-nums">{entry.bestScore.toFixed(1)}</p>
                  <p className="text-[11px] text-text-muted">{new Date(entry.timestamp).toLocaleDateString()}</p>
                </div>
                <button onClick={() => removeEntry(activeGameId, entry.id)}
                  className="text-text-ghost hover:text-error transition-colors text-sm px-1">×</button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>

    {/* Right: Model Comparison */}
    <div className="w-72 border-l border-border bg-bg-secondary shrink-0 overflow-y-auto">
      <ModelComparison />
    </div>
    </div>
  )
}
