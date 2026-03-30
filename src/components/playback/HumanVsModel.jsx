import { useState, useRef, useEffect } from 'react'
import { motion as M } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useModelStore from '../../stores/useModelStore'
import SnakeEngine from '../../games/snake/SnakeEngine'
import SnakeRenderer from '../../games/snake/SnakeRenderer'
import FlappyEngine from '../../games/flappy/FlappyEngine'
import FlappyRenderer from '../../games/flappy/FlappyRenderer'
import TwentyFortyEightEngine from '../../games/twentyfortyeight/TwentyFortyEightEngine'
import TwentyFortyEightRenderer from '../../games/twentyfortyeight/TwentyFortyEightRenderer'
import ChessEngine from '../../games/chess/ChessEngine'
import ChessRenderer from '../../games/chess/ChessRenderer'
import DQNAgent from '../../ml/DQNAgent'
import { buildModel } from '../../ml/ModelBuilder'
import { loadModel } from '../../ml/modelSerializer'
import { boardToVector } from '../../utils/chessBoardVector'
import { PRETRAINED_MODELS, loadPretrainedModel, hasPretrainedModel } from '../../ml/pretrainedModels'

function isWhitePiece(p) {
  return p >= 1 && p <= 6
}

function ChessHumanVsModel() {
  const layers = useModelStore((s) => s.layers)
  const [gameState, setGameState] = useState(null)
  const [selected, setSelected] = useState(null)
  const [legalTargets, setLegalTargets] = useState([])
  const [running, setRunning] = useState(false)
  const engineRef = useRef(null)
  const modelRef = useRef(null)

  const start = async () => {
    modelRef.current?.dispose?.()
    modelRef.current = null
    const engine = new ChessEngine()
    engine.reset()
    engineRef.current = engine
    setGameState(engine.getState())
    setSelected(null)
    setLegalTargets([])

    let model = null
    const key = useModelStore.getState().savedWeightsKey
    if (key) {
      try {
        model = await loadModel(key)
      } catch {
        model = null
      }
    }

    if (!model && layers.length > 0) {
      try {
        const m = buildModel(layers, 'chess', 1)
        m.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
        model = m
      } catch {
        model = null
      }
    }

    modelRef.current = model
    setRunning(true)
  }

  const runAiMove = () => {
    const e = engineRef.current
    if (!e || e.isDone() || e.whiteToMove) return
    const m = modelRef.current
    const evalFn = m
      ? (board) => tf.tidy(() => m.predict(tf.tensor2d([boardToVector(board)])).dataSync()[0])
      : (board) => e.materialEval(board)
    e.step(0, evalFn)
    setGameState(e.getState())
    setSelected(null)
    setLegalTargets([])
  }

  const onSquareClick = (r, c) => {
    const e = engineRef.current
    if (!running || !e || e.isDone() || !e.whiteToMove) return
    const board = e.getState().board
    const piece = board[r][c]

    if (selected) {
      const ok = e.applyMoveBySquares(selected[0], selected[1], r, c)
      if (ok) {
        setGameState(e.getState())
        setSelected(null)
        setLegalTargets([])
        if (!e.isDone() && !e.whiteToMove) requestAnimationFrame(() => runAiMove())
      } else if (piece && isWhitePiece(piece)) {
        setSelected([r, c])
        setLegalTargets(
          e.getLegalMoves()
            .filter((m) => m.from[0] === r && m.from[1] === c)
            .map((m) => [m.to[0], m.to[1]]),
        )
      } else {
        setSelected(null)
        setLegalTargets([])
      }
    } else if (piece && isWhitePiece(piece)) {
      setSelected([r, c])
      setLegalTargets(
        e.getLegalMoves()
          .filter((m) => m.from[0] === r && m.from[1] === c)
          .map((m) => [m.to[0], m.to[1]]),
      )
    }
  }

  const stop = () => {
    modelRef.current?.dispose?.()
    modelRef.current = null
    engineRef.current = null
    setRunning(false)
    setGameState(null)
    setSelected(null)
    setLegalTargets([])
  }

  return (
    <div className="p-6 space-y-5 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h3 className="font-label text-[11px] uppercase tracking-[0.2em] font-black text-text-primary">You (White) vs AI</h3>
        {!running ? (
          <M.button
            whileTap={{ scale: 0.97 }}
            onClick={start}
            className="px-5 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.2em] font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            New Game
          </M.button>
        ) : (
          <M.button
            whileTap={{ scale: 0.97 }}
            onClick={stop}
            className="px-5 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.2em] font-black bg-error/10 text-error border border-error/20 hover:bg-error/15 transition-colors"
          >
            Stop
          </M.button>
        )}
      </div>
      <p className="text-[11px] text-text-muted text-center font-label">
        Tap a white piece, then a highlighted square. AI uses your saved / trained eval when available.
      </p>
      {gameState && (
        <div className="flex justify-center">
          <ChessRenderer
            gameState={gameState}
            width={300}
            height={300}
            interactive={running && !gameState.done}
            selectedCell={selected}
            legalTargets={legalTargets}
            onSquareClick={onSquareClick}
          />
        </div>
      )}
    </div>
  )
}

