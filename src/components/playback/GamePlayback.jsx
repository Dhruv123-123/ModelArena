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
import DQNAgent from '../../ml/DQNAgent'
import DecisionOverlay from './DecisionOverlay'
import PretrainedModelSelector from '../welcome/PretrainedModelSelector'
import { PRETRAINED_MODELS, hasPretrainedModel, loadPretrainedModel } from '../../ml/pretrainedModels'

function createEngine(gameId) {
  switch (gameId) {
    case 'snake': return new SnakeEngine()
    case 'flappy': return new FlappyEngine()
    case 'cartpole': return new CartPoleEngine()
    case 'twentyfortyeight': return new TwentyFortyEightEngine()
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
    if (game.trainingMode === 'supervised') return alert('Chess playback coming soon')

    const engine = createEngine(activeGameId)
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
      <div className="flex-1 p-4 overflow-y-auto flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4 w-full max-w-lg">
          <h2 className="text-lg font-semibold flex-1">Play: {game.name}</h2>
          {activeModelName && isRunning && (
            <span className="text-[10px] font-mono text-text-muted px-2 py-0.5 rounded bg-bg-card border border-border">
              {activeModelName}
            </span>
          )}
          <span className="text-sm font-mono text-text-secondary">Score: {score}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-4 flex-wrap justify-center">
          {!isRunning ? (
            <>
              {pretrainedReady && (
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={loadAndPlayPretrained}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-accent-snake text-bg-primary hover:opacity-90 transition-opacity">
                  Watch Pre-Trained Demo
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={() => { setMode('ai'); startAI() }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  pretrainedReady
                    ? 'bg-bg-card border border-border text-text-primary'
                    : `bg-${game.accentColor}/10 text-${game.accentColor} border border-${game.accentColor}/20`
                }`}>
                Watch Your Model
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={startHuman}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-card border border-border text-text-primary">
                Play Yourself
              </motion.button>
            </>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} onClick={stop}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-error/10 text-error border border-error/20">
              Stop
            </motion.button>
          )}
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] text-text-muted">Speed:</span>
          {[500, 200, 100, 30].map(s => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-[10px] font-mono ${speed === s ? 'bg-bg-hover text-text-primary border border-border-light' : 'text-text-muted'}`}>
              {s === 500 ? '0.5x' : s === 200 ? '1x' : s === 100 ? '2x' : 'Max'}
            </button>
          ))}
        </div>

        {/* Game renderer */}
        {gameState ? (
          <GameRendererSwitch gameId={activeGameId} gameState={gameState} qValues={mode === 'ai' ? qValues : null} />
        ) : (
          <div className="w-[400px] max-w-full aspect-square rounded-lg border border-border bg-bg-card flex flex-col items-center justify-center gap-4 p-6">
            <p className="text-text-muted text-sm text-center">Choose an option above to start playing</p>
            {!pretrainedReady && game.trainingMode !== 'supervised' && (
              <div className="w-full max-w-sm">
                <p className="text-[10px] uppercase tracking-widest text-text-muted text-center mb-3">
                  Or generate a pre-trained model
                </p>
                <PretrainedModelSelector onModelReady={handlePretrainedReady} />
              </div>
            )}
          </div>
        )}

        {mode === 'human' && isRunning && (
          <p className="mt-3 text-[11px] text-text-muted">Use arrow keys to control{activeGameId === 'flappy' ? ' (Space to flap)' : ''}</p>
        )}

        {/* Game over restart */}
        {gameState && !isRunning && gameState.done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex gap-2"
          >
            <button
              onClick={mode === 'human' ? startHuman : (pretrainedReady ? loadAndPlayPretrained : startAI)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-bg-card border border-border text-text-primary hover:border-border-light transition-colors"
            >
              Play Again
            </button>
          </motion.div>
        )}
      </div>

      {/* Right panel: Q-values or pretrained info */}
      <div className="w-72 border-l border-border bg-bg-secondary p-3 shrink-0 overflow-y-auto">
        {mode === 'ai' && qValues ? (
          <DecisionOverlay qValues={qValues} />
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Pre-Trained Models</p>
              <PretrainedModelSelector
                onModelReady={handlePretrainedReady}
              />
            </div>

            <div className="bg-bg-card border border-border rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Controls</p>
              <div className="space-y-1 text-[11px] text-text-secondary">
                {activeGameId === 'snake' && (
                  <>
                    <p><span className="font-mono text-text-primary">↑↓←→</span> Move snake</p>
                  </>
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

            <div className="bg-bg-card border border-border rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Achievement Tiers</p>
              {typeof game.tiers.gold === 'number' ? (
                <div className="space-y-1.5">
                  {Object.entries(game.tiers).map(([tier, target]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary capitalize flex items-center gap-1">
                        {tier === 'gold' ? '🥇' : tier === 'silver' ? '🥈' : '🥉'} {tier}
                      </span>
                      <span className="text-[11px] font-mono text-text-primary">{target}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-text-muted">Beat built-in opponents</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
