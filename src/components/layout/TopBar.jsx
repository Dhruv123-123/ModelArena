import { motion } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useTrainingStore from '../../stores/useTrainingStore'

const VIEW_LABELS = {
  builder: 'Model Builder',
  train: 'Training',
  play: 'Playback',
  leaderboard: 'Leaderboard',
}

const VIEW_ICONS = {
  builder: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  train: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  play: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  leaderboard: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7.5 4 8 5.5 8 7v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7c0-1.5.5-3 3.5-3a2.5 2.5 0 0 1 0 5H18"/>
      <path d="M8 14h8"/>
    </svg>
  ),
}

export default function TopBar() {
  const { activeGameId, view } = useGameStore()
  const { isTraining, episode, bestScore, epsilon, stepsPerSecond } = useTrainingStore()
  const game = GAMES[activeGameId]
  const accentColor = game?.accentColor || '#22C55E'

  return (
    <div
      className="h-11 flex items-center px-4 justify-between shrink-0"
      style={{
        background: 'rgba(7,7,12,0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-base leading-none">{game.icon}</span>
        <span style={{ color: '#505068' }}>/</span>
        <span className="font-medium" style={{ color: '#8A8AA3' }}>{game.name}</span>
        <span style={{ color: '#505068' }}>/</span>
        <span className="flex items-center gap-1.5 font-medium" style={{ color: '#F0F0F6' }}>
          <span style={{ color: accentColor }}>{VIEW_ICONS[view]}</span>
          {VIEW_LABELS[view]}
        </span>

        <span
          className="ml-2 px-2 py-0.5 rounded-md text-[11px] font-mono"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            color: '#505068',
          }}
        >
          {game.inputSize} → {game.outputSize}
        </span>
      </div>

      {/* Training stats */}
      {isTraining ? (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 text-[12px] font-mono tabular-nums"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
            <span style={{ color: '#505068' }}>Live</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#505068' }}>Ep</span>
            <span className="font-semibold" style={{ color: '#F0F0F6' }}>{episode.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#505068' }}>Best</span>
            <span className="font-semibold" style={{ color: accentColor }}>{bestScore.toFixed(1)}</span>
          </div>
          <span style={{ color: '#3A3A50' }}>ε {epsilon.toFixed(3)}</span>
          <span style={{ color: '#3A3A50' }}>{stepsPerSecond.toFixed(0)} sps</span>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-md"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#3A3A50' }}>
            Ready
          </span>
        </div>
      )}
    </div>
  )
}
