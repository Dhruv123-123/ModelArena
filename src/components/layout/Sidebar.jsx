import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import ConceptGlossary from '../learning/ConceptGlossary'

const gameList = Object.values(GAMES)

const viewButtons = [
  { id: 'builder', label: 'Model Builder', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>) },
  { id: 'train', label: 'Train', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>) },
  { id: 'play', label: 'Watch Play', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>) },
  { id: 'leaderboard', label: 'Leaderboard', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7.5 4 8 5.5 8 7v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7c0-1.5.5-3 3.5-3a2.5 2.5 0 0 1 0 5H18"/><path d="M8 14h8"/></svg>) },
]

export default function Sidebar({ onShowWelcome }) {
  const { activeGameId, setActiveGame, view, setView } = useGameStore()
  const activeGame = GAMES[activeGameId]
  const [showGlossary, setShowGlossary] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <div className="w-14 h-full bg-bg-secondary border-r border-border flex flex-col shrink-0 items-center py-3 gap-1">
        <button onClick={() => setCollapsed(false)} className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        {gameList.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
              activeGameId === game.id
                ? 'bg-bg-hover text-text-primary'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
            title={game.name}
          >
            {game.icon}
          </button>
        ))}
        <div className="h-px w-6 bg-border my-2" />
        {viewButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setView(btn.id)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              view === btn.id ? 'bg-bg-hover text-text-primary' : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            }`}
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="w-56 h-full bg-bg-secondary border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
        <button onClick={onShowWelcome} className="text-left group">
          <h1 className="text-base font-bold tracking-tight group-hover:opacity-80 transition-opacity">
            <span className="text-text-primary">Model</span>
            <span className={`text-${activeGame.accentColor}`}>Arena</span>
          </h1>
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          title="Collapse sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
        </button>
      </div>

      {/* Game Library */}
      <div className="px-2 py-3 flex-1 overflow-y-auto">
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2 px-2 font-medium">Games</p>
        <div className="space-y-0.5">
          {gameList.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5 ${
                activeGameId === game.id
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <span className="text-base w-6 text-center">{game.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate leading-tight">{game.name}</div>
                <div className="text-[11px] text-text-muted leading-tight">{game.difficulty}</div>
              </div>
              {activeGameId === game.id && (
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: game.accentColor }} />
              )}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2 px-2 mt-6 font-medium">View</p>
        <div className="space-y-0.5">
          {viewButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setView(btn.id)}
              className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5 ${
                view === btn.id
                  ? 'bg-bg-hover text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`}
            >
              <span className="text-text-muted w-6 flex items-center justify-center">{btn.icon}</span>
              <span className="font-medium">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Help section */}
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2 px-2 mt-6 font-medium">Learn</p>
        <div className="space-y-0.5">
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5 ${
              showGlossary ? 'bg-bg-hover text-text-primary' : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`}>
            <span className="text-text-muted w-6 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </span>
            <span className="font-medium">ML Glossary</span>
          </button>
          <button
            onClick={onShowWelcome}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover">
            <span className="text-text-muted w-6 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </span>
            <span className="font-medium">Home</span>
          </button>
        </div>
      </div>

      {/* Glossary panel */}
      <AnimatePresence>
        {showGlossary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 280, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <ConceptGlossary />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border">
        <p className="text-[11px] text-text-muted text-center font-mono">
          100% client-side ML
        </p>
      </div>
    </div>
  )
}
