import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as M, AnimatePresence } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useModelStore from '../../stores/useModelStore'
import ConceptGlossary from '../learning/ConceptGlossary'

const gameList = Object.values(GAMES)

const GAME_ICONS = {
  snake: 'videogame_asset',
  flappy: 'flutter_dash',
  cartpole: 'analytics',
  twentyfortyeight: 'grid_view',
  chess: 'chess',
}

const viewButtons = [
  { id: 'builder', label: 'Builder', icon: 'architecture' },
  { id: 'train', label: 'Training', icon: 'model_training' },
  { id: 'play', label: 'Watch', icon: 'play_circle' },
  { id: 'leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { activeGameId, setActiveGame, view, setView } = useGameStore()
  const clearAll = useModelStore(s => s.clearAll)
  const [showGlossary, setShowGlossary] = useState(false)

  return (
    <aside className="w-64 h-full bg-bg-primary border-r border-border flex flex-col shrink-0 pt-4 pb-6">
      {/* Neural Engine Header */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary status-pulse" />
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-text-primary/60">Neural Engine</span>
        </div>
        <p className="text-[10px] text-text-primary/30 font-mono uppercase tracking-widest">STABLE v2.4.0</p>
      </div>

      {/* Game List */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {gameList.map((game) => {
          const isActive = activeGameId === game.id
          return (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-300 font-label text-[10px] uppercase tracking-[0.15em] ${
                isActive
                  ? 'bg-primary/5 text-primary border-r-2 border-primary font-bold'
                  : 'text-text-primary/40 hover:text-text-primary/80 hover:bg-bg-hover font-medium'
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {GAME_ICONS[game.id] || 'videogame_asset'}
              </span>
              <span>{game.name}</span>
            </button>
          )
        })}

        {/* Divider */}
        <div className="h-px mx-6 my-3 bg-border" />

        {/* View Buttons */}
        {viewButtons.map((btn) => {
          const isActive = view === btn.id
          return (
            <button
              key={btn.id}
              onClick={() => setView(btn.id)}
              className={`w-full flex items-center gap-4 px-6 py-3 transition-all duration-300 font-label text-[10px] uppercase tracking-[0.15em] ${
                isActive
                  ? 'bg-primary/5 text-primary border-r-2 border-primary font-bold'
                  : 'text-text-primary/40 hover:text-text-primary/80 hover:bg-bg-hover font-medium'
              }`}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {btn.icon}
              </span>
              <span>{btn.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Glossary Expandable */}
      <AnimatePresence>
        {showGlossary && (
          <M.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 260, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border overflow-hidden"
          >
            <ConceptGlossary />
          </M.div>
        )}
      </AnimatePresence>

      {/* Bottom Actions */}
      <div className="px-6 mt-auto space-y-4">
        <button
          onClick={() => { clearAll(); setView('builder') }}
          className="w-full py-3.5 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/10 neural-glow"
        >
          New Model
        </button>

        <div className="pt-4 border-t border-border space-y-2">
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="flex items-center gap-3 text-text-primary/30 hover:text-text-primary/60 cursor-pointer transition-colors w-full"
          >
            <span className="material-symbols-outlined text-base">menu_book</span>
            <span className="font-label text-[9px] uppercase tracking-widest">ML Glossary</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 text-text-primary/30 hover:text-text-primary/60 cursor-pointer transition-colors w-full"
          >
            <span className="material-symbols-outlined text-base">home</span>
            <span className="font-label text-[9px] uppercase tracking-widest">Home</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
