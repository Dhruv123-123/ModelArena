import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion as M } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const HERO_GAMES = [
  { id: 'snake', label: 'Snake', icon: 'videogame_asset' },
  { id: 'flappy', label: 'Flappy Bird', icon: 'flutter_dash' },
  { id: 'cartpole', label: 'CartPole', icon: 'analytics' },
  { id: 'twentyfortyeight', label: '2048', icon: 'grid_view' },
  { id: 'chess', label: 'Chess', icon: 'chess' },
]

// Animated neural network canvas for hero viewport
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

    const nodes = []
    layerSizes.forEach((size, li) => {
      const spacing = Math.min(height * 0.7 / (size + 1), 36)
      const startY = (height - (size - 1) * spacing) / 2
      for (let i = 0; i < size; i++) {
        nodes.push({
          x: layerX[li], y: startY + i * spacing,
          layer: li,
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

      for (const edge of edges) {
        const pulse = Math.sin(t * 1.5 + edge.phase) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(0, 255, 194, ${0.02 + pulse * 0.04})`
        ctx.lineWidth = 0.5
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
        const alpha = Math.sin(prog * Math.PI) * 0.6
        ctx.fillStyle = `rgba(0, 253, 193, ${alpha})`
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

      for (const node of nodes) {
        const pulse = Math.sin(t * 1.2 + node.baseX * 0.01 + node.baseY * 0.01) * 0.5 + 0.5
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
        const hover = Math.max(0, 1 - dist / 150)
        const r = 3 + pulse * 1.5 + hover * 3

        ctx.shadowColor = '#00FFC2'
        ctx.shadowBlur = 8 + pulse * 10 + hover * 12
        ctx.fillStyle = '#00FFC2'
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
      className="block w-full h-full"
    />
  )
}

export default function WelcomeScreen() {
  const navigate = useNavigate()
  const { setActiveGame, setView } = useGameStore()

  const handleStart = (gameId, view) => {
    setActiveGame(gameId)
    setView(view)
    localStorage.setItem('modelarena-visited', 'true')
    navigate('/app')
  }

  return (
    <M.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[100dvh] w-full bg-bg-primary grid-bg overflow-x-hidden overflow-y-auto"
    >
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-bg-primary/80 backdrop-blur-xl border-b border-border-light">
        <div className="flex items-center gap-8">
          <span className="flex items-center gap-2">
            <span className="w-6 h-6 bg-primary rounded-full opacity-80" />
            <span className="text-xl font-black text-text-primary tracking-tighter uppercase">ModelArena</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleStart('snake', 'builder')}
            className="px-5 py-2 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:brightness-110 transition-all"
          >
            Launch App
          </button>
        </div>
      </header>

      {/* Ambient glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-5%] w-[400px] h-[400px] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-28 pb-12 lg:py-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Value Prop */}
          <M.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="lg:col-span-7 space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bg-elevated border border-border-light">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">Live Neural Processing v2.0</span>
            </div>

            <h1 className="font-black text-6xl lg:text-8xl leading-[0.95] tracking-tighter text-text-primary">
              Build. Train.<br />
              Watch. <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-bright">Conquer.</span>
            </h1>

            <p className="text-xl text-text-secondary max-w-2xl leading-relaxed">
              Watch your neural networks go from zero to beating Snake in real-time. A high-performance sandbox for developing and benchmarking AI agents.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => handleStart('snake', 'play')}
                className="px-8 py-4 bg-primary text-on-primary font-label text-sm uppercase font-bold tracking-widest rounded-lg flex items-center gap-3 neural-glow hover:brightness-110 transition-all"
              >
                <span className="material-symbols-outlined">play_circle</span>
                Pick a Game & Watch
              </button>
              <button
                onClick={() => handleStart('snake', 'builder')}
                className="px-8 py-4 border border-border-focus hover:border-primary/50 text-text-primary font-label text-sm uppercase font-bold tracking-widest rounded-lg flex items-center gap-3 transition-all backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">code</span>
                Start Building
              </button>
            </div>

            {/* Stats Row */}
            <div className="pt-8 grid grid-cols-3 gap-8">
              <div>
                <p className="font-mono text-2xl text-primary">1.2M+</p>
                <p className="font-label text-[10px] uppercase tracking-widest text-text-secondary">Generations Trained</p>
              </div>
              <div>
                <p className="font-mono text-2xl text-secondary">98.4%</p>
                <p className="font-label text-[10px] uppercase tracking-widest text-text-secondary">Avg. Accuracy</p>
              </div>
              <div>
                <p className="font-mono text-2xl text-tertiary">42ms</p>
                <p className="font-label text-[10px] uppercase tracking-widest text-text-secondary">Inference Latency</p>
              </div>
            </div>
          </M.div>

          {/* Right: Live Game Viewport */}
          <M.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="lg:col-span-5"
          >
            <div className="relative group">
              {/* Neon Frame */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative bg-bg-primary rounded-lg border border-border-light overflow-hidden aspect-square flex flex-col shadow-2xl">
                {/* Game Header */}
                <div className="p-4 border-b border-border bg-bg-elevated flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">videogame_asset</span>
                    <span className="font-label text-xs uppercase tracking-widest">Environment: Snake_v1</span>
                  </div>
                  <div className="flex gap-4 font-mono text-[10px] text-primary">
                    <span>SCORE: 042</span>
                    <span>STEPS: 1,204</span>
                  </div>
                </div>
                {/* Canvas Area */}
                <div className="flex-1 relative bg-[#050508]">
                  <HeroNetwork width={500} height={400} />
                  {/* HUD Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 grid grid-cols-2 gap-4">
                    <div className="hud-overlay p-2 rounded">
                      <p className="font-label text-[8px] uppercase tracking-widest text-text-secondary mb-1">Neural Topology</p>
                      <div className="flex gap-1 h-8 items-end">
                        {[40, 80, 60, 90, 30, 70].map((h, i) => (
                          <div key={i} className="w-1 bg-primary" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    <div className="hud-overlay p-2 rounded flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-label text-[8px] uppercase tracking-widest text-text-secondary">Status</p>
                        <p className="font-mono text-[10px] text-primary">OPTIMIZING</p>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Game Footer */}
                <div className="p-3 bg-bg-tertiary border-t border-border flex gap-2">
                  <div className="flex-1 bg-bg-elevated rounded px-3 py-2 flex items-center justify-between">
                    <span className="font-label text-[10px] text-text-secondary">Model: NeuroEvo_v4</span>
                    <span className="material-symbols-outlined text-xs text-primary">check_circle</span>
                  </div>
                </div>
              </div>
            </div>
          </M.div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="container mx-auto px-6 py-20 relative z-10">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Integrated Platform Components</h2>
          <div className="h-1 w-20 bg-primary" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: 'architecture', color: 'primary', title: 'Visual Model Builder',
              desc: 'Drag-and-drop neural layers. Configure activation functions, optimizers, and dropout rates without writing a single line of boilerplate.',
              status: 'Module active',
            },
            {
              icon: 'model_training', color: 'secondary', title: 'Training Cockpit',
              desc: 'Monitor live gradients and loss curves. Tweak hyperparameters on-the-fly without restarting the session. Real-time inference visualization.',
              status: 'Live telemetry', pulse: true,
            },
            {
              icon: 'leaderboard', color: 'tertiary', title: 'Global Leaderboard',
              desc: 'Pit your model against the world. Climb the ranks in Snake, Flappy Bird, and custom procedural environments designed for AI stress-testing.',
              status: 'Season 4 Live',
            },
          ].map((card) => (
            <button
              key={card.title}
              onClick={() => handleStart('snake', card.icon === 'architecture' ? 'builder' : card.icon === 'model_training' ? 'train' : 'leaderboard')}
              className="text-left bg-bg-tertiary border border-border rounded-lg p-8 group hover:bg-bg-elevated transition-all duration-300 relative overflow-hidden"
            >
              {card.pulse && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                  </span>
                </div>
              )}
              <div className={`w-12 h-12 rounded-lg bg-${card.color}/10 flex items-center justify-center mb-6 border border-${card.color}/20 group-hover:border-${card.color}/50 transition-colors`}>
                <span className={`material-symbols-outlined text-${card.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{card.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">{card.desc}</p>
              <div className="mt-auto pt-4 border-t border-border flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                <span className="font-label text-[10px] uppercase tracking-widest">{card.status}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-2">How It Works</h2>
          <p className="text-text-secondary">Three steps from zero to AI agent</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '01', title: 'Build', desc: 'Design your neural architecture with drag-and-drop layers.', icon: 'architecture' },
            { step: '02', title: 'Train', desc: 'Watch your model learn through reinforcement learning in real-time.', icon: 'model_training' },
            { step: '03', title: 'Compete', desc: 'Pit your model against others and climb the leaderboard.', icon: 'leaderboard' },
          ].map((item) => (
            <div key={item.step} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
              </div>
              <div>
                <span className="font-mono text-[10px] text-primary/60">{item.step}</span>
                <h3 className="text-lg font-bold">{item.title}</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Game Gallery */}
      <section className="container mx-auto px-6 py-16 relative z-10">
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Game Gallery</h2>
          <div className="h-1 w-20 bg-secondary" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {HERO_GAMES.map((game) => {
            const info = GAMES[game.id]
            return (
              <button
                key={game.id}
                onClick={() => handleStart(game.id, 'builder')}
                className="group bg-bg-tertiary border border-border rounded-lg p-6 text-center hover:border-primary/30 hover:bg-bg-elevated transition-all"
              >
                <span className="material-symbols-outlined text-3xl text-text-muted group-hover:text-primary transition-colors mb-3 block">{game.icon}</span>
                <h4 className="font-bold text-sm mb-1">{game.label}</h4>
                <p className="font-label text-[10px] text-text-muted uppercase tracking-widest">{info.difficulty}</p>
              </button>
            )
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-10 py-12 px-6 relative z-10">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-xl font-black text-text-primary tracking-tighter mb-4 block uppercase">ModelArena</span>
            <p className="text-text-secondary text-sm max-w-sm mb-6">
              The premier destination for neuroevolution enthusiasts. Build, train, and watch the future of machine intelligence unfold in real-time.
            </p>
          </div>
          <div>
            <h4 className="font-label text-[10px] uppercase tracking-[0.3em] text-text-primary font-bold mb-6">Engine</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>TensorFlow.js</li>
              <li>DQN Agent</li>
              <li>Supervised Learning</li>
              <li>Model Export</li>
            </ul>
          </div>
          <div>
            <h4 className="font-label text-[10px] uppercase tracking-[0.3em] text-text-primary font-bold mb-6">Platform</h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>5 Game Environments</li>
              <li>Leaderboard</li>
              <li>Human vs AI</li>
              <li>100% Client-Side</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-mono text-[10px] text-text-muted">MODELARENA v2.4.0 // BROWSER-NATIVE ML</p>
          <div className="flex gap-8">
            <span className="font-mono text-[10px] text-text-muted">NO BACKEND</span>
            <span className="font-mono text-[10px] text-text-muted">NO API KEYS</span>
          </div>
        </div>
      </footer>
    </M.div>
  )
}
