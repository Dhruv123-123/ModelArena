import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SnakeEngine from '../../games/snake/SnakeEngine.js'
import { ACTION_TO_DIRECTION } from '../../games/snake/snakeConfig.js'

// ─── Heuristic "trained" snake agent ─────────────────────────────────────────
// Uses BFS to find a path to food while avoiding walls/body.
// Falls back to greedy distance-minimising when BFS fails.

function bfsPath(snake, food, gs) {
  const head = snake[0]
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`))
  const queue = [[head, []]]
  const visited = new Set([`${head.x},${head.y}`])
  const dirs = [
    { x: 0, y: -1 }, { x: 0, y: 1 },
    { x: -1, y: 0 }, { x: 1, y: 0 },
  ]
  while (queue.length) {
    const [cur, path] = queue.shift()
    for (const d of dirs) {
      const nx = cur.x + d.x
      const ny = cur.y + d.y
      const key = `${nx},${ny}`
      if (nx < 0 || nx >= gs || ny < 0 || ny >= gs) continue
      if (occupied.has(key) || visited.has(key)) continue
      const newPath = [...path, d]
      if (nx === food.x && ny === food.y) return newPath
      visited.add(key)
      queue.push([{ x: nx, y: ny }, newPath])
    }
  }
  return null
}

function dirToAction(d) {
  if (d.y === -1) return 0 // Up
  if (d.y === 1) return 1  // Down
  if (d.x === -1) return 2 // Left
  return 3                  // Right
}

function heuristicAction(engine) {
  const { snake, food, gridSize: gs, direction: cur } = engine
  const head = snake[0]

  // 1. Try BFS to food
  const path = bfsPath(snake, food, gs)
  if (path && path.length > 0) {
    const first = path[0]
    // Don't reverse
    if (!(first.x === -cur.x && first.y === -cur.y)) {
      return dirToAction(first)
    }
  }

  // 2. Greedy fallback — move toward food, avoid immediate death
  const dirs = [
    { x: 0, y: -1, action: 0 },
    { x: 0, y: 1, action: 1 },
    { x: -1, y: 0, action: 2 },
    { x: 1, y: 0, action: 3 },
  ]
  const occupied = new Set(snake.map(s => `${s.x},${s.y}`))
  const isSafe = (x, y) => {
    if (x < 0 || x >= gs || y < 0 || y >= gs) return false
    return !occupied.has(`${x},${y}`)
  }

  let best = null, bestScore = -Infinity
  for (const d of dirs) {
    if (d.x === -cur.x && d.y === -cur.y) continue
    const nx = head.x + d.x, ny = head.y + d.y
    if (!isSafe(nx, ny)) continue
    const dist = Math.abs(nx - food.x) + Math.abs(ny - food.y)
    if (-dist > bestScore) { bestScore = -dist; best = d.action }
  }
  return best ?? 0
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

const CELL = 11
const GRID = 20
const W = CELL * GRID
const ACCENT = '#22C55E'
const BG = '#07070C'

function renderSnake(canvas, engine) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, W)

  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, W)

  // Grid dots
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  for (let x = 0; x < GRID; x++) {
    for (let y = 0; y < GRID; y++) {
      ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 1.5, 1.5)
    }
  }

  const { snake, food } = engine

  // Food
  ctx.shadowColor = '#F97316'
  ctx.shadowBlur = 10
  ctx.fillStyle = '#F97316'
  ctx.beginPath()
  ctx.roundRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 3)
  ctx.fill()
  ctx.shadowBlur = 0

  // Snake body
  snake.forEach((seg, i) => {
    const alpha = 1 - (i / snake.length) * 0.55
    const isHead = i === 0
    if (isHead) {
      ctx.shadowColor = ACCENT
      ctx.shadowBlur = 14
    }
    ctx.fillStyle = isHead
      ? ACCENT
      : `rgba(34,197,94,${alpha * 0.8})`
    ctx.beginPath()
    const pad = isHead ? 1 : 2
    ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 3 : 2)
    ctx.fill()
    ctx.shadowBlur = 0
  })
}

// ─── Simulated training curve data ───────────────────────────────────────────

function generateTrainingCurve() {
  const data = []
  let score = 0
  for (let ep = 0; ep < 300; ep++) {
    // Rough sigmoid learning curve with noise
    const progress = ep / 300
    const base = 15 / (1 + Math.exp(-10 * (progress - 0.45)))
    const noise = (Math.random() - 0.5) * 4
    score = Math.max(0, base + noise)
    if (ep % 5 === 0) data.push({ ep, score: Math.round(score * 10) / 10 })
  }
  return data
}

const TRAINING_CURVE = generateTrainingCurve()

// ─── Mini SVG sparkline ───────────────────────────────────────────────────────

function Sparkline({ data, color = '#22C55E', width = 280, height = 80 }) {
  const max = Math.max(...data.map(d => d.score), 1)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.score / max) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')

  const areaPath = `M0,${height} ${data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.score / max) * (height - 8) - 4
    return `L${x},${y}`
  }).join(' ')} L${width},${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

// ─── Architecture diagram ─────────────────────────────────────────────────────

const ARCH_LAYERS = [
  { label: 'Input', units: 20, color: '#3B82F6', note: '20 state features\n(danger, direction, food pos)' },
  { label: 'Dense 32', units: 32, color: '#22C55E', activation: 'ReLU', note: 'Pattern detection\n& feature extraction' },
  { label: 'Dense 32', units: 32, color: '#22C55E', activation: 'ReLU', note: 'High-level strategy\n& policy refinement' },
  { label: 'Output', units: 4, color: '#F97316', note: 'Q-values for\nUp · Down · Left · Right' },
]

function ArchDiagram() {
  const [hoveredLayer, setHoveredLayer] = useState(null)

  return (
    <div className="flex flex-col gap-1">
      {ARCH_LAYERS.map((layer, i) => (
        <div key={i}>
          <motion.div
            onMouseEnter={() => setHoveredLayer(i)}
            onMouseLeave={() => setHoveredLayer(null)}
            className="flex items-center gap-3 cursor-default"
            whileHover={{ x: 2 }}
          >
            {/* Layer bar */}
            <div className="text-[10px] font-mono w-14 text-right shrink-0" style={{ color: '#3A3A50' }}>
              {layer.label}
            </div>
            <div className="relative flex-1 flex gap-px items-center" style={{ height: 22 }}>
              {Array.from({ length: Math.min(layer.units, 16) }).map((_, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-sm transition-all duration-200"
                  style={{
                    height: hoveredLayer === i ? 18 : 14,
                    background: hoveredLayer === i ? layer.color : layer.color + '55',
                    boxShadow: hoveredLayer === i ? `0 0 6px ${layer.color}60` : 'none',
                    transitionDelay: `${j * 8}ms`,
                  }}
                />
              ))}
              {layer.units > 16 && (
                <div className="text-[9px] ml-1 shrink-0" style={{ color: '#3A3A50' }}>
                  +{layer.units - 16}
                </div>
              )}
            </div>
            <div className="text-[10px] font-mono w-8 shrink-0" style={{ color: '#3A3A50' }}>
              {layer.units}
            </div>
            {layer.activation && (
              <div
                className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0"
                style={{ background: layer.color + '15', color: layer.color, border: `1px solid ${layer.color}30` }}
              >
                {layer.activation}
              </div>
            )}
          </motion.div>
          {/* Annotation on hover */}
          <AnimatePresence>
            {hoveredLayer === i && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-17 pl-[74px] overflow-hidden"
              >
                <p className="text-[10px] leading-relaxed py-1 whitespace-pre-line" style={{ color: '#686880' }}>
                  {layer.note}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Connector arrow */}
          {i < ARCH_LAYERS.length - 1 && (
            <div className="flex items-center justify-center" style={{ height: 12 }}>
              <div className="w-px" style={{ height: 10, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Hyperparams table ────────────────────────────────────────────────────────

const HYPERPARAMS = [
  { key: 'Algorithm', val: 'DQN + Replay Buffer' },
  { key: 'Learning Rate', val: '0.001' },
  { key: 'Batch Size', val: '32' },
  { key: 'Replay Buffer', val: '10,000 experiences' },
  { key: 'Gamma (γ)', val: '0.99 — long-term thinking' },
  { key: 'ε-start → ε-min', val: '1.0 → 0.01 (explore→exploit)' },
  { key: 'ε-decay', val: '0.995/episode' },
  { key: 'Target update', val: 'Every 100 steps' },
  { key: 'Episodes trained', val: '300' },
]

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ['Architecture', 'Training', 'Hyperparams']

export default function LiveDemoSection({ onEnterApp }) {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)
  const animRef = useRef(null)
  const [gameState, setGameState] = useState({ score: 0, episode: 1, steps: 0, alive: true })
  const [tab, setTab] = useState('Architecture')
  const [speed, setSpeed] = useState(80) // ms per step
  const totalEpisodesRef = useRef(1)

  // Init engine
  useEffect(() => {
    engineRef.current = new SnakeEngine()
  }, [])

  // Game loop
  useEffect(() => {
    let last = 0
    let running = true

    const loop = (ts) => {
      if (!running) return
      animRef.current = requestAnimationFrame(loop)
      if (ts - last < speed) return
      last = ts

      const engine = engineRef.current
      if (!engine) return

      const action = heuristicAction(engine)
      const { done } = engine.step(action)

      // Render
      if (canvasRef.current) {
        renderSnake(canvasRef.current, engine)
      }

      setGameState({
        score: engine.score,
        episode: totalEpisodesRef.current,
        steps: engine.steps,
        alive: !done,
      })

      if (done) {
        totalEpisodesRef.current++
        setTimeout(() => {
          if (running && engineRef.current) {
            engineRef.current.reset()
          }
        }, 600)
      }
    }

    animRef.current = requestAnimationFrame(loop)
    return () => {
      running = false
      cancelAnimationFrame(animRef.current)
    }
  }, [speed])

  return (
    <section className="py-24 px-6" style={{ background: 'rgba(255,255,255,0.012)' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-4"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            LIVE — AI playing right now
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">
            See it in action
          </h2>
          <p className="text-[#8A8AA3] text-lg max-w-xl mx-auto">
            SnakeBot v1 — trained for 300 episodes with DQN. You can build and train this yourself in under 5 minutes.
          </p>
        </motion.div>

        {/* Main demo grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: game + stats ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {/* Game canvas card */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ background: BG, border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Title bar */}
              <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🐍</span>
                  <span className="text-[13px] font-semibold text-white">SnakeBot v1</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: 'rgba(234,179,8,0.12)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.25)' }}>
                    Bronze tier
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="text-[11px] font-mono" style={{ color: '#22C55E' }}>LIVE</span>
                </div>
              </div>

              {/* Canvas */}
              <div className="flex items-center justify-center p-4">
                <canvas
                  ref={canvasRef}
                  width={W}
                  height={W}
                  className="rounded-lg"
                  style={{ imageRendering: 'pixelated', maxWidth: '100%' }}
                />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-0" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { label: 'Score', val: gameState.score },
                  { label: 'Episode', val: gameState.episode },
                  { label: 'Steps', val: gameState.steps },
                ].map((s, i) => (
                  <div key={i} className="text-center py-2.5" style={{
                    borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                  }}>
                    <div className="text-lg font-black font-mono" style={{ color: '#22C55E' }}>{s.val}</div>
                    <div className="text-[10px] font-mono" style={{ color: '#3A3A50' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speed control */}
            <div className="px-4 py-3 rounded-xl flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[11px] font-mono shrink-0" style={{ color: '#505068' }}>Speed</span>
              <input
                type="range" min="30" max="200" value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="flex-1 accent-[#22C55E] h-1"
                style={{ accentColor: '#22C55E' }}
              />
              <span className="text-[11px] font-mono shrink-0 w-16 text-right" style={{ color: '#686880' }}>
                {speed < 60 ? 'Fast' : speed < 130 ? 'Normal' : 'Slow'}
              </span>
            </div>

            {/* "Train this yourself" CTA */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(34,197,94,0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onEnterApp}
              className="w-full py-3 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 0 20px rgba(34,197,94,0.15)' }}
            >
              Train this yourself →
            </motion.button>
          </motion.div>

          {/* ── Right: info panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 flex flex-col"
          >
            <div className="rounded-2xl flex-1 overflow-hidden flex flex-col"
              style={{ background: '#0A0A12', border: '1px solid rgba(255,255,255,0.07)' }}>

              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {TABS.map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="flex-1 px-3 py-3 text-xs font-semibold transition-all relative"
                    style={{ color: tab === t ? '#F0F0F6' : '#505068' }}
                  >
                    {t}
                    {tab === t && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ background: '#22C55E' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 p-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                <AnimatePresence mode="wait">
                  {tab === 'Architecture' && (
                    <motion.div
                      key="arch"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <p className="text-[11px] font-mono mb-4" style={{ color: '#505068' }}>
                        Hover over each layer to learn what it does
                      </p>
                      <ArchDiagram />

                      {/* Model stats */}
                      <div className="mt-6 grid grid-cols-3 gap-2">
                        {[
                          { label: 'Parameters', val: '1,220' },
                          { label: 'Layers', val: '3' },
                          { label: 'Input size', val: '20' },
                        ].map((s, i) => (
                          <div key={i} className="text-center py-2.5 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="text-sm font-black font-mono text-white">{s.val}</div>
                            <div className="text-[10px] mt-0.5" style={{ color: '#3A3A50' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* How it works callout */}
                      <div className="mt-4 p-3 rounded-xl"
                        style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#686880' }}>
                          <span className="text-[#22C55E] font-semibold">How decisions are made:</span>{' '}
                          The network takes 20 numbers describing the game state (danger zones, food location, snake direction)
                          and outputs 4 Q-values — one per action. The agent picks the highest-value action.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {tab === 'Training' && (
                    <motion.div
                      key="train"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-white">Reward curve</p>
                        <span className="text-[10px] font-mono" style={{ color: '#505068' }}>300 episodes</span>
                      </div>

                      {/* Chart */}
                      <div className="rounded-xl p-3 mb-4"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <Sparkline data={TRAINING_CURVE} color="#22C55E" width={320} height={90} />
                        <div className="flex justify-between mt-2">
                          <span className="text-[9px] font-mono" style={{ color: '#3A3A50' }}>Ep 0</span>
                          <span className="text-[9px] font-mono" style={{ color: '#3A3A50' }}>Ep 300</span>
                        </div>
                      </div>

                      {/* Learning milestones */}
                      <p className="text-[11px] font-semibold text-white mb-2">Learning milestones</p>
                      <div className="space-y-2">
                        {[
                          { ep: 'Ep 1–30', event: 'Random exploration — ε near 1.0, mostly dies at walls', color: '#EF4444' },
                          { ep: 'Ep 31–80', event: 'Starts recognising food direction, avoids obvious walls', color: '#F97316' },
                          { ep: 'Ep 81–150', event: 'Learns not to reverse into itself, scores 2–5 consistently', color: '#EAB308' },
                          { ep: 'Ep 151–250', event: 'Body avoidance improves, pathfinding emerges, scores 8–12', color: '#3B82F6' },
                          { ep: 'Ep 251–300', event: 'ε decayed to ~0.2, greedy policy scores 12–18 regularly', color: '#22C55E' },
                        ].map((m, i) => (
                          <div key={i} className="flex gap-2.5 items-start">
                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: m.color }} />
                            <div>
                              <span className="text-[10px] font-mono font-semibold" style={{ color: m.color }}>{m.ep} </span>
                              <span className="text-[10px]" style={{ color: '#686880' }}>{m.event}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* DQN explanation */}
                      <div className="mt-4 p-3 rounded-xl"
                        style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#686880' }}>
                          <span className="text-[#3B82F6] font-semibold">Why DQN?</span>{' '}
                          Deep Q-Network uses a replay buffer to break correlation between consecutive experiences,
                          and a target network for stable Q-value targets. This turns a chaotic RL problem into
                          something closer to supervised learning.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {tab === 'Hyperparams' && (
                    <motion.div
                      key="hp"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <p className="text-[11px] mb-3 font-mono" style={{ color: '#505068' }}>
                        Exact settings used to train SnakeBot v1 — copy these in the portal
                      </p>
                      <div className="space-y-1.5">
                        {HYPERPARAMS.map(({ key, val }) => (
                          <div key={key} className="flex items-start justify-between gap-3 py-2 px-3 rounded-lg"
                            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <span className="text-[11px] font-mono" style={{ color: '#505068' }}>{key}</span>
                            <span className="text-[11px] font-mono text-right" style={{ color: '#F0F0F6' }}>{val}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 p-3 rounded-xl"
                        style={{ background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)' }}>
                        <p className="text-[11px] leading-relaxed" style={{ color: '#686880' }}>
                          <span className="text-[#A855F7] font-semibold">Tip:</span>{' '}
                          All these hyperparameters are tunable in the portal's Training panel.
                          Try increasing hidden units to 64 or adding a third layer to see if you can beat this model.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer CTA */}
              <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <button
                  onClick={onEnterApp}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all text-white"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                >
                  Open the portal and build your own →
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
