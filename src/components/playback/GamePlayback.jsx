import { useState, useRef, useEffect, useCallback } from 'react'
import { motion as M } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useModelStore from '../../stores/useModelStore'
import SnakeEngine from '../../games/snake/SnakeEngine'
import SnakeRenderer from '../../games/snake/SnakeRenderer'
import FlappyEngine from '../../games/flappy/FlappyEngine'
import FlappyRenderer from '../../games/flappy/FlappyRenderer'
import CartPoleEngine from '../../games/cartpole/CartPoleEngine'
import CartPoleRenderer from '../../games/cartpole/CartPoleRenderer'
import TwentyFortyEightEngine from '../../games/twentyfortyeight/TwentyFortyEightEngine'
import TwentyFortyEightRenderer from '../../games/twentyfortyeight/TwentyFortyEightRenderer'
import ChessEngine from '../../games/chess/ChessEngine'
import ChessRenderer from '../../games/chess/ChessRenderer'
import DQNAgent from '../../ml/DQNAgent'
import { loadModel } from '../../ml/modelSerializer'
import { boardToVector } from '../../utils/chessBoardVector'
import DecisionOverlay from './DecisionOverlay'
import PretrainedModelSelector from '../welcome/PretrainedModelSelector'
import { PRETRAINED_MODELS, hasPretrainedModel, loadPretrainedModel } from '../../ml/pretrainedModels'
import HumanVsModel from './HumanVsModel'

function createEngine(gameId) {
  switch (gameId) {
    case 'snake': return new SnakeEngine()
    case 'flappy': return new FlappyEngine()
    case 'cartpole': return new CartPoleEngine()
    case 'twentyfortyeight': return new TwentyFortyEightEngine()
    case 'chess': return new ChessEngine()
    default: return new SnakeEngine()
  }
}

function GameRendererSwitch({ gameId, gameState, qValues }) {
  if (!gameState) return null
  switch (gameId) {
    case 'snake': return <SnakeRenderer gameState={gameState} width={400} height={400} qValues={qValues} />
    case 'flappy': return <FlappyRenderer gameState={gameState} width={350} height={500} />
    case 'cartpole': return <CartPoleRenderer gameState={gameState} width={500} height={300} />
    case 'twentyfortyeight': return <TwentyFortyEightRenderer gameState={gameState} width={400} height={400} />
    case 'chess': return <ChessRenderer gameState={gameState} width={400} height={400} />
    default: return null
  }
}

