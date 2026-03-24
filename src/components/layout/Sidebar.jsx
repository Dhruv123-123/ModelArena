import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import ConceptGlossary from '../learning/ConceptGlossary'

const gameList = Object.values(GAMES)

const viewButtons = [
  {
    id: 'builder', label: 'Model Builder',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    )
  },
  {
    id: 'train', label: 'Train',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    )
  },
  {
    id: 'play', label: 'Watch Play',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    )
  },
  {
    id: 'leaderboard', label: 'Leaderboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7.5 4 8 5.5 8 7v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7c0-1.5.5-3 3.5-3a2.5 2.5 0 0 1 0 5H18"/>
        <path d="M8 14h8"/>
      </svg>
    )
  },
]

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.14em] font-semibold mb-1.5 px-2.5 mt-5"
      style={{ color: '#3A3A50' }}>
      {children}
    </p>
  )
}

export default function Sidebar({ onShowWelcome }) {
  const { activeGameId, setActiveGame, view, setView } = useGameStore()
  const activeGame = GAMES[activeGameId]
  const [showGlossary, setShowGlossary] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const accentColor = activeGame?.accentColor || '#22C55E'

  if (collapsed) {
    return (
      <div
        className="w-14 h-full flex flex-col shrink-0 items-center py-3 gap-0.5"
        style={{ background: '#07070C', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors"
          style={{ color: '#505068' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Expand sidebar"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        {gameList.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all relative"
            style={{
              background: activeGameId === game.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              boxShadow: activeGameId === game.id ? `0 0 12px ${game.accentColor}20` : 'none',
            }}
            title={game.name}
          >
            {game.icon}
            {activeGameId === game.id && (
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full"
                style={{ background: accentColor }} />
            )}
          </button>
        ))}
        <div className="w-5 h-px my-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
        {viewButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setView(btn.id)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: view === btn.id ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: view === btn.id ? '#F0F0F6' : '#505068',
            }}
            title={btn.label}
          >
            {btn.icon}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-56 h-full flex flex-col shrink-0"
      style={{ background: '#07070C', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div className="px-4 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={onShowWelcome} className="flex items-center gap-2 group">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)` }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight">
            <span className="text-white">Model</span>
            <span style={{ color: accentColor }}>Arena</span>
          </span>
        </button>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
          style={{ color: '#3A3A50' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#8A8AA3' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3A3A50' }}
          title="Collapse"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
          </svg>
        </button>
      </div>

      {/* Scroll area */}
      <div className="px-2 py-2 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <SectionLabel>Games</SectionLabel>
        <div className="space-y-0.5">
          {gameList.map((game) => {
            const isActive = activeGameId === game.id
            return (
              <button
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5 relative"
                style={{
                  background: isActive ? `${game.accentColor}0D` : 'transparent',
                  color: isActive ? '#F0F0F6' : '#686880',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: game.accentColor }} />
                )}
                <span className="text-[15px] w-5 text-center">{game.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate leading-tight">{game.name}</div>
                  <div className="text-[10px] leading-tight mt-0.5" style={{ color: isActive ? game.accentColor + 'CC' : '#3A3A50' }}>
                    {game.difficulty}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: game.accentColor }} />
                )}
              </button>
            )
          })}
        </div>

        <SectionLabel>Workspace</SectionLabel>
        <div className="space-y-0.5">
          {viewButtons.map((btn) => {
            const isActive = view === btn.id
            return (
              <button
                key={btn.id}
                onClick={() => setView(btn.id)}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: isActive ? '#F0F0F6' : '#686880',
                }}
                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
              >
                <span className="w-5 flex items-center justify-center" style={{ color: isActive ? accentColor : '#3A3A50' }}>
                  {btn.icon}
                </span>
                <span className="font-medium">{btn.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                )}
              </button>
            )
          })}
        </div>

        <SectionLabel>Learn</SectionLabel>
        <div className="space-y-0.5">
          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5"
            style={{
              background: showGlossary ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: showGlossary ? '#F0F0F6' : '#686880',
            }}
            onMouseEnter={e => !showGlossary && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={e => !showGlossary && (e.currentTarget.style.background = 'transparent')}
          >
            <span className="w-5 flex items-center justify-center" style={{ color: showGlossary ? accentColor : '#3A3A50' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <span className="font-medium">ML Glossary</span>
            <span className="ml-auto transition-transform duration-200" style={{ transform: showGlossary ? 'rotate(180deg)' : 'none', color: '#3A3A50' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </button>
          <button
            onClick={onShowWelcome}
            className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] transition-all flex items-center gap-2.5"
            style={{ color: '#686880' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#F0F0F6' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#686880' }}
          >
            <span className="w-5 flex items-center justify-center" style={{ color: '#3A3A50' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <ConceptGlossary />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22C55E' }} />
          <p className="text-[11px] font-mono" style={{ color: '#3A3A50' }}>
            100% client-side ML
          </p>
        </div>
      </div>
    </div>
  )
}
