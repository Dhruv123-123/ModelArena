import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const HERO_GAMES = [
  { id: 'snake', color: '#22C55E', label: 'Snake', emoji: '🐍' },
  { id: 'flappy', color: '#F97316', label: 'Flappy Bird', emoji: '🐦' },
  { id: 'cartpole', color: '#3B82F6', label: 'CartPole', emoji: '⚖️' },
  { id: 'twentyfortyeight', color: '#A855F7', label: '2048', emoji: '🔢' },
  { id: 'chess', color: '#EAB308', label: 'Chess', emoji: '♟️' },
]

// Large animated neural network hero
function HeroNetwork({ width, height }) {
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

    const layerSizes = [6, 10, 14, 12, 8, 4]
    const layerX = layerSizes.map((_, i) => (width * 0.1) + (i / (layerSizes.length - 1)) * (width * 0.8))
    const layerColors = ['#22C55E', '#3B82F6', '#6366F1', '#A855F7', '#F97316', '#EAB308']

    const nodes = []
    layerSizes.forEach((size, li) => {
      const spacing = Math.min(height * 0.7 / (size + 1), 36)
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
    for (let i = 0; i < 50; i++) {
      particles.push({
        edge: edges[Math.floor(Math.random() * edges.length)],
        t: Math.random(),
        speed: 0.006 + Math.random() * 0.01,
        size: 1 + Math.random() * 2,
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
        const influence = Math.max(0, 1 - dist / 250) * 10
        node.x = node.baseX + (dx / (dist || 1)) * influence
        node.y = node.baseY + (dy / (dist || 1)) * influence
      }

      // Edges — bezier curves
      for (const edge of edges) {
        const pulse = Math.sin(t * 1.5 + edge.phase) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(100, 100, 180, ${0.02 + pulse * 0.04})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        const mx2 = (edge.from.x + edge.to.x) / 2
        ctx.moveTo(edge.from.x, edge.from.y)
        ctx.quadraticCurveTo(mx2, edge.from.y, edge.to.x, edge.to.y)
        ctx.stroke()
      }

      // Particles
      for (const p of particles) {
        p.t += p.speed
        if (p.t > 1) {
          p.edge = edges[Math.floor(Math.random() * edges.length)]
          p.t = 0
        }
        const prog = p.t
        const px = p.edge.from.x + (p.edge.to.x - p.edge.from.x) * prog
        const py = p.edge.from.y + (p.edge.to.y - p.edge.from.y) * prog
        const alpha = Math.sin(prog * Math.PI) * 0.6
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`
        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      if (Math.random() < 0.08) {
        particles.push({
          edge: edges[Math.floor(Math.random() * edges.length)],
          t: 0, speed: 0.006 + Math.random() * 0.01, size: 1 + Math.random() * 2,
        })
        if (particles.length > 80) particles.shift()
      }

      // Nodes
      for (const node of nodes) {
        const pulse = Math.sin(t * 1.2 + node.baseX * 0.01 + node.baseY * 0.01) * 0.5 + 0.5
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
        const hover = Math.max(0, 1 - dist / 150)
        const r = 3 + pulse * 1.5 + hover * 3

        ctx.shadowColor = node.color
        ctx.shadowBlur = 8 + pulse * 10 + hover * 12
        ctx.fillStyle = node.color
        ctx.globalAlpha = 0.5 + pulse * 0.3 + hover * 0.2
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0

        ctx.fillStyle = '#fff'
        ctx.globalAlpha = 0.2 + hover * 0.5
        ctx.beginPath()
        ctx.arc(node.x, node.y, r * 0.35, 0, Math.PI * 2)
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

export default function WelcomeScreen({ onDismiss }) {
  const { setActiveGame, setView } = useGameStore()
  const [hoveredGame, setHoveredGame] = useState(null)

  const handleStart = (gameId, view) => {
    setActiveGame(gameId)
    setView(view)
    onDismiss()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full w-full bg-bg-primary flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-bg" />

      {/* Background network animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto opacity-60">
        <HeroNetwork width={1100} height={600} />
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/90 via-transparent to-bg-primary/95 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/60 via-transparent to-bg-primary/60 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-xs font-mono tracking-[0.25em] text-text-muted mb-5 uppercase">Browser-Native Machine Learning</p>
          <h1 className="text-7xl md:text-8xl font-extrabold tracking-tighter mb-5 leading-[0.9]">
            <span className="text-text-primary">Model</span>
            <span className="bg-gradient-to-r from-[#22C55E] via-[#3B82F6] to-[#A855F7] text-transparent bg-clip-text">Arena</span>
          </h1>
          <p className="text-lg text-text-secondary max-w-xl mx-auto leading-relaxed mb-2">
            Build neural networks visually. Train them against classic games.
            Watch them learn in real-time.
          </p>
          <p className="text-xs text-text-muted font-mono tabular-nums">No backend &middot; No API keys &middot; 100% in your browser</p>
        </motion.div>

        {/* Game pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 flex gap-2 justify-center flex-wrap"
        >
          {HERO_GAMES.map((game) => {
            const info = GAMES[game.id]
            const isHovered = hoveredGame === game.id
            return (
              <motion.button
                key={game.id}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
                onClick={() => handleStart(game.id, 'builder')}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5"
                style={{
                  background: isHovered ? game.color + '12' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isHovered ? game.color + '30' : 'rgba(255,255,255,0.06)'}`,
                  color: isHovered ? game.color : '#8A8AA3',
                  boxShadow: isHovered ? `0 4px 24px ${game.color}15` : 'none',
                }}
              >
                <span className="text-lg">{game.emoji}</span>
                <span>{game.label}</span>
                <span className="text-xs opacity-50">{info.difficulty}</span>
              </motion.button>
            )
          })}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex gap-3 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(34, 197, 94, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStart('snake', 'builder')}
            className="px-7 py-3 rounded-xl bg-white text-[#050508] font-semibold text-sm transition-all hover:bg-white/90"
          >
            Start Building
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleStart('snake', 'play')}
            className="px-7 py-3 rounded-xl font-semibold text-sm transition-all text-text-secondary hover:text-text-primary"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Watch a Demo
          </motion.button>
        </motion.div>

        {/* Feature chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-12 flex items-center justify-center gap-6 text-xs text-text-muted"
        >
          {[
            'Visual Model Builder',
            'Real-Time Training',
            'DQN & Supervised Learning',
            'Human vs AI',
            '5 Game Environments',
          ].map((f, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-text-muted" />
              {f}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
