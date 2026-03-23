import { motion } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useTrainingStore from '../../stores/useTrainingStore'

export default function TopBar() {
  const { activeGameId, view } = useGameStore()
  const { isTraining, episode, bestScore, epsilon, stepsPerSecond } = useTrainingStore()
  const game = GAMES[activeGameId]

  const viewLabel = { builder: 'Model Builder', train: 'Training', play: 'Playback', leaderboard: 'Leaderboard' }[view] || ''

  return (
    <div className="h-12 bg-bg-secondary/60 backdrop-blur-md border-b border-border flex items-center px-5 justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-base">{game.icon}</span>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary leading-none">{game.name}</h2>
          <span className="text-text-muted">/</span>
          <span className="text-sm text-text-secondary">{viewLabel}</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono text-text-muted" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {game.inputSize} → {game.outputSize}
        </span>
      </div>

      {isTraining && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 text-[13px] font-mono tabular-nums"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-text-muted">Ep</span>
            <span className="text-text-primary font-medium">{episode}</span>
          </div>
          <div>
            <span className="text-text-muted">Best </span>
            <span className="text-text-primary font-medium">{bestScore.toFixed(1)}</span>
          </div>
          <span className="text-text-muted">&epsilon; {epsilon.toFixed(3)}</span>
          <span className="text-text-muted">{stepsPerSecond.toFixed(0)} sps</span>
        </motion.div>
      )}
    </div>
  )
}
