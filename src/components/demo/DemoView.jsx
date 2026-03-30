import { useState, useRef, useEffect, useCallback } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import * as tf from '@tensorflow/tfjs'
import { PRETRAINED_MODELS, loadPretrainedModel } from '../../ml/pretrainedModels'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import SnakeEngine from '../../games/snake/SnakeEngine'
import SnakeRenderer from '../../games/snake/SnakeRenderer'
import FlappyEngine from '../../games/flappy/FlappyEngine'
import FlappyRenderer from '../../games/flappy/FlappyRenderer'
import CartPoleEngine from '../../games/cartpole/CartPoleEngine'
import CartPoleRenderer from '../../games/cartpole/CartPoleRenderer'
import TwentyFortyEightEngine from '../../games/twentyfortyeight/TwentyFortyEightEngine'
import TwentyFortyEightRenderer from '../../games/twentyfortyeight/TwentyFortyEightRenderer'
import ActivationVisualizer from '../viz/ActivationVisualizer'

function createEngine(gameId) {
  switch (gameId) {
    case 'snake': return new SnakeEngine()
    case 'flappy': return new FlappyEngine()
    case 'cartpole': return new CartPoleEngine()
    case 'twentyfortyeight': return new TwentyFortyEightEngine()
    default: return new SnakeEngine()
  }
}

function GameRendererSwitch({ gameId, gameState }) {
  if (!gameState) return null
  switch (gameId) {
    case 'snake': return <SnakeRenderer gameState={gameState} width={380} height={380} />
    case 'flappy': return <FlappyRenderer gameState={gameState} width={340} height={480} />
    case 'cartpole': return <CartPoleRenderer gameState={gameState} width={480} height={280} />
    case 'twentyfortyeight': return <TwentyFortyEightRenderer gameState={gameState} width={380} height={380} />
    default: return null
  }
}

export default function DemoView() {
  const [activeGameId, setActiveGameId] = useState('snake')
  const [model, setModel] = useState(null)
  const [gameState, setGameState] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const engineRef = useRef(null)
  const intervalRef = useRef(null)
  
  const config = PRETRAINED_MODELS[activeGameId]
  const game = GAMES[activeGameId]

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
  }, [])

  const loadAndStart = useCallback(async (gid) => {
    stop()
    setIsLoading(true)
    setActiveGameId(gid)
    
    try {
      const pretrained = PRETRAINED_MODELS[gid]
      const loadedModel = await loadPretrainedModel(pretrained.id)
      
      if (!loadedModel) {
        // If not loaded (e.g. no internet/first time), we'd usually train here
        // but for demo we just show error if it fails to load or download
        throw new Error("Could not load pre-trained model.")
      }
      
      setModel(loadedModel)
      
      const engine = createEngine(gid)
      engineRef.current = engine
      let state = engine.reset()
      setGameState(engine.getState())
      setIsRunning(true)
      
      intervalRef.current = setInterval(() => {
        if (engine.isDone()) {
          state = engine.reset()
        }
        
        const qVals = tf.tidy(() => {
          const stateTensor = tf.tensor2d([state])
          const prediction = loadedModel.predict(stateTensor)
          return prediction.dataSync()
        })
        
        const action = Array.from(qVals).indexOf(Math.max(...Array.from(qVals)))
        const result = engine.step(action)
        state = result.state
        setGameState(engine.getState())
      }, gid === 'twentyfortyeight' ? 150 : 60)
      
    } catch (err) {
      console.error(err)
      alert("Demo load failed. You might need to 'Quick Train' the model in the main app first if it's not cached.")
    } finally {
      setIsLoading(false)
    }
  }, [stop])

  useEffect(() => {
    loadAndStart('snake')
    return stop
  }, [])

  return (
    <div className="h-screen w-full flex flex-col bg-[#050508] text-[#EDEDF4] font-sans selection:bg-accent-snake/30">
      {/* Header */}
      <header className="h-14 border-b border-border/50 px-6 flex items-center justify-between shrink-0 bg-bg-secondary/30 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-bold tracking-tighter hover:text-white transition-colors">
            MODELARENA <span className="text-text-ghost font-normal ml-1">DEMO</span>
          </Link>
          <div className="h-4 w-px bg-border/50" />
          <nav className="flex gap-1">
            {Object.keys(PRETRAINED_MODELS).map(gid => (
              <button
                key={gid}
                onClick={() => loadAndStart(gid)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeGameId === gid 
                    ? 'bg-white text-black' 
                    : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
                } disabled:opacity-50`}
              >
                {GAMES[gid].name}
              </button>
            ))}
          </nav>
        </div>
        <Link to="/app" className="text-xs font-medium px-4 py-1.5 rounded-full bg-accent-snake/10 text-accent-snake border border-accent-snake/20 hover:bg-accent-snake/20 transition-all">
          Launch Builder →
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left: Game View */}
        <div className="flex-[1.2] flex flex-col gap-4 overflow-hidden">
          <div className="bg-bg-card rounded-2xl border border-border/50 flex items-center justify-center p-8 relative overflow-hidden flex-1 shadow-2xl">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <M.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-10 h-10 border-2 border-accent-snake/20 border-t-accent-snake rounded-full animate-spin" />
                  <p className="text-xs text-text-muted animate-pulse">Downloading weights...</p>
                </M.div>
              ) : (
                <M.div
                  key={activeGameId}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <GameRendererSwitch gameId={activeGameId} gameState={gameState} />
                </M.div>
              )}
            </AnimatePresence>
            
            {/* Score Overlay */}
            <div className="absolute top-6 left-6 flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-text-ghost font-bold">Score</span>
                <span className="text-lg font-mono font-bold">{gameState?.score || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Info Card */}
          <div className="bg-bg-card rounded-2xl border border-border/50 p-5 shrink-0 shadow-lg">
            <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">{game.icon}</span> {config.name}
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
              {config.description} This model was trained using Deep Q-Learning (DQN) to optimize moves based on the state vectors visible on the right.
            </p>
          </div>
        </div>

        {/* Right: Activations & Code */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Activations Panel */}
          <div className="flex-1 bg-bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <span className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Live Neurons</span>
              <span className="text-[10px] font-mono text-success flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Active Inference
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
              {model && gameState && (
                <ActivationVisualizer model={model} state={gameState.state} />
              )}
            </div>
          </div>

          {/* Code/Architecture Panel */}
          <div className="h-64 bg-bg-card rounded-2xl border border-border/50 flex flex-col overflow-hidden shadow-lg">
            <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between shrink-0 bg-white/[0.02]">
              <span className="text-[11px] uppercase tracking-widest font-bold text-text-muted">Architecture</span>
              <span className="text-[10px] font-mono text-text-ghost">TF.js Layers</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 font-mono text-[11px] text-text-secondary leading-relaxed scrollbar-hide">
              <pre className="text-accent-snake/80">
                {`// Neural Network Definition\n`}
                {`const model = tf.sequential();\n\n`}
                {`// Input Layer: [${game.inputSize}] features\n`}
                {config.layers.map((l, i) => (
                  <div key={i} className="pl-2 border-l-2 border-white/5 ml-1 my-1">
                    {l.type === 'dense' && `model.add(tf.layers.dense({\n  units: ${l.units},\n  activation: '${l.activation}'\n}));`}
                    {l.type === 'dropout' && `model.add(tf.layers.dropout({ rate: ${l.rate} }));`}
                  </div>
                ))}
                {`model.add(tf.layers.dense({\n  units: ${game.outputSize},\n  activation: 'linear'\n}));`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
