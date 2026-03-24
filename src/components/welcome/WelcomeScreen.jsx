import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const HERO_GAMES = [
  { id: 'snake', color: '#22C55E', label: 'Snake', emoji: '🐍', desc: 'Classic pathfinding AI', difficulty: 'Beginner' },
  { id: 'flappy', color: '#F97316', label: 'Flappy Bird', emoji: '🐦', desc: 'Reflex-based control', difficulty: 'Easy' },
  { id: 'cartpole', color: '#3B82F6', label: 'CartPole', emoji: '⚖️', desc: 'Balance & control theory', difficulty: 'Medium' },
  { id: 'twentyfortyeight', color: '#A855F7', label: '2048', emoji: '🔢', desc: 'Strategy & planning', difficulty: 'Hard' },
  { id: 'chess', color: '#EAB308', label: 'Chess', emoji: '♟️', desc: 'Deep tree search', difficulty: 'Expert' },
]

const STATS = [
  { value: '5', label: 'Game Environments' },
  { value: '∞', label: 'Training Episodes' },
  { value: '0', label: 'Backend Required' },
  { value: '100%', label: 'In-Browser ML' },
]

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Visual Model Builder',
    desc: 'Drag and drop neural network layers. Configure Dense, Conv2D, Dropout, and more — no code required.',
    color: '#22C55E',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: 'Real-Time Training',
    desc: 'Watch your model learn live. DQN and supervised learning with live reward curves and loss graphs.',
    color: '#F97316',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    ),
    title: 'Human vs AI',
    desc: 'Go head-to-head against your trained model. See Q-value overlays and decision confidence in real time.',
    color: '#3B82F6',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7.5 4 8 5.5 8 7v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V7c0-1.5.5-3 3.5-3a2.5 2.5 0 0 1 0 5H18"/><path d="M8 14h8"/>
      </svg>
    ),
    title: 'Global Leaderboard',
    desc: 'Compete against other models. Bronze, Silver, and Gold tiers with full model comparison tools.',
    color: '#A855F7',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: 'Instant Start',
    desc: 'No signup. No API keys. No backend. Everything runs in your browser using TensorFlow.js.',
    color: '#EAB308',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    title: 'ML Glossary',
    desc: 'Built-in ML concept glossary and guided tutorials for every game. Learn while you build.',
    color: '#6366F1',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Design Your Network',
    desc: 'Use the visual builder to stack layers, tune parameters, and choose from architecture presets like Starter, Deep, or CNN.',
    color: '#22C55E',
  },
  {
    step: '02',
    title: 'Train Against Games',
    desc: "Hit Train and watch your AI play thousands of episodes. Real-time charts show reward curves, loss, and epsilon decay.",
    color: '#3B82F6',
  },
  {
    step: '03',
    title: 'Dominate the Leaderboard',
    desc: 'Save your best models, compare architectures, and climb the tiers. Export weights and share your agents.',
    color: '#A855F7',
  },
]

