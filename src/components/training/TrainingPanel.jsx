import { useState, useRef, useCallback, useEffect } from 'react'
import { motion as M } from 'framer-motion'
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
import { saveChessSessionWeights } from '../../ml/modelSerializer'
import ChessEngine from '../../games/chess/ChessEngine'
import ChessRenderer from '../../games/chess/ChessRenderer'
import TrainingCharts from './TrainingCharts'
import HyperparamConfig from './HyperparamConfig'
import TrainingHints from './TrainingHints'
import { getGameAccentHex } from '../../utils/gameTheme'
import { boardToVector } from '../../utils/chessBoardVector'

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

function leaderboardSnapshot(modelName, layers) {
  const ts = useTrainingStore.getState()
  return {
    modelName,
    bestScore: ts.bestScore,
    architecture: layers.map((l) => l.type).join(' → '),
    episodes: ts.episode,
    layerCount: layers.length,
    rewardHistory: [...ts.episodeRewards].slice(-400),
    lossHistory: [...ts.losses].slice(-400),
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
  const lastTimeRef = useRef(null)
  const [confetti, setConfetti] = useState(false)
  const [logs, setLogs] = useState([])

  const accentHex = getGameAccentHex(activeGameId)

  const addLog = useCallback((msg, type = 'info') => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false })
    setLogs(prev => [...prev.slice(-20), { time, msg, type }])
  }, [])

  useEffect(() => {
    let hideTimer
    let sessionBest = -Infinity
    const unsub = useTrainingStore.subscribe((state) => {
      if (!state.isTraining) {
        sessionBest = -Infinity
        return
      }
      const b = state.bestScore
      if (!Number.isFinite(b)) return
      if (sessionBest === -Infinity) {
        sessionBest = b
        return
      }
      if (b > sessionBest) {
        sessionBest = b
        setConfetti(true)
        addLog(`Reward Peak Detected: +${b.toFixed(1)} units`, 'success')
        window.clearTimeout(hideTimer)
        hideTimer = window.setTimeout(() => setConfetti(false), 2200)
      }
    })
    return () => {
      unsub()
      window.clearTimeout(hideTimer)
    }
  }, [addLog])

  const handleStart = useCallback(() => {
    if (layers.length === 0) {
      useModelStore.getState().loadPreset(activeGameId === 'chess' ? 'deep' : 'starter')
    }
    const currentLayers = useModelStore.getState().layers
    if (currentLayers.length === 0) return alert('Add layers to your model first!')

    const store = useTrainingStore.getState()
    store.startTraining()
    stepCountRef.current = 0
    lastTimeRef.current = null
    setLogs([])
    addLog('Training session initialized...')

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
              addLog(`Epoch ${data.epoch}: loss=${data.loss.toFixed(4)}`)
              const demoEngine = new ChessEngine()
              const model = trainer.getModel()
              for (let i = 0; i < 10; i++) {
                if (demoEngine.isDone()) break
                demoEngine.step(0, (board) => {
                  try {
                    const vec = boardToVector(board)
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
          onTrainingEnd: async () => {
            const trainerInst = trainingRef.current
            if (trainerInst?.getModel) {
              try {
                const key = await saveChessSessionWeights(trainerInst.getModel())
                useModelStore.getState().setSavedWeightsKey(key)
              } catch (e) {
                console.warn('Chess session weights save failed', e)
              }
            }
            useTrainingStore.getState().stopTraining()
            addEntry(activeGameId, leaderboardSnapshot(useModelStore.getState().modelName, currentLayers))
            addLog('Training completed.', 'success')
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
          if (lastTimeRef.current === null) {
            lastTimeRef.current = now
          } else if (now - lastTimeRef.current > 1000) {
            s.setStepsPerSecond(stepCountRef.current / ((now - lastTimeRef.current) / 1000))
            stepCountRef.current = 0
            lastTimeRef.current = now
          }
        },
        onEpisodeEnd: (data) => {
          useTrainingStore.getState().addEpisodeReward(data.score)
          if (data.score > 0 && useTrainingStore.getState().episode % 20 === 0) {
            addLog(`Episode ${useTrainingStore.getState().episode}: score=${data.score.toFixed(1)}`)
          }
        },
        onTrainingEnd: () => {
          useTrainingStore.getState().stopTraining()
          addEntry(activeGameId, leaderboardSnapshot(useModelStore.getState().modelName, currentLayers))
          addLog('Training session ended.', 'success')
        },
      })

      trainingRef.current = loop
      loop.start()
      addLog('Training loop started.', 'success')
    } catch (err) {
      console.error('Training failed:', err)
      useTrainingStore.getState().stopTraining()
      alert('Training failed: ' + err.message)
    }
  }, [layers, activeGameId, game, addEntry, addLog])

  const handlePause = () => {
    if (training.isPaused) { trainingRef.current?.resume(); training.resumeTraining(); addLog('Training resumed.') }
    else { trainingRef.current?.pause(); training.pauseTraining(); addLog('Training paused.') }
  }

  const handleStop = () => {
    trainingRef.current?.dispose()
    trainingRef.current = null
    training.stopTraining()
    if (training.bestScore > -Infinity) {
      addEntry(activeGameId, leaderboardSnapshot(modelName, layers))
    }
    addLog('Training stopped by user.')
  }

  useEffect(() => {
    return () => { trainingRef.current?.dispose() }
  }, [])

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Confetti */}
      {confetti && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
          {Array.from({ length: 22 }).map((_, i) => {
            const angle = (i / 22) * Math.PI * 2
            const dist = 120 + (i % 5) * 28
            return (
              <M.span
                key={i}
                className="absolute left-1/2 top-[28%] block size-1.5 rounded-[1px]"
                style={{ backgroundColor: i % 3 === 0 ? accentHex : i % 3 === 1 ? '#F59E0B' : '#E8E8F0' }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 40, opacity: 0, rotate: 360 + i * 40 }}
                transition={{ duration: 1.35 + (i % 4) * 0.08, ease: 'easeOut' }}
              />
            )
          })}
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Hero Viewport + Config */}
        <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Game Viewport */}
          <div className="xl:col-span-3 relative bg-bg-primary rounded-xl border border-border overflow-hidden" style={{ minHeight: 400 }}>
            {/* Grid Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none grid-bg" />

            {/* Game Canvas */}
            <div className="flex items-center justify-center p-8 min-h-[400px]">
              {gameState ? (
                <GameRenderer gameId={activeGameId} gameState={gameState} qValues={qValues} />
              ) : (
                <div className="text-center space-y-4">
                  <span className="material-symbols-outlined text-text-ghost text-6xl">videogame_asset</span>
                  <p className="text-text-muted text-sm font-label uppercase tracking-widest">Start training to see live gameplay</p>
                </div>
              )}
            </div>

            {/* HUD Overlay - Top */}
            {training.isTraining && (
              <div className="absolute top-6 left-6 flex gap-3 pointer-events-none">
                <div className="hud-overlay px-5 py-2 rounded-xl flex flex-col">
                  <span className="font-label text-[9px] text-primary uppercase tracking-widest font-black mb-1">Score</span>
                  <span className="font-mono text-xl font-bold text-text-primary">{training.bestScore.toFixed(0)}</span>
                </div>
                <div className="hud-overlay px-5 py-2 rounded-xl flex flex-col">
                  <span className="font-label text-[9px] text-text-muted uppercase tracking-widest font-black mb-1">Gen</span>
                  <span className="font-mono text-xl font-bold text-text-primary">{training.episode.toLocaleString()}</span>
                </div>
                <div className="hud-overlay px-5 py-2 rounded-xl flex flex-col">
                  <span className="font-label text-[9px] text-text-muted uppercase tracking-widest font-black mb-1">Epsilon</span>
                  <span className="font-mono text-xl font-bold text-text-primary">{training.epsilon.toFixed(3)}</span>
                </div>
              </div>
            )}

            {/* Training Status Badge */}
            {training.isTraining && (
              <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-bg-primary/40 backdrop-blur-md px-4 py-2 rounded-full border border-primary/20">
                <span className="h-2 w-2 rounded-full bg-primary status-pulse" />
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-primary font-black">
                  {training.isPaused ? 'Paused' : 'Training Active'}
                </span>
              </div>
            )}

            {/* New Record Banner */}
            {confetti && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                <M.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="kinetic-banner px-10 py-6 rounded-2xl text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary status-pulse" />
                    <span className="font-label text-[11px] font-black text-primary uppercase tracking-[0.4em]">Milestone</span>
                  </div>
                  <h2 className="font-black text-text-primary text-3xl tracking-tighter uppercase">New Peak Record</h2>
                  <p className="font-mono text-[10px] text-text-muted uppercase tracking-widest mt-1">Score: {training.bestScore.toFixed(1)}</p>
                </M.div>
              </div>
            )}

            {/* Controls Bar - Bottom */}
            <div className="absolute bottom-6 left-6 flex gap-2">
              {!training.isTraining ? (
                <button onClick={handleStart} className="px-6 py-2.5 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:brightness-110 transition-all neural-glow flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  Start Training
                </button>
              ) : (
                <>
                  <button onClick={handlePause} className="px-4 py-2 border border-warning/30 text-warning font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-warning/10 transition-all backdrop-blur-sm bg-bg-primary/40">
                    {training.isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button onClick={handleStop} className="px-4 py-2 border border-error/30 text-error font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-error/10 transition-all backdrop-blur-sm bg-bg-primary/40">
                    Stop
                  </button>
                </>
              )}
            </div>

            {/* No model warning */}
            {layers.length === 0 && !training.isTraining && (
              <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/80 backdrop-blur-sm z-20">
                <div className="text-center space-y-4 p-8">
                  <span className="material-symbols-outlined text-text-ghost text-5xl">warning</span>
                  <p className="text-text-secondary text-sm">No model configured. A default will be loaded on start.</p>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => useModelStore.getState().loadPreset('starter')} className="px-4 py-2 bg-primary text-on-primary font-label text-[10px] uppercase tracking-widest font-black rounded-lg">Load Starter</button>
                    <button onClick={() => useModelStore.getState().loadPreset('deep')} className="px-4 py-2 border border-border text-text-secondary font-label text-[10px] uppercase tracking-widest font-black rounded-lg hover:bg-bg-hover">Load Deep</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Hyperparameter Config */}
          <div className="xl:col-span-1 glass-panel p-6 rounded-xl flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-label text-[11px] font-black uppercase tracking-[0.3em] text-text-muted">Model Config</h2>
              <span className="material-symbols-outlined text-lg text-primary">tune</span>
            </div>
            <HyperparamConfig />
          </div>
        </section>

        {/* Metrics Charts */}
        <TrainingCharts />

        {/* Bottom: Logs + Insight */}
        <section className="grid grid-cols-3 gap-6">
          <div className="col-span-3 lg:col-span-2 bg-bg-hover p-5 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-label text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">Neural Logs</h4>
              <span className="font-label text-[9px] text-primary/40 uppercase tracking-widest">
                {training.isTraining ? 'Real-time Stream' : 'Idle'}
              </span>
            </div>
            <div className="space-y-2 font-mono text-[10px] text-text-muted max-h-32 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-text-ghost">Awaiting training session...</p>
              ) : logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-primary/30">[{log.time}]</span>
                  <span className={log.type === 'success' ? 'text-primary font-bold' : ''}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-3 lg:col-span-1 bg-primary/5 p-5 rounded-xl border border-primary/10 flex flex-col justify-center items-center text-center">
            <span className="material-symbols-outlined text-primary text-3xl mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h4 className="font-label text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-2">Neural Insight</h4>
            <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
              {training.isTraining
                ? `Training on ${game.name}. Monitor the loss curve for convergence signals.`
                : 'Start a training session to receive real-time architecture insights.'}
            </p>
          </div>
        </section>

        <TrainingHints />
      </div>
    </div>
  )
}
