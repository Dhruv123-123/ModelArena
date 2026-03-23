import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useModelStore from '../../stores/useModelStore'
import SnakeEngine from '../../games/snake/SnakeEngine'
import SnakeRenderer from '../../games/snake/SnakeRenderer'
import FlappyEngine from '../../games/flappy/FlappyEngine'
import FlappyRenderer from '../../games/flappy/FlappyRenderer'
import TwentyFortyEightEngine from '../../games/twentyfortyeight/TwentyFortyEightEngine'
import TwentyFortyEightRenderer from '../../games/twentyfortyeight/TwentyFortyEightRenderer'
import DQNAgent from '../../ml/DQNAgent'
import { PRETRAINED_MODELS, loadPretrainedModel, hasPretrainedModel } from '../../ml/pretrainedModels'

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

  if (activeGameId === 'cartpole' || activeGameId === 'chess') {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-text-muted">Human vs Model is available for Snake, Flappy Bird, and 2048</p>
      </div>
    )
  }

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

  const size = activeGameId === 'flappy' ? { w: 250, h: 350 } : { w: 280, h: 280 }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-text-primary">Human vs AI</h3>
        {!isRunning ? (
          <motion.button whileTap={{ scale: 0.97 }} onClick={start}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-accent-snake/10 text-accent-snake border border-accent-snake/20 hover:bg-accent-snake/20 transition-colors">
            Start Challenge
          </motion.button>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { clearInterval(intervalRef.current); setIsRunning(false) }}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-error/10 text-error border border-error/20 hover:bg-error/15 transition-colors">
            Stop
          </motion.button>
        )}
      </div>

      <div className="flex gap-5 justify-center items-start">
        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-text-primary">You</span>
            <span className="text-base font-mono font-bold text-accent-snake">{humanScore}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-border">
            {humanState ? (
              <Renderer gameId={activeGameId} gameState={humanState} width={size.w} height={size.h} />
            ) : (
              <div style={{ width: size.w, height: size.h }} className="bg-bg-card flex items-center justify-center">
                <p className="text-xs text-text-muted">Waiting...</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center pt-24">
          <span className="text-xl font-bold text-text-muted">VS</span>
        </div>

        <div className="space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-medium text-text-primary">AI</span>
            <span className="text-base font-mono font-bold text-accent-flappy">{aiScore}</span>
          </div>
          <div className="rounded-xl overflow-hidden border border-border">
            {aiState ? (
              <Renderer gameId={activeGameId} gameState={aiState} width={size.w} height={size.h} />
            ) : (
              <div style={{ width: size.w, height: size.h }} className="bg-bg-card flex items-center justify-center">
                <p className="text-xs text-text-muted">Waiting...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {winner && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
          <p className="text-xl font-bold">
            {winner === 'human' && <span className="text-accent-snake">You Win!</span>}
            {winner === 'ai' && <span className="text-accent-flappy">AI Wins!</span>}
            {winner === 'tie' && <span className="text-text-muted">It's a Tie!</span>}
          </p>
          <p className="text-sm text-text-muted mt-1.5">You: {humanScore} vs AI: {aiScore}</p>
        </motion.div>
      )}

      {isRunning && (
        <p className="text-xs text-text-muted text-center">
          Use arrow keys to control{activeGameId === 'flappy' ? ' (Space to flap)' : ''}
        </p>
      )}
    </div>
  )
}
