import { motion } from 'framer-motion'
import useLeaderboardStore from '../../stores/useLeaderboardStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'

function ScoreBar({ label, score, maxScore, color }) {
  const width = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-secondary truncate max-w-[160px]">{label}</span>
        <span className="text-xs font-mono font-medium text-text-primary">{score.toFixed(1)}</span>
      </div>
      <div className="h-2.5 bg-bg-primary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

const COMPARISON_COLORS = ['#22C55E', '#3B82F6', '#EAB308', '#EC4899']

export default function ModelComparison() {
  const { activeGameId } = useGameStore()
  const game = GAMES[activeGameId]
  const entries = useLeaderboardStore((s) => s.entries[activeGameId] || [])

  if (entries.length < 2) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-text-muted">Train at least 2 models to compare them</p>
      </div>
    )
  }

  // Compare top 4 models
  const topModels = entries.slice(0, 4)
  const maxScore = Math.max(...topModels.map(e => e.bestScore), 1)

  return (
    <div className="p-5 space-y-5">
      <h3 className="text-base font-semibold text-text-primary">Model Comparison</h3>

      {/* Score comparison bars */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-text-muted font-medium">Best Score</p>
        {topModels.map((entry, i) => (
          <ScoreBar
            key={entry.id}
            label={entry.modelName}
            score={entry.bestScore}
            maxScore={maxScore}
            color={COMPARISON_COLORS[i]}
          />
        ))}
      </div>

      {/* Architecture comparison table */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-text-muted font-medium">Architecture</p>
        <div className="space-y-2">
          {topModels.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-bg-card border border-border">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COMPARISON_COLORS[i] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">{entry.modelName}</p>
                <p className="text-xs font-mono text-text-muted truncate">{entry.architecture}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-text-muted">{entry.layerCount} layers</p>
                <p className="text-xs text-text-muted">{entry.episodes} eps</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier targets reference */}
      {typeof game.tiers.gold === 'number' && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-text-muted font-medium">Tier Targets</p>
          {Object.entries(game.tiers).map(([tier, target]) => (
            <div key={tier} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary capitalize">
                {tier === 'gold' ? '\uD83E\uDD47' : tier === 'silver' ? '\uD83E\uDD48' : '\uD83E\uDD49'} {tier}
              </span>
              <div className="flex-1 mx-3 border-b border-border border-dashed" />
              <span className="font-mono text-text-primary">{target}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
