import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const HERO_GAMES = [
  { id: 'snake', color: '#22C55E', label: 'Snake', emoji: '🐍' },
  { id: 'flappy', color: '#F97316', label: 'Flappy Bird', emoji: '🐦' },
  { id: 'cartpole', color: '#3B82F6', label: 'CartPole', emoji: '⚖️' },
  { id: 'twentyfortyeight', color: '#A855F7', label: '2048', emoji: '🔢' },
  { id: 'chess', color: '#EAB308', label: 'Chess', emoji: '♟️' },
]

const STEPS = [
  { icon: '🎮', title: 'Pick a Game', desc: 'Choose from 5 classic environments, each teaching different ML concepts' },
  { icon: '🧠', title: 'Design Your Model', desc: 'Stack layers visually — Dense, Conv2D, Dropout — and watch the network graph update live' },
  { icon: '⚡', title: 'Train It', desc: 'One click to start. Watch real-time reward curves, loss plots, and epsilon decay' },
  { icon: '👀', title: 'Watch It Play', desc: 'See your neural network make decisions with Q-value overlays. Or play against it yourself' },
]

function AnimatedNetwork({ width = 300, height = 200 }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const nodes = [
      // Input layer
      ...Array.from({ length: 4 }, (_, i) => ({ x: 50, y: 30 + i * 45, layer: 0, r: 5 })),
      // Hidden 1
      ...Array.from({ length: 6 }, (_, i) => ({ x: 120, y: 15 + i * 34, layer: 1, r: 5 })),
      // Hidden 2
      ...Array.from({ length: 6 }, (_, i) => ({ x: 190, y: 15 + i * 34, layer: 2, r: 5 })),
      // Output
      ...Array.from({ length: 3 }, (_, i) => ({ x: 260, y: 55 + i * 45, layer: 3, r: 5 })),
    ]

    const edges = []
    for (const a of nodes) {
      for (const b of nodes) {
        if (b.layer === a.layer + 1) {
          edges.push({ from: a, to: b, phase: Math.random() * Math.PI * 2 })
        }
      }
    }

    const draw = () => {
      frameRef.current++
      const t = frameRef.current / 60
      ctx.clearRect(0, 0, width, height)

      // Edges
      for (const edge of edges) {
        const pulse = Math.sin(t * 2 + edge.phase) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.05 + pulse * 0.15})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(edge.from.x, edge.from.y)
        ctx.lineTo(edge.to.x, edge.to.y)
        ctx.stroke()

        // Data particle
        const pt = (t * 0.3 + edge.phase / 6) % 1
        const px = edge.from.x + (edge.to.x - edge.from.x) * pt
        const py = edge.from.y + (edge.to.y - edge.from.y) * pt
        ctx.fillStyle = `rgba(99, 102, 241, ${0.3 + pulse * 0.5})`
        ctx.beginPath()
        ctx.arc(px, py, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Nodes
      for (const node of nodes) {
        const pulse = Math.sin(t * 1.5 + node.x * 0.05 + node.y * 0.05) * 0.5 + 0.5
        const colors = ['#22C55E', '#3B82F6', '#A855F7', '#F97316']
        const color = colors[node.layer]

        ctx.shadowColor = color
        ctx.shadowBlur = 4 + pulse * 6
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animId)
  }, [width, height])

  return <canvas ref={canvasRef} width={width} height={height} className="opacity-60" />
}

