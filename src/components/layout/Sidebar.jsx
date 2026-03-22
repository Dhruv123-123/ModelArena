import { useState } from 'react'
import { motion } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import ConceptGlossary from '../learning/ConceptGlossary'

const gameList = Object.values(GAMES)

const viewButtons = [
  { id: 'builder', label: 'Model Builder', icon: '🧠' },
  { id: 'train', label: 'Train', icon: '⚡' },
  { id: 'play', label: 'Watch Play', icon: '▶️' },
  { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
]

export default function Sidebar({ onShowWelcome }) {
  const { activeGameId, setActiveGame, view, setView } = useGameStore()
  const activeGame = GAMES[activeGameId]
  const [showGlossary, setShowGlossary] = useState(false)

  return (
    <div className="w-56 h-full bg-bg-secondary border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <button
          onClick={onShowWelcome}
          className="text-left group"
        >
          <h1 className="text-lg font-bold font-[Outfit] tracking-tight group-hover:opacity-80 transition-opacity">
            <span className="text-text-primary">Model</span>
            <span className={`text-${activeGame.accentColor}`}>Arena</span>
          </h1>
          <p className="text-[10px] text-text-muted mt-0.5 font-mono">Build. Train. Battle.</p>
        </button>
      </div>

      {/* Game Library */}
      <div className="p-3 flex-1 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1">Games</p>
        <div className="space-y-1">
          {gameList.map((game) => (
            <motion.button
              key={game.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveGame(game.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                activeGameId === game.id
                  ? `bg-${game.accentColor}/10 text-${game.accentColor} border border-${game.accentColor}/20`
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <span className="text-base">{game.icon}</span>
              <div className="min-w-0">
                <div className="font-medium truncate">{game.name}</div>
                <div className="text-[10px] text-text-muted">{game.difficulty}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* View Switcher */}
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1 mt-6">View</p>
        <div className="space-y-1">
          {viewButtons.map((btn) => (
            <motion.button
              key={btn.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView(btn.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
                view === btn.id
                  ? 'bg-bg-hover text-text-primary border border-border-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <span className="text-base">{btn.icon}</span>
              <span>{btn.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Help section */}
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2 px-1 mt-6">Learn</p>
        <div className="space-y-1">
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGlossary(!showGlossary)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 ${
              showGlossary
                ? 'bg-bg-hover text-text-primary border border-border-light'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}
          >
            <span className="text-base">📖</span>
            <span>ML Glossary</span>
          </motion.button>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onShowWelcome}
            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            <span className="text-base">🏠</span>
            <span>Welcome Screen</span>
          </motion.button>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              localStorage.removeItem('modelarena-tour-completed')
              window.location.reload()
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            <span className="text-base">🎓</span>
            <span>Restart Tour</span>
          </motion.button>
        </div>
      </div>

      {/* Glossary panel (slides up) */}
      {showGlossary && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 300, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border"
        >
          <ConceptGlossary />
        </motion.div>
      )}

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-text-muted text-center">
          100% client-side ML · No backend required
        </p>
      </div>
    </div>
  )
}
