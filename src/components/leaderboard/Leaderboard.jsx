import { motion } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useLeaderboardStore from '../../stores/useLeaderboardStore'

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
    <div className="h-full p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{game.name} Leaderboard</h2>
        {gameEntries.length > 0 && (
          <button onClick={() => clearGame(activeGameId)}
            className="text-[10px] text-text-muted hover:text-error transition-colors">Clear All</button>
        )}
      </div>

      {/* Tier targets */}
      {typeof game.tiers.gold === 'number' && (
        <div className="flex gap-3 mb-4">
          {[
            { ...game.tiers, label: 'bronze', color: '#CD7F32' },
          ].map(() => null)}
          {Object.entries(game.tiers).map(([tier, target]) => (
            <div key={tier} className="px-3 py-2 rounded-lg bg-bg-card border border-border text-center flex-1">
              <p className="text-[10px] text-text-muted capitalize">{tier}</p>
              <p className="text-sm font-mono font-medium text-text-primary">{target}</p>
            </div>
          ))}
        </div>
      )}

      {gameEntries.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No models trained yet</p>
          <p className="text-text-muted text-xs mt-1">Train a model to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {gameEntries.map((entry, idx) => {
            const tier = getTier(entry.bestScore, game.tiers)
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-card border border-border hover:border-border-light transition-colors">
                <span className="text-lg font-mono font-bold text-text-muted w-8">#{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{entry.modelName}</span>
                    {tier && <span className="text-xs">{tier.icon} {tier.label}</span>}
                  </div>
                  <span className="text-[10px] font-mono text-text-muted">{entry.architecture} &middot; {entry.episodes} eps</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-bold text-text-primary">{entry.bestScore.toFixed(1)}</p>
                  <p className="text-[10px] text-text-muted">{new Date(entry.timestamp).toLocaleDateString()}</p>
                </div>
                <button onClick={() => removeEntry(activeGameId, entry.id)}
                  className="text-text-muted hover:text-error transition-colors text-xs">×</button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