// Animated background canvas
function HeroCanvas({ width, height }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: width / 2, y: height / 2 })
  const frameRef = useRef(0)

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const layerSizes = [4, 8, 12, 10, 6, 3]
    const layerX = layerSizes.map((_, i) => (width * 0.08) + (i / (layerSizes.length - 1)) * (width * 0.84))
    const layerColors = ['#22C55E', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EAB308']

    const nodes = []
    layerSizes.forEach((size, li) => {
      const spacing = Math.min(height * 0.65 / (size + 1), 40)
      const startY = (height - (size - 1) * spacing) / 2
      for (let i = 0; i < size; i++) {
        nodes.push({
          x: layerX[li], y: startY + i * spacing,
          layer: li, color: layerColors[li],
          baseX: layerX[li], baseY: startY + i * spacing,
        })
      }
    })

    const edges = []
    for (const a of nodes) {
      for (const b of nodes) {
        if (b.layer === a.layer + 1) {
          edges.push({ from: a, to: b, phase: Math.random() * Math.PI * 2 })
        }
      }
    }

    const particles = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        edge: edges[Math.floor(Math.random() * edges.length)],
        t: Math.random(),
        speed: 0.005 + Math.random() * 0.009,
        size: 1.2 + Math.random() * 2,
      })
    }

    const draw = () => {
      frameRef.current++
      const t = frameRef.current / 60
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      ctx.clearRect(0, 0, width, height)

      for (const node of nodes) {
        const dx = mx - node.baseX
        const dy = my - node.baseY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const influence = Math.max(0, 1 - dist / 280) * 14
        node.x = node.baseX + (dx / (dist || 1)) * influence
        node.y = node.baseY + (dy / (dist || 1)) * influence
      }

      for (const edge of edges) {
        const pulse = Math.sin(t * 1.2 + edge.phase) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(90, 90, 180, ${0.018 + pulse * 0.035})`
        ctx.lineWidth = 0.6
        ctx.beginPath()
        const mx2 = (edge.from.x + edge.to.x) / 2
        ctx.moveTo(edge.from.x, edge.from.y)
        ctx.quadraticCurveTo(mx2, edge.from.y, edge.to.x, edge.to.y)
        ctx.stroke()
      }

      for (const p of particles) {
        p.t += p.speed
        if (p.t > 1) {
          p.edge = edges[Math.floor(Math.random() * edges.length)]
          p.t = 0
        }
        const prog = p.t
        const px = p.edge.from.x + (p.edge.to.x - p.edge.from.x) * prog
        const py = p.edge.from.y + (p.edge.to.y - p.edge.from.y) * prog
        const alpha = Math.sin(prog * Math.PI) * 0.7
        const col = p.edge.from.color || '#8B5CF6'
        ctx.fillStyle = col.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(')', '')
        // simpler: use fixed purple/green palette
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha * 0.8})`
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      if (Math.random() < 0.07) {
        particles.push({
          edge: edges[Math.floor(Math.random() * edges.length)],
          t: 0, speed: 0.005 + Math.random() * 0.009, size: 1 + Math.random() * 2.5,
        })
        if (particles.length > 100) particles.shift()
      }

      for (const node of nodes) {
        const pulse = Math.sin(t * 1.2 + node.baseX * 0.012 + node.baseY * 0.012) * 0.5 + 0.5
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
        const hover = Math.max(0, 1 - dist / 160)
        const r = 3.5 + pulse * 2 + hover * 4

        ctx.shadowColor = node.color
        ctx.shadowBlur = 10 + pulse * 12 + hover * 16
        ctx.fillStyle = node.color
        ctx.globalAlpha = 0.45 + pulse * 0.35 + hover * 0.2
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0

        ctx.fillStyle = '#fff'
        ctx.globalAlpha = 0.15 + hover * 0.55
        ctx.beginPath()
        ctx.arc(node.x, node.y, r * 0.38, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      className="block"
    />
  )
}

// Navbar component
function Navbar({ onEnter }) {
  const [scrolled, setScrolled] = useState(false)
  const scrollRef = useRef(null)

  return (
    <nav
      className="sticky top-0 z-50 w-full flex items-center justify-between px-8 py-4 transition-all duration-300"
      style={{
        background: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22C55E, #3B82F6)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-base font-bold tracking-tight">
            <span className="text-white">Model</span><span style={{ color: '#22C55E' }}>Arena</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {['Games', 'Features', 'How it works'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              className="px-3 py-1.5 rounded-md text-sm text-[#8A8AA3] hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-[#505068] hidden sm:block">No signup needed</span>
        <button
          onClick={onEnter}
          className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
        >
          Launch App →
        </button>
      </div>
    </nav>
  )
}

export default function WelcomeScreen({ onDismiss }) {
  const { setActiveGame, setView } = useGameStore()
  const [hoveredGame, setHoveredGame] = useState(null)
  const [hoveredFeature, setHoveredFeature] = useState(null)

  const handleStart = (gameId, view = 'builder') => {
    setActiveGame(gameId)
    setView(view)
    onDismiss()
  }

  return (
    <div className="h-full w-full overflow-y-auto" style={{ background: '#050508' }}>
      <Navbar onEnter={() => handleStart('snake', 'builder')} />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-8 pb-24">
        {/* Gradient mesh */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: `
            radial-gradient(ellipse at 20% 40%, rgba(34,197,94,0.07) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 90%, rgba(168,85,247,0.05) 0%, transparent 50%)
          `
        }} />

        {/* Canvas bg */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-50">
          <HeroCanvas width={1200} height={700} />
        </div>

        {/* Top + bottom fade */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, #050508 0%, transparent 15%, transparent 75%, #050508 100%)'
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'linear-gradient(to right, #050508 0%, transparent 20%, transparent 80%, #050508 100%)'
        }} />

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono tracking-widest mb-8"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              BROWSER-NATIVE MACHINE LEARNING
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.88] mb-6">
              <span className="text-white">Train AI.</span>
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #22C55E 0%, #3B82F6 40%, #A855F7 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Beat the Game.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-[#8A8AA3] max-w-2xl mx-auto leading-relaxed mb-4">
              Build neural networks visually, train them on classic games, and watch
              your AI learn in real-time — all in your browser.
            </p>
            <p className="text-sm text-[#505068] font-mono mb-10">
              No backend &nbsp;·&nbsp; No API keys &nbsp;·&nbsp; No signup &nbsp;·&nbsp; 100% free
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(34,197,94,0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStart('snake', 'builder')}
                className="px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 0 30px rgba(34,197,94,0.25)' }}
              >
                Start Building — Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStart('snake', 'play')}
                className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all text-[#8A8AA3] hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                Watch a Demo ↗
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[11px] text-[#505068] tracking-widest uppercase font-mono">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#505068" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="py-12 border-y" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-4xl font-black tracking-tight mb-1" style={{
                background: 'linear-gradient(135deg, #22C55E, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>{stat.value}</div>
              <div className="text-sm text-[#505068] font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── GAMES ── */}
      <section id="games" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono tracking-widest text-[#505068] mb-3 uppercase">5 Environments</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Pick your battleground</h2>
            <p className="text-[#8A8AA3] text-lg max-w-xl mx-auto">
              From beginner-friendly Snake to expert-level Chess. Each game has unique reward structures and RL challenges.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HERO_GAMES.map((game, i) => {
              const isHovered = hoveredGame === game.id
              return (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  onMouseEnter={() => setHoveredGame(game.id)}
                  onMouseLeave={() => setHoveredGame(null)}
                  onClick={() => handleStart(game.id, 'builder')}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-left p-5 rounded-2xl transition-all duration-200 relative overflow-hidden group"
                  style={{
                    background: isHovered ? `linear-gradient(135deg, ${game.color}10, ${game.color}06)` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isHovered ? game.color + '35' : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isHovered ? `0 8px 40px ${game.color}18, 0 0 0 1px ${game.color}15` : 'none',
                  }}
                >
                  {/* Glow blob */}
                  {isHovered && (
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 blur-3xl pointer-events-none"
                      style={{ background: game.color }} />
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{game.emoji}</span>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full"
                      style={{
                        background: game.color + '15',
                        color: game.color,
                        border: `1px solid ${game.color}30`,
                      }}>
                      {game.difficulty}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{game.label}</h3>
                  <p className="text-sm text-[#8A8AA3] leading-relaxed">{game.desc}</p>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-medium transition-colors"
                    style={{ color: isHovered ? game.color : '#505068' }}>
                    Train now
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </motion.button>
              )
            })}

            {/* Last card - CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-2xl flex flex-col items-center justify-center text-center"
              style={{ background: 'rgba(34,197,94,0.04)', border: '1px dashed rgba(34,197,94,0.2)' }}
            >
              <div className="text-3xl mb-3">🧠</div>
              <p className="text-sm text-[#8A8AA3] mb-3">More environments coming soon</p>
              <span className="text-xs font-mono text-[#22C55E]">Pong · Breakout · Pacman</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.012)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono tracking-widest text-[#505068] mb-3 uppercase">Everything you need</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Built for learning ML</h2>
            <p className="text-[#8A8AA3] text-lg max-w-xl mx-auto">
              A complete RL sandbox. No textbooks. No boilerplate. Just build, train, compete.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const isHovered = hoveredFeature === i
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  onMouseEnter={() => setHoveredFeature(i)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className="p-5 rounded-2xl transition-all duration-200"
                  style={{
                    background: isHovered ? `${feat.color}08` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isHovered ? feat.color + '28' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                    style={{ background: feat.color + '15', color: feat.color }}>
                    {feat.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-[#8A8AA3] leading-relaxed">{feat.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono tracking-widest text-[#505068] mb-3 uppercase">Simple process</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">How it works</h2>
            <p className="text-[#8A8AA3] text-lg max-w-xl mx-auto">
              From zero to trained AI in three steps. No experience required.
            </p>
          </motion.div>

          <div className="space-y-4">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex gap-6 p-6 rounded-2xl transition-all duration-200 group hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg font-mono"
                  style={{ background: step.color + '12', color: step.color, border: `1px solid ${step.color}25` }}>
                  {step.step}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-[#8A8AA3] text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH CALLOUT ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-8 md:p-12 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.07), rgba(59,130,246,0.05), rgba(168,85,247,0.07))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.04) 0%, transparent 70%)'
            }} />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                {['TensorFlow.js', 'React 19', 'Framer Motion', 'Zustand', 'Recharts'].map((tech) => (
                  <span key={tech} className="px-3 py-1 rounded-full text-xs font-mono"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8A8AA3' }}>
                    {tech}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
                Runs entirely in your browser
              </h2>
              <p className="text-[#8A8AA3] text-base max-w-xl mx-auto mb-8 leading-relaxed">
                Powered by TensorFlow.js, ModelArena runs DQN training and inference directly in the browser.
                Your models, your data — never leaves your machine.
              </p>
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 0 50px rgba(34,197,94,0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleStart('snake', 'builder')}
                className="px-10 py-4 rounded-xl text-sm font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 0 30px rgba(34,197,94,0.25)' }}
              >
                Start Training Now — Free
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22C55E, #3B82F6)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold">
              <span className="text-white">Model</span><span style={{ color: '#22C55E' }}>Arena</span>
            </span>
          </div>
          <p className="text-xs text-[#505068] font-mono">
            100% client-side · Open source · Built with TensorFlow.js
          </p>
          <div className="flex items-center gap-4 text-xs text-[#505068]">
            <span>No backend</span>
            <span>·</span>
            <span>No tracking</span>
            <span>·</span>
            <span>No cookies</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
