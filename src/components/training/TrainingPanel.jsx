import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
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
import TrainingCharts from './TrainingCharts'
import HyperparamConfig from './HyperparamConfig'
import TrainingHints from './TrainingHints'

function createEngine(gameId) {
  switch (gameId) {
    case 'snake': return new SnakeEngine()
    case 'flappy': return new FlappyEngine()
    case 'cartpole': return new CartPoleEngine()
    case 'twentyfortyeight': return new TwentyFortyEightEngine()
    default: return new SnakeEngine()
  }
}

function GameRenderer({ gameId, gameState }) {
  if (!gameState) return null
  switch (gameId) {
    case 'snake': return <SnakeRenderer gameState={gameState} width={300} height={300} />
    case 'flappy': return <FlappyRenderer gameState={gameState} width={300} height={400} />
    case 'cartpole': return <CartPoleRenderer gameState={gameState} width={400} height={250} />
    case 'twentyfortyeight': return <TwentyFortyEightRenderer gameState={gameState} width={300} height={300} />
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
      // Auto-load starter preset for convenience
      useModelStore.getState().loadPreset('starter')
    }
    const currentLayers = useModelStore.getState().layers
    if (currentLayers.length === 0) return alert('Add layers to your model first!')
    if (game.trainingMode === 'supervised') return alert('Chess uses supervised training (coming soon)')

    const engine = createEngine(activeGameId)
    training.startTraining()

    const loop = new TrainingLoop(engine, currentLayers, activeGameId, game.outputSize, training.hyperparams, {
      onStep: (data) => {
        stepCountRef.current++
        if (stepCountRef.current % 10 === 0) {
          setGameState(data.gameState)
          setQValues(data.qValues)
        }
        if (data.loss !== null) training.addLoss(data.loss)
        training.setEpsilon(data.epsilon)
        training.setStep(data.step)

        const now = Date.now()
        if (now - lastTimeRef.current > 1000) {
          training.setStepsPerSecond(stepCountRef.current / ((now - lastTimeRef.current) / 1000))
          stepCountRef.current = 0
          lastTimeRef.current = now
        }
      },
      onEpisodeEnd: (data) => {
        training.addEpisodeReward(data.score)
      },
      onTrainingEnd: () => {
        training.stopTraining()
        addEntry(activeGameId, {
          modelName,
          bestScore: training.bestScore,
          architecture: layers.map(l => l.type).join(' → '),
          episodes: training.episode,
          layerCount: layers.length,
        })
      },
    })

    trainingRef.current = loop
    loop.start()
  }, [layers, activeGameId, game, training, modelName, addEntry])

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
        architecture: layers.map(l => l.type).join(' → '),
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
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-semibold">Training: {game.name}</h2>
          {training.isTraining && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-success/10 text-success border border-success/20">
              Episode {training.episode} &middot; Best: {training.bestScore.toFixed(1)}
            </span>
          )}
        </div>

        {/* No model warning */}
        {layers.length === 0 && !training.isTraining && (
          <div className="mb-4 p-4 rounded-lg border-2 border-dashed border-border bg-bg-card">
            <p className="text-sm text-text-secondary mb-2">No model architecture configured yet.</p>
            <p className="text-xs text-text-muted mb-3">Go to Model Builder to design your network, or use a quick-start below:</p>
            <div className="flex gap-2">
              <button
                onClick={() => { useModelStore.getState().loadPreset('starter'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-snake/10 text-accent-snake border border-accent-snake/20"
              >
                Load Starter (2-layer)
              </button>
              <button
                onClick={() => { useModelStore.getState().loadPreset('deep'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-hover text-text-primary border border-border"
              >
                Load Deep (5-layer)
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2 mb-4">
          {!training.isTraining ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleStart}
              className={`px-4 py-2 rounded-lg font-medium text-sm bg-${game.accentColor} text-bg-primary hover:opacity-90 transition-opacity`}>
              Start Training
            </motion.button>
          ) : (
            <>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handlePause}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-warning/10 text-warning border border-warning/20">
                {training.isPaused ? 'Resume' : 'Pause'}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleStop}
                className="px-4 py-2 rounded-lg font-medium text-sm bg-error/10 text-error border border-error/20">
                Stop
              </motion.button>
            </>
          )}
        </div>

        {/* Live game view */}
        <div className="mb-4">
          {gameState ? (
            <GameRenderer gameId={activeGameId} gameState={gameState} qValues={qValues} />
          ) : (
            <div className="w-[300px] h-[300px] rounded-lg border border-border bg-bg-card flex items-center justify-center">
              <p className="text-text-muted text-sm">Start training to see live gameplay</p>
            </div>
          )}
        </div>

        {/* Stats */}
        {training.isTraining && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Episode', value: training.episode },
              { label: 'Best Score', value: training.bestScore.toFixed(1) },
              { label: 'Epsilon', value: training.epsilon.toFixed(3) },
              { label: 'Steps/s', value: training.stepsPerSecond.toFixed(0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-card border border-border rounded-lg p-2 text-center">
                <p className="text-[10px] text-text-muted">{label}</p>
                <p className="text-sm font-mono font-medium text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        )}

        <TrainingHints />
        <div className="mt-4">
          <TrainingCharts />
        </div>
      </div>

      {/* Right: Hyperparams */}
      <div className="w-72 border-l border-border bg-bg-secondary p-3 overflow-y-auto shrink-0">
        <HyperparamConfig />
      </div>
    </div>
  )
}
