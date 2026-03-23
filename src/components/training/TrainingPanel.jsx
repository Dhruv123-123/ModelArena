import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useModelStore from '../../stores/useModelStore'
import useTrainingStore from '../../stores/useTrainingStore'
import useLeaderboardStore from '../../stores/useLeaderboardStore'
import SnakeEngine from '../../games/snake/SnakeEngine'
import SnakeRenderer from '../../games/snake/SnakeRenderer'
import FlappyEngine from '../../games/flappy/FlappyEngine'
import FlappyRenderer from '../../games/flappy/FlappyRenderer'
import CartPoleEngine from '../../games/cartpole/CartPoleEngine'
import CartPoleRenderer from '../../games/cartpole/CartPoleRenderer'
import TwentyFortyEightEngine from '../../games/twentyfortyeight/TwentyFortyEightEngine'
import TwentyFortyEightRenderer from '../../games/twentyfortyeight/TwentyFortyEightRenderer'
import TrainingLoop from '../../ml/TrainingLoop'
import SupervisedTrainer from '../../ml/SupervisedTrainer'
import ChessEngine from '../../games/chess/ChessEngine'
import ChessRenderer from '../../games/chess/ChessRenderer'
import TrainingCharts from './TrainingCharts'
import HyperparamConfig from './HyperparamConfig'
import TrainingHints from './TrainingHints'

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

function GameRenderer({ gameId, gameState }) {
  if (!gameState) return null
  switch (gameId) {
    case 'snake': return <SnakeRenderer gameState={gameState} width={320} height={320} />
    case 'flappy': return <FlappyRenderer gameState={gameState} width={300} height={420} />
    case 'cartpole': return <CartPoleRenderer gameState={gameState} width={420} height={260} />
    case 'twentyfortyeight': return <TwentyFortyEightRenderer gameState={gameState} width={320} height={320} />
    case 'chess': return <ChessRenderer gameState={gameState} width={320} height={320} />
    default: return null
  }
}

