import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
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

  // Check for pretrained model on game change
  useEffect(() => {
    const config = PRETRAINED_MODELS[activeGameId]
    if (!config) { setPretrainedReady(false); return }
    hasPretrainedModel(config.id).then(setPretrainedReady)
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
      // Use model directly for inference
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

  const handlePretrainedReady = useCallback(async (model, config, agent) => {
    startWithModel(model, config.name)
  }, [startWithModel])

  const loadAndPlayPretrained = useCallback(async () => {
    const config = PRETRAINED_MODELS[activeGameId]
    if (!config) return
    const model = await loadPretrainedModel(config.id)
    if (model) {
      startWithModel(model, config.name)
    }
  }, [activeGameId, startWithModel])

  const startAI = useCallback(() => {
    if (layers.length === 0) return alert('Build and train a model first! Or use a pre-trained model below.')

    const engine = createEngine(activeGameId)

    // Chess uses minimax with material eval (no DQN)
    if (game.trainingMode === 'supervised') {
      engineRef.current = engine
      engine.reset()
      setGameState(engine.getState())
      setIsRunning(true)
      setScore(0)
      setMode('ai')
      setActiveModelName('Minimax (Material Eval)')

      intervalRef.current = setInterval(() => {
        if (engine.isDone()) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          return
        }
        engine.step(0) // Uses default material eval
        setGameState(engine.getState())
        setScore(engine.getScore())
      }, Math.max(speed, 300)) // Chess is slower, min 300ms
      return
    }

    let agent
    try {
      agent = new DQNAgent(layers, activeGameId, game.outputSize)
    } catch (e) { return alert('Model build error: ' + e.message) }

    engineRef.current = engine
    agentRef.current = agent
    let state = engine.reset()
    setGameState(engine.getState())
    setIsRunning(true)
    setScore(0)
    setMode('ai')
    setActiveModelName('Your Model (untrained)')

    intervalRef.current = setInterval(() => {
      if (engine.isDone()) {
        clearInterval(intervalRef.current)
        setIsRunning(false)
        return
      }
      const action = agent.selectAction(state, true)
      const result = engine.step(action)
      state = result.state
      setGameState(engine.getState())
      setQValues(agent.getQValues(state))
      setScore(engine.getScore())
    }, speed)
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
  }

  useEffect(() => () => { clearInterval(intervalRef.current); agentRef.current?.dispose() }, [])

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
        <div className="flex items-center gap-4 mb-6 w-full max-w-xl">
          <h2 className="text-xl font-semibold flex-1">Play: {game.name}</h2>
          {activeModelName && isRunning && (
            <span className="text-xs font-mono text-text-muted px-3 py-1 rounded-lg bg-bg-card border border-border">
              {activeModelName}
            </span>
          )}
          <span className="text-base font-mono font-semibold text-text-secondary">Score: {score}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {!isRunning ? (
            <>
              {pretrainedReady && (
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={loadAndPlayPretrained}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white text-[#050508] hover:bg-white/90 transition-colors">
                  Watch Pre-Trained Demo
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={() => { setMode('ai'); startAI() }}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Watch Your Model
              </motion.button>
              <motion.button whileTap={{ scale: 0.98 }}
                onClick={startHuman}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Play Yourself
              </motion.button>
              {activeGameId !== 'cartpole' && activeGameId !== 'chess' && (
                <motion.button whileTap={{ scale: 0.98 }}
                  onClick={() => setShowVsMode(!showVsMode)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: showVsMode ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.04)',
                    color: showVsMode ? '#EAB308' : '#8A8AA3',
                    border: `1px solid ${showVsMode ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                  Human vs AI
                </motion.button>
              )}
            </>
          ) : (
            <motion.button whileTap={{ scale: 0.98 }} onClick={stop}
              className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
              Stop
            </motion.button>
          )}
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs text-text-muted font-medium">Speed:</span>
          {[500, 200, 100, 30].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${speed === s ? 'bg-bg-hover text-text-primary border border-border-light' : 'text-text-muted hover:text-text-secondary'}`}>
              {s === 500 ? '0.5x' : s === 200 ? '1x' : s === 100 ? '2x' : 'Max'}
            </button>
          ))}
        </div>

        {/* Game renderer */}
        {gameState ? (
          <GameRendererSwitch gameId={activeGameId} gameState={gameState} qValues={mode === 'ai' ? qValues : null} />
        ) : (
          <div className="w-[400px] max-w-full aspect-square rounded-xl border border-border bg-bg-card flex flex-col items-center justify-center gap-5 p-8">
            <p className="text-text-muted text-sm text-center">Choose an option above to start playing</p>
            {!pretrainedReady && activeGameId !== 'chess' && (
              <div className="w-full max-w-sm">
                <p className="text-xs uppercase tracking-widest text-text-muted text-center mb-3">
                  Or generate a pre-trained model
                </p>
                <PretrainedModelSelector onModelReady={handlePretrainedReady} />
              </div>
            )}
          </div>
        )}

        {showVsMode && !isRunning && <HumanVsModel />}

        {mode === 'human' && isRunning && (
          <p className="mt-4 text-xs text-text-muted">Use arrow keys to control{activeGameId === 'flappy' ? ' (Space to flap)' : ''}</p>
        )}

        {/* Game over restart */}
        {gameState && !isRunning && gameState.done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 flex gap-3"
          >
            <button
              onClick={mode === 'human' ? startHuman : (pretrainedReady ? loadAndPlayPretrained : startAI)}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-bg-card border border-border text-text-primary hover:border-border-light transition-colors"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </div>

      {/* Right panel: Q-values or pretrained info */}
      <div className="w-72 border-l border-border bg-bg-secondary p-4 shrink-0 overflow-y-auto">
        {mode === 'ai' && qValues ? (
          <DecisionOverlay qValues={qValues} />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3 font-medium">Pre-Trained Models</p>
              <PretrainedModelSelector
                onModelReady={handlePretrainedReady}
              />
            </div>

            <div className="rounded-xl p-3.5 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2.5 font-medium">Controls</p>
              <div className="space-y-1.5 text-[13px] text-text-secondary">
                {activeGameId === 'snake' && (
                  <p><span className="font-mono text-text-primary">↑↓←→</span> Move snake</p>
                )}
                {activeGameId === 'flappy' && (
                  <p><span className="font-mono text-text-primary">Space</span> Flap</p>
                )}
                {activeGameId === 'cartpole' && (
                  <p><span className="font-mono text-text-primary">←→</span> Push cart</p>
                )}
                {activeGameId === 'twentyfortyeight' && (
                  <p><span className="font-mono text-text-primary">↑↓←→</span> Slide tiles</p>
                )}
              </div>
            </div>

            <div className="rounded-xl p-3.5 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2.5 font-medium">Tiers</p>
              {typeof game.tiers.gold === 'number' ? (
                <div className="space-y-2">
                  {Object.entries(game.tiers).map(([tier, target]) => (
                    <div key={tier} className="flex items-center justify-between text-[13px]">
                      <span className="text-text-secondary capitalize">{tier}</span>
                      <span className="font-mono font-medium text-text-primary tabular-nums">{target}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">Beat built-in opponents</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