export default function WelcomeScreen({ onDismiss }) {
  const { setActiveGame, setView } = useGameStore()
  const [hoveredGame, setHoveredGame] = useState(null)

  const handleQuickStart = (gameId) => {
    setActiveGame(gameId)
    setView('builder')
    onDismiss()
  }

  const handleTryDemo = (gameId) => {
    setActiveGame(gameId)
    setView('play')
    onDismiss()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full w-full bg-bg-primary overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 opacity-30 pointer-events-none">
            <AnimatedNetwork width={300} height={200} />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-5xl font-bold tracking-tight mb-3 mt-24">
              <span className="text-text-primary">Model</span>
              <span className="text-accent-snake">Arena</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
              Build, train, and battle your own neural networks against classic games — entirely in the browser.
            </p>
            <p className="text-xs text-text-muted mt-2 font-mono">No backend. No API keys. No ML experience required.</p>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h2 className="text-sm uppercase tracking-widest text-text-muted text-center mb-6">How It Works</h2>
          <div className="grid grid-cols-4 gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center p-4 rounded-xl bg-bg-card border border-border"
              >
                <div className="text-2xl mb-2">{step.icon}</div>
                <h3 className="text-sm font-semibold text-text-primary mb-1">{step.title}</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 text-text-muted text-lg">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Game selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-sm uppercase tracking-widest text-text-muted text-center mb-6">Choose Your Arena</h2>
          <div className="grid grid-cols-5 gap-3">
            {HERO_GAMES.map((game, i) => {
              const info = GAMES[game.id]
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  onMouseEnter={() => setHoveredGame(game.id)}
                  onMouseLeave={() => setHoveredGame(null)}
                  className="rounded-xl border border-border bg-bg-card p-4 text-center cursor-pointer transition-colors hover:border-border-light group relative overflow-hidden"
                  style={{
                    boxShadow: hoveredGame === game.id ? `0 0 30px ${game.color}20` : 'none',
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${game.color}10, transparent 70%)` }}
                  />
                  <div className="relative">
                    <div className="text-3xl mb-2">{game.emoji}</div>
                    <h3 className="text-sm font-semibold text-text-primary">{game.label}</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">{info.difficulty} · {info.category}</p>
                    <div className="mt-3 space-y-1.5">
                      <button
                        onClick={() => handleTryDemo(game.id)}
                        className="w-full px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                        style={{ backgroundColor: game.color + '15', color: game.color, border: `1px solid ${game.color}30` }}
                      >
                        Watch Demo
                      </button>
                      <button
                        onClick={() => handleQuickStart(game.id)}
                        className="w-full px-2 py-1.5 rounded-lg text-[10px] font-medium text-text-secondary bg-bg-hover border border-border hover:text-text-primary transition-colors"
                      >
                        Build Model
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Featured pre-trained models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <h2 className="text-sm uppercase tracking-widest text-text-muted text-center mb-6">Pre-Trained Models — See What's Possible</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { game: 'snake', name: 'SnakeBot v1', desc: 'Trained 500 episodes with a 2-layer Dense network. Scores ~15 consistently.', score: '~15', color: '#22C55E', tier: '🥉 Bronze' },
              { game: 'cartpole', name: 'BalanceBot', desc: 'Solved CartPole (195+ steps) with just a simple 32-unit network.', score: '195+', color: '#3B82F6', tier: '🥇 Gold' },
              { game: 'flappy', name: 'FlapNet', desc: 'Navigates 5-10 pipes with a 3-layer architecture. Can you do better?', score: '~8', color: '#F97316', tier: '🥉 Bronze' },
            ].map((model, i) => (
              <motion.div
                key={model.game}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="rounded-xl border border-border bg-bg-card p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{GAMES[model.game].icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{model.name}</h3>
                    <span className="text-[10px] font-mono" style={{ color: model.color }}>{model.tier}</span>
                  </div>
                  <span className="ml-auto text-lg font-mono font-bold" style={{ color: model.color }}>{model.score}</span>
                </div>
                <p className="text-[11px] text-text-secondary leading-relaxed mb-3">{model.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTryDemo(model.game)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium"
                    style={{ backgroundColor: model.color + '15', color: model.color, border: `1px solid ${model.color}30` }}
                  >
                    Watch It Play
                  </button>
                  <button
                    onClick={() => handleQuickStart(model.game)}
                    className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-medium text-text-secondary bg-bg-hover border border-border hover:text-text-primary transition-colors"
                  >
                    Try to Beat It
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick start CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-center pb-8"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setActiveGame('snake'); setView('builder'); onDismiss() }}
            className="px-8 py-3 rounded-xl bg-accent-snake text-bg-primary font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Start Building — Snake (Recommended)
          </motion.button>
          <p className="text-[10px] text-text-muted mt-3">
            No setup required. Everything runs in your browser.
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