export default function GamePlayback() {
  const { activeGameId } = useGameStore()
  const game = GAMES[activeGameId]
  const layers = useModelStore((s) => s.layers)
  const [gameState, setGameState] = useState(null)
  const [qValues, setQValues] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [speed, setSpeed] = useState(200)
  const [score, setScore] = useState(0)
  const [mode, setMode] = useState('ai')
  const [showVsMode, setShowVsMode] = useState(false)
  const [pretrainedReady, setPretrainedReady] = useState(false)
  const [activeModelName, setActiveModelName] = useState(null)
  const engineRef = useRef(null)
  const agentRef = useRef(null)
  const modelRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      const config = PRETRAINED_MODELS[activeGameId]
      if (!config) { setPretrainedReady(false); return }
      hasPretrainedModel(config.id).then((ready) => {
        if (!cancelled) setPretrainedReady(ready)
      })
    })
    return () => { cancelled = true }
  }, [activeGameId])

  const startWithModel = useCallback((model, name) => {
    const engine = createEngine(activeGameId)
    engineRef.current = engine
    modelRef.current = model
    let state = engine.reset()
    setGameState(engine.getState())
    setIsRunning(true)
    setScore(0)
    setMode('ai')
    setActiveModelName(name)

    intervalRef.current = setInterval(() => {
      if (engine.isDone()) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        return
      }
      const qVals = tf.tidy(() => {
        const stateTensor = tf.tensor2d([state])
        const prediction = model.predict(stateTensor)
        return Array.from(prediction.dataSync())
      })
      const action = qVals.indexOf(Math.max(...qVals))
      const result = engine.step(action)
      state = result.state
      setGameState(engine.getState())
      setQValues(qVals)
      setScore(engine.getScore())
    }, speed)
  }, [activeGameId, speed])

  const handlePretrainedReady = useCallback(async (model, config) => {
    startWithModel(model, config.name)
  }, [startWithModel])

  const loadAndPlayPretrained = useCallback(async () => {
    const config = PRETRAINED_MODELS[activeGameId]
    if (!config) return
    const model = await loadPretrainedModel(config.id)
    if (model) startWithModel(model, config.name)
  }, [activeGameId, startWithModel])

  const startAI = useCallback(() => {
    const hasSaved = !!useModelStore.getState().savedWeightsKey
    if (layers.length === 0 && !hasSaved) {
      return alert('Build and train a model first! Or use a pre-trained model below.')
    }

    const engine = createEngine(activeGameId)

    void (async () => {
      if (game.trainingMode === 'supervised') {
        engineRef.current = engine
        engine.reset()
        setGameState(engine.getState())
        setIsRunning(true)
        setScore(0)
        setMode('ai')

        let nnModel = null
        const key = useModelStore.getState().savedWeightsKey
        if (key) {
          try {
            nnModel = await loadModel(key)
            modelRef.current = nnModel
            setActiveModelName('Trained evaluation network')
          } catch { nnModel = null }
        }

        const nnEval = nnModel
          ? (board) => tf.tidy(() => nnModel.predict(tf.tensor2d([boardToVector(board)])).dataSync()[0])
          : null

        if (!nnEval) { modelRef.current = null; setActiveModelName('Minimax (material eval)') }

        intervalRef.current = setInterval(() => {
          if (engine.isDone()) { clearInterval(intervalRef.current); setIsRunning(false); return }
          if (nnEval) engine.step(0, (b) => nnEval(b))
          else engine.step(0)
          setGameState(engine.getState())
          setScore(engine.getScore())
        }, Math.max(speed, 300))
        return
      }

      let agent
      const key = useModelStore.getState().savedWeightsKey
      if (key) {
        try {
          const loaded = await loadModel(key)
          modelRef.current = loaded
          engineRef.current = engine
          let state = engine.reset()
          setGameState(engine.getState())
          setIsRunning(true)
          setScore(0)
          setMode('ai')
          setActiveModelName('Saved weights')

          intervalRef.current = setInterval(() => {
            if (engine.isDone()) { clearInterval(intervalRef.current); setIsRunning(false); return }
            const qVals = tf.tidy(() => {
              const t = tf.tensor2d([state])
              return Array.from(loaded.predict(t).dataSync())
            })
            const action = qVals.indexOf(Math.max(...qVals))
            const result = engine.step(action)
            state = result.state
            setGameState(engine.getState())
            setQValues(qVals)
            setScore(engine.getScore())
          }, speed)
          return
        } catch { modelRef.current = null }
      }

      try { agent = new DQNAgent(layers, activeGameId, game.outputSize) }
      catch (e) { alert('Model build error: ' + e.message); return }

      engineRef.current = engine
      agentRef.current = agent
      let state = engine.reset()
      setGameState(engine.getState())
      setIsRunning(true)
      setScore(0)
      setMode('ai')
      setActiveModelName('Your Model (untrained)')

      intervalRef.current = setInterval(() => {
        if (engine.isDone()) { clearInterval(intervalRef.current); setIsRunning(false); return }
        const action = agent.selectAction(state, true)
        const result = engine.step(action)
        state = result.state
        setGameState(engine.getState())
        setQValues(agent.getQValues(state))
        setScore(engine.getScore())
      }, speed)
    })()
  }, [layers, activeGameId, game, speed])

  const startHuman = useCallback(() => {
    const engine = createEngine(activeGameId)
    engineRef.current = engine
    engine.reset()
    setGameState(engine.getState())
    setIsRunning(true)
    setScore(0)
    setMode('human')
    setActiveModelName(null)
  }, [activeGameId])

  useEffect(() => {
    if (mode !== 'human' || !isRunning) return
    const handleKey = (e) => {
      const keyMap = {
        snake: { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3 },
        flappy: { ' ': 1, ArrowUp: 1 },
        cartpole: { ArrowLeft: 0, ArrowRight: 1 },
        twentyfortyeight: { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3 },
      }
      const action = keyMap[activeGameId]?.[e.key]
      if (action !== undefined && action !== null) {
        e.preventDefault()
        const engine = engineRef.current
        if (engine && !engine.isDone()) {
          engine.step(action)
          setGameState(engine.getState())
          setScore(engine.getScore())
          if (engine.isDone()) setIsRunning(false)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mode, isRunning, activeGameId])

  const stop = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    agentRef.current?.dispose()
    agentRef.current = null
    modelRef.current?.dispose?.()
    modelRef.current = null
  }

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    agentRef.current?.dispose()
    modelRef.current?.dispose?.()
  }, [])

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isRunning && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              <span className="font-label text-xs uppercase tracking-widest text-primary/80">
                {isRunning ? `Live ${mode === 'human' ? 'Play' : 'Replay'}` : 'Watch Mode'}
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary uppercase">{game.name}</h1>
          </div>
          <div className="flex gap-3">
            {activeModelName && isRunning && (
              <span className="font-mono text-[10px] text-text-muted px-3 py-2 rounded-lg bg-bg-elevated border border-border uppercase tracking-widest">
                {activeModelName}
              </span>
            )}
            <span className="font-mono text-xl font-bold text-text-primary tabular-nums px-4 py-2 bg-bg-elevated border border-border rounded-lg">
              {score}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Theater */}
          <div className="col-span-12 lg:col-span-9 space-y-4">
            {/* Viewport */}
            <div className="relative bg-bg-primary rounded-xl border border-border overflow-hidden min-h-[420px] flex items-center justify-center">
              <div className="absolute inset-0 opacity-10 pointer-events-none grid-bg" />

              {gameState ? (
                <div className="relative z-10">
                  <GameRendererSwitch gameId={activeGameId} gameState={gameState} qValues={mode === 'ai' ? qValues : null} />
                </div>
              ) : (
                <div className="text-center space-y-4 p-8">
                  <span className="material-symbols-outlined text-text-ghost text-6xl block">play_circle</span>
                  <p className="text-text-muted text-sm font-label uppercase tracking-widest">Select an action to begin</p>
                  {!pretrainedReady && activeGameId !== 'chess' && (
                    <div className="max-w-sm mx-auto mt-6">
                      <p className="text-xs uppercase tracking-widest text-text-muted text-center mb-3 font-label">
                        Or generate a pre-trained model
                      </p>
                      <PretrainedModelSelector onModelReady={handlePretrainedReady} />
                    </div>
                  )}
                </div>
              )}

              {/* HUD Overlay */}
              {isRunning && (
                <>
                  <div className="absolute top-4 left-4 hud-overlay px-4 py-2 rounded-lg pointer-events-none">
                    <span className="font-label text-[9px] text-primary uppercase tracking-widest font-black">Score</span>
                    <span className="font-mono text-lg font-bold text-text-primary ml-3">{score}</span>
                  </div>
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-bg-primary/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/20">
                    <span className="h-2 w-2 rounded-full bg-primary status-pulse" />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                      {mode === 'human' ? 'Human Control' : 'AI Active'}
                    </span>
                  </div>
                </>
              )}

              {/* Game Over */}
              {gameState && !isRunning && gameState.done && (
                <div className="absolute inset-0 bg-bg-primary/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-black uppercase tracking-tight">Game Over</h3>
                    <p className="font-mono text-text-secondary">Final Score: {score}</p>
                    <button
                      onClick={mode === 'human' ? startHuman : (pretrainedReady ? loadAndPlayPretrained : startAI)}
                      className="px-6 py-3 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg"
                    >
                      Play Again
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="bg-bg-card p-4 rounded-xl border border-border flex items-center justify-between">
              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isRunning ? (
                  <>
                    {pretrainedReady && (
                      <button onClick={loadAndPlayPretrained}
                        className="px-5 py-2.5 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:brightness-110 transition-all">
                        Watch Pre-Trained
                      </button>
                    )}
                    <button onClick={() => { setMode('ai'); startAI() }}
                      className="px-5 py-2.5 border border-border text-text-secondary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-bg-hover transition-all">
                      Your Model
                    </button>
                    <button onClick={startHuman}
                      className="px-5 py-2.5 border border-border text-text-secondary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-bg-hover transition-all">
                      Play Yourself
                    </button>
                    {activeGameId !== 'cartpole' && (
                      <button onClick={() => setShowVsMode(!showVsMode)}
                        className={`px-5 py-2.5 border font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg transition-all ${
                          showVsMode
                            ? 'border-warning/30 text-warning bg-warning/5'
                            : 'border-border text-text-secondary hover:bg-bg-hover'
                        }`}>
                        Human vs AI
                      </button>
                    )}
                  </>
                ) : (
                  <button onClick={stop}
                    className="px-5 py-2.5 border border-error/30 text-error font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-error/5 transition-all">
                    Stop
                  </button>
                )}
              </div>

              {/* Speed Control */}
              <div className="flex items-center gap-1 bg-bg-primary p-1 rounded-lg">
                {[
                  { ms: 500, label: '0.5X' },
                  { ms: 200, label: '1X' },
                  { ms: 100, label: '2X' },
                  { ms: 30, label: '4X' },
                ].map(({ ms, label }) => (
                  <button
                    key={ms}
                    onClick={() => setSpeed(ms)}
                    className={`px-3 py-1.5 text-[10px] font-label font-bold transition-colors rounded ${
                      speed === ms ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Human mode hint */}
            {mode === 'human' && isRunning && (
              <p className="text-xs text-text-muted text-center font-label uppercase tracking-widest">
                Use arrow keys to control{activeGameId === 'flappy' ? ' (Space to flap)' : ''}
              </p>
            )}
          </div>

          {/* Right Panel */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Architecture / Q-values */}
            <div className="glass-panel rounded-xl p-5">
              {mode === 'ai' && qValues ? (
                <DecisionOverlay qValues={qValues} />
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="font-label text-[10px] uppercase tracking-widest text-primary mb-3 font-black">Architecture</p>
                    <div className="space-y-2">
                      {layers.length > 0 ? layers.map((l, i) => (
                        <div key={l.id} className="flex justify-between items-center py-1.5 border-b border-border/30 text-[11px]">
                          <span className="font-label text-text-muted uppercase tracking-wider">{l.type}</span>
                          <span className="font-mono text-text-primary">{l.units || l.filters || l.rate || '-'}</span>
                        </div>
                      )) : (
                        <p className="text-[11px] text-text-ghost">No layers configured</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pre-trained Models */}
            <div className="glass-panel rounded-xl p-5">
              <p className="font-label text-[10px] uppercase tracking-widest text-text-muted mb-3 font-black">Pre-Trained Models</p>
              <PretrainedModelSelector onModelReady={handlePretrainedReady} compact />
            </div>

            {/* Controls Info */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                <h4 className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-primary">Game Info</h4>
              </div>
              <div className="space-y-2 text-[11px] text-text-secondary">
                {typeof game.tiers.gold === 'number' ? (
                  Object.entries(game.tiers).map(([tier, target]) => (
                    <div key={tier} className="flex justify-between">
                      <span className="capitalize">{tier}</span>
                      <span className="font-mono font-bold text-text-primary">{target}</span>
                    </div>
                  ))
                ) : (
                  <p>Beat built-in opponents</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VS Mode */}
        {showVsMode && !isRunning && (
          <section className="mt-6">
            <HumanVsModel />
          </section>
        )}
      </div>
    </div>
  )
}