export default function TrainingPanel() {
  const { activeGameId } = useGameStore()
  const game = GAMES[activeGameId]
  const layers = useModelStore((s) => s.layers)
  const modelName = useModelStore((s) => s.modelName)
  const training = useTrainingStore()
  const addEntry = useLeaderboardStore((s) => s.addEntry)
  const trainingRef = useRef(null)
  const [gameState, setGameState] = useState(null)
  const [qValues, setQValues] = useState(null)
  const stepCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  const handleStart = useCallback(() => {
    if (layers.length === 0) {
      useModelStore.getState().loadPreset(activeGameId === 'chess' ? 'deep' : 'starter')
    }
    const currentLayers = useModelStore.getState().layers
    if (currentLayers.length === 0) return alert('Add layers to your model first!')

    // Use getState() to read fresh values from stores inside callbacks
    const store = useTrainingStore.getState()
    store.startTraining()

    if (game.trainingMode === 'supervised') {
      const chessEngine = new ChessEngine()
      setGameState(chessEngine.getState())

      try {
        const trainer = new SupervisedTrainer(currentLayers, {
          onEpoch: (data) => {
            const s = useTrainingStore.getState()
            s.addLoss(data.loss)
            s.addEpisodeReward(1 - data.valLoss)
            s.setStep(data.epoch)
            s.setEpsilon(data.valLoss)
            stepCountRef.current++

            if (data.epoch % 5 === 0) {
              const demoEngine = new ChessEngine()
              const model = trainer.getModel()
              for (let i = 0; i < 10; i++) {
                if (demoEngine.isDone()) break
                demoEngine.step(0, (board) => {
                  try {
                    const vec = demoEngine.getStateVector()
                    const pred = model.predict(tf.tensor2d([vec]))
                    const val = pred.dataSync()[0]
                    pred.dispose()
                    return val
                  } catch { return 0 }
                })
              }
              setGameState(demoEngine.getState())
            }
          },
          onTrainingEnd: () => {
            const s = useTrainingStore.getState()
            s.stopTraining()
            addEntry(activeGameId, {
              modelName: useModelStore.getState().modelName,
              bestScore: s.bestScore,
              architecture: currentLayers.map(l => l.type).join(' → '),
              episodes: s.episode,
              layerCount: currentLayers.length,
            })
          },
        })
        trainingRef.current = trainer
        trainer.train(50, 32)
      } catch (err) {
        console.error('Supervised training failed:', err)
        useTrainingStore.getState().stopTraining()
        alert('Training failed: ' + err.message)
      }
      return
    }

    try {
      const engine = createEngine(activeGameId)
      const hp = useTrainingStore.getState().hyperparams

      const loop = new TrainingLoop(engine, currentLayers, activeGameId, game.outputSize, hp, {
        onStep: (data) => {
          stepCountRef.current++
          if (stepCountRef.current % 10 === 0) {
            setGameState(data.gameState)
            setQValues(data.qValues)
          }
          const s = useTrainingStore.getState()
          if (data.loss !== null) s.addLoss(data.loss)
          s.setEpsilon(data.epsilon)
          s.setStep(data.step)

          const now = Date.now()
          if (now - lastTimeRef.current > 1000) {
            s.setStepsPerSecond(stepCountRef.current / ((now - lastTimeRef.current) / 1000))
            stepCountRef.current = 0
            lastTimeRef.current = now
          }
        },
        onEpisodeEnd: (data) => {
          useTrainingStore.getState().addEpisodeReward(data.score)
        },
        onTrainingEnd: () => {
          const s = useTrainingStore.getState()
          s.stopTraining()
          addEntry(activeGameId, {
            modelName: useModelStore.getState().modelName,
            bestScore: s.bestScore,
            architecture: currentLayers.map(l => l.type).join(' → '),
            episodes: s.episode,
            layerCount: currentLayers.length,
          })
        },
      })

      trainingRef.current = loop
      loop.start()
    } catch (err) {
      console.error('Training failed:', err)
      useTrainingStore.getState().stopTraining()
      alert('Training failed: ' + err.message)
    }
  }, [layers, activeGameId, game, addEntry])

  const handlePause = () => {
    if (training.isPaused) { trainingRef.current?.resume(); training.resumeTraining() }
    else { trainingRef.current?.pause(); training.pauseTraining() }
  }

  const handleStop = () => {
    trainingRef.current?.dispose()
    trainingRef.current = null
    training.stopTraining()
    if (training.bestScore > -Infinity) {
      addEntry(activeGameId, {
        modelName, bestScore: training.bestScore,
        architecture: layers.map(l => l.type).join(' \u2192 '),
        episodes: training.episode, layerCount: layers.length,
      })
    }
  }

  useEffect(() => {
    return () => { trainingRef.current?.dispose() }
  }, [])

  return (
    <div className="h-full flex">
      {/* Left: Game view + controls */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-xl font-semibold">Training: {game.name}</h2>
          {training.isTraining && (
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-success/10 text-success border border-success/20">
              Episode {training.episode} &middot; Best: {training.bestScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* No model warning */}
        {layers.length === 0 && !training.isTraining && (
          <div className="mb-6 p-5 rounded-xl card-inset" style={{ border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-sm text-text-secondary mb-1.5">No model architecture configured yet.</p>
            <p className="text-xs text-text-muted mb-4">Go to Model Builder to design your network, or use a quick-start:</p>
            <div className="flex gap-2">
              <button
                onClick={() => { useModelStore.getState().loadPreset('starter') }}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-[#050508] hover:bg-white/90 transition-colors"
              >
                Load Starter (2-layer)
              </button>
              <button
                onClick={() => { useModelStore.getState().loadPreset('deep') }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Load Deep (5-layer)
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 mb-6">
          {!training.isTraining ? (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className="px-6 py-2.5 rounded-lg font-medium text-sm bg-white text-[#050508] hover:bg-white/90 transition-colors">
              Start Training
            </motion.button>
          ) : (
            <>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handlePause}
                className="px-5 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'rgba(234,179,8,0.08)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.15)' }}>
                {training.isPaused ? 'Resume' : 'Pause'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                onClick={handleStop}
                className="px-5 py-2 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)' }}>
                Stop
              </motion.button>
            </>
          )}
        </div>

        {/* Live game view */}
        <div className="mb-6">
          {gameState ? (
            <GameRenderer gameId={activeGameId} gameState={gameState} qValues={qValues} />
          ) : (
            <div className="w-[320px] h-[320px] rounded-xl border border-border bg-bg-card flex items-center justify-center">
              <p className="text-text-muted text-sm">Start training to see live gameplay</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {training.isTraining && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {[
              { label: 'Episode', value: training.episode },
              { label: 'Best Score', value: training.bestScore.toFixed(1) },
              { label: 'Epsilon', value: training.epsilon.toFixed(3) },
              { label: 'Steps/s', value: training.stepsPerSecond.toFixed(0) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3 text-center card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-[11px] uppercase tracking-wider text-text-muted mb-1 font-medium">{label}</p>
                <p className="text-base font-mono font-semibold text-text-primary tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        <TrainingHints />
        <div className="mt-6">
          <TrainingCharts />
        </div>
      </div>

      {/* Right: Hyperparams */}
      <div className="w-72 border-l border-border bg-bg-secondary p-4 overflow-y-auto shrink-0">
        <HyperparamConfig />
      </div>
    </div>
  )
}