function createEngine(gameId) {
  switch (gameId) {
    case 'snake': return new SnakeEngine()
    case 'flappy': return new FlappyEngine()
    case 'twentyfortyeight': return new TwentyFortyEightEngine()
    default: return null
  }
}

function Renderer({ gameId, gameState, width, height }) {
  if (!gameState) return null
  switch (gameId) {
    case 'snake': return <SnakeRenderer gameState={gameState} width={width} height={height} />
    case 'flappy': return <FlappyRenderer gameState={gameState} width={width} height={height} />
    case 'twentyfortyeight': return <TwentyFortyEightRenderer gameState={gameState} width={width} height={height} />
    default: return null
  }
}

export default function HumanVsModel() {
  const { activeGameId } = useGameStore()
  const game = GAMES[activeGameId]
  const layers = useModelStore((s) => s.layers)
  const [isRunning, setIsRunning] = useState(false)
  const [humanState, setHumanState] = useState(null)
  const [aiState, setAIState] = useState(null)
  const [humanScore, setHumanScore] = useState(0)
  const [aiScore, setAIScore] = useState(0)
  const [winner, setWinner] = useState(null)
  const humanEngineRef = useRef(null)
  const aiEngineRef = useRef(null)
  const aiModelRef = useRef(null)
  const intervalRef = useRef(null)

  const checkWinner = () => {
    const hDone = humanEngineRef.current?.isDone()
    const aDone = aiEngineRef.current?.isDone()
    if (hDone && aDone) {
      clearInterval(intervalRef.current)
      setIsRunning(false)
      const h = humanEngineRef.current.getScore()
      const a = aiEngineRef.current.getScore()
      setWinner(h > a ? 'human' : h < a ? 'ai' : 'tie')
    }
  }

  const start = async () => {
    const humanEngine = createEngine(activeGameId)
    const aiEngine = createEngine(activeGameId)
    if (!humanEngine || !aiEngine) return

    humanEngineRef.current = humanEngine
    aiEngineRef.current = aiEngine
    humanEngine.reset()
    aiEngine.reset()
    setHumanState(humanEngine.getState())
    setAIState(aiEngine.getState())
    setHumanScore(0)
    setAIScore(0)
    setWinner(null)
    setIsRunning(true)

    let model = null
    const config = PRETRAINED_MODELS[activeGameId]
    if (config) {
      const has = await hasPretrainedModel(config.id)
      if (has) model = await loadPretrainedModel(config.id)
    }
    if (!model && layers.length > 0) {
      try {
        const agent = new DQNAgent(layers, activeGameId, game.outputSize)
        model = agent.getModel()
      } catch { /* ignore */ }
    }
    aiModelRef.current = model

    let aiStateVec = aiEngine.getStateVector ? aiEngine.getStateVector() : aiEngine.reset()
    intervalRef.current = setInterval(() => {
      if (aiEngine.isDone()) return

      let action = Math.floor(Math.random() * game.outputSize)
      if (model) {
        const qVals = tf.tidy(() => {
          const s = tf.tensor2d([aiStateVec])
          return Array.from(model.predict(s).dataSync())
        })
        action = qVals.indexOf(Math.max(...qVals))
      }

      const result = aiEngine.step(action)
      aiStateVec = result.state
      setAIState(aiEngine.getState())
      setAIScore(aiEngine.getScore())
      checkWinner()
    }, 200)
  }

  useEffect(() => {
    if (!isRunning) return
    const handleKey = (e) => {
      const keyMap = {
        snake: { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3 },
        flappy: { ' ': 1, ArrowUp: 1 },
        twentyfortyeight: { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3 },
      }
      const action = keyMap[activeGameId]?.[e.key]
      if (action !== undefined) {
        e.preventDefault()
        const engine = humanEngineRef.current
        if (engine && !engine.isDone()) {
          engine.step(action)
          setHumanState(engine.getState())
          setHumanScore(engine.getScore())
          checkWinner()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isRunning, activeGameId])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  if (activeGameId === 'cartpole') {
    return (
      <div className="p-8 text-center">
        <span className="material-symbols-outlined text-text-ghost text-4xl mb-3 block">sports_esports</span>
        <p className="text-sm text-text-muted font-label">Human vs Model is available for Snake, Flappy Bird, 2048, and Chess</p>
      </div>
    )
  }

  if (activeGameId === 'chess') {
    return <ChessHumanVsModel />
  }

  const size = activeGameId === 'flappy' ? { w: 250, h: 350 } : { w: 280, h: 280 }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-tertiary" />
          <h3 className="font-label text-[11px] uppercase tracking-[0.2em] font-black text-text-primary">Competition Arena</h3>
        </div>
        {!isRunning ? (
          <M.button whileTap={{ scale: 0.97 }} onClick={start}
            className="px-6 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.2em] font-black bg-primary text-on-primary hover:brightness-110 transition-all neural-glow flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            Start Challenge
          </M.button>
        ) : (
          <M.button whileTap={{ scale: 0.97 }} onClick={() => { clearInterval(intervalRef.current); setIsRunning(false) }}
            className="px-6 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.2em] font-black bg-error/10 text-error border border-error/20 hover:bg-error/15 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">stop</span>
            Stop
          </M.button>
        )}
      </div>

      {/* VS Layout */}
      <div className="flex gap-6 justify-center items-start">
        {/* Human Side */}
        <div className="flex-1 max-w-[320px] space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              <span className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-text-primary">You</span>
            </div>
            <span className="font-mono text-2xl font-black text-primary tabular-nums">{humanScore}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-primary/20 bg-bg-card relative">
            {humanState ? (
              <Renderer gameId={activeGameId} gameState={humanState} width={size.w} height={size.h} />
            ) : (
              <div style={{ width: size.w, height: size.h }} className="bg-bg-card flex items-center justify-center">
                <p className="text-[11px] text-text-ghost font-label">Waiting...</p>
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center pt-16 gap-3">
          <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border flex items-center justify-center">
            <span className="font-black text-lg text-text-muted">VS</span>
          </div>
          <div className="w-px h-32 bg-gradient-to-b from-primary/30 via-border to-tertiary/30" />
        </div>

        {/* AI Side */}
        <div className="flex-1 max-w-[320px] space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <span className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-text-primary">AI</span>
            </div>
            <span className="font-mono text-2xl font-black text-tertiary tabular-nums">{aiScore}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-tertiary/20 bg-bg-card relative">
            {aiState ? (
              <Renderer gameId={activeGameId} gameState={aiState} width={size.w} height={size.h} />
            ) : (
              <div style={{ width: size.w, height: size.h }} className="bg-bg-card flex items-center justify-center">
                <p className="text-[11px] text-text-ghost font-label">Waiting...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Winner Announcement */}
      {winner && (
        <M.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 rounded-xl border border-border bg-bg-elevated">
          <p className="text-2xl font-black uppercase tracking-tight mb-2">
            {winner === 'human' && <span className="text-primary">You Win!</span>}
            {winner === 'ai' && <span className="text-tertiary">AI Wins!</span>}
            {winner === 'tie' && <span className="text-text-muted">It's a Tie!</span>}
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="font-mono text-sm text-text-secondary">You: <span className="text-primary font-bold">{humanScore}</span></span>
            <span className="w-px h-4 bg-border" />
            <span className="font-mono text-sm text-text-secondary">AI: <span className="text-tertiary font-bold">{aiScore}</span></span>
          </div>
        </M.div>
      )}

      {/* Controls hint */}
      {isRunning && (
        <div className="flex items-center justify-center gap-2 text-text-muted">
          <span className="material-symbols-outlined text-sm">keyboard</span>
          <p className="text-[11px] font-label">
            Use arrow keys to control{activeGameId === 'flappy' ? ' (Space to flap)' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
