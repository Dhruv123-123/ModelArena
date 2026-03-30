import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as M } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useTrainingStore from '../../stores/useTrainingStore'
import { getGameAccentHex } from '../../utils/gameTheme'

const GAME_ICONS = {
  snake: 'videogame_asset',
  flappy: 'flutter_dash',
  cartpole: 'analytics',
  twentyfortyeight: 'grid_view',
  chess: 'chess',
}

const VIEW_MAP = {
  builder: 'Build',
  train: 'Train',
  play: 'Watch',
  leaderboard: 'Compete',
}

export default function TopBar() {
  const navigate = useNavigate()
  const { activeGameId, view, setView } = useGameStore()
  const { isTraining, episode, bestScore, epsilon, stepsPerSecond } = useTrainingStore()
  const game = GAMES[activeGameId]

  useEffect(() => {
    document.documentElement.style.setProperty('--game-accent', getGameAccentHex(activeGameId))
  }, [activeGameId])

  return (
    <header className="h-16 bg-bg-primary/80 backdrop-blur-xl border-b border-border-light flex items-center px-6 justify-between shrink-0 z-50">
      {/* Left: Brand + Pipeline Nav */}
      <div className="flex items-center gap-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
          <span className="w-6 h-6 bg-primary rounded-full opacity-80" />
          <span className="text-xl font-black text-text-primary tracking-tighter uppercase">ModelArena</span>
        </button>

        {/* Pipeline Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {Object.entries(VIEW_MAP).map(([viewId, label]) => (
            <button
              key={viewId}
              onClick={() => setView(viewId)}
              className={`font-label tracking-widest text-[11px] uppercase font-bold transition-all duration-300 ${
                view === viewId
                  ? 'text-primary border-b-2 border-primary/40 pb-1'
                  : 'text-text-primary/40 hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: Training Stats + Controls */}
      <div className="flex items-center gap-4">
        {/* Training Live Stats */}
        {isTraining && (
          <M.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:flex items-center gap-3"
          >
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-primary status-pulse" />
              <span className="font-label text-[10px] uppercase tracking-widest text-primary font-bold">Training</span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] tabular-nums">
              <span className="text-text-muted">Ep <span className="text-text-primary font-bold">{episode}</span></span>
              <span className="text-text-muted">Best <span className="text-text-primary font-bold">{bestScore.toFixed(1)}</span></span>
              <span className="text-text-muted">&epsilon; {epsilon.toFixed(3)}</span>
              <span className="text-text-muted">{stepsPerSecond.toFixed(0)} sps</span>
            </div>
          </M.div>
        )}

        {/* Active Game Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-bg-hover rounded border border-border">
          <span className="material-symbols-outlined text-primary text-sm">{GAME_ICONS[activeGameId] || 'videogame_asset'}</span>
          <span className="font-label text-[10px] uppercase tracking-widest font-bold">Active: {game.name}</span>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-3">
          <button className="material-symbols-outlined text-text-primary/40 hover:text-primary transition-colors text-xl">notifications</button>
          <button className="material-symbols-outlined text-text-primary/40 hover:text-primary transition-colors text-xl">settings</button>
          <div className="w-8 h-8 rounded-full border border-border-light bg-bg-elevated flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-text-muted text-base">person</span>
          </div>
        </div>
      </div>
    </header>
  )
}
