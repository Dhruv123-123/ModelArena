import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PRETRAINED_MODELS, hasPretrainedModel, loadPretrainedModel, quickTrainModel } from '../../ml/pretrainedModels'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const TIER_DISPLAY = {
  bronze: { label: 'Bronze', icon: '🥉', color: '#CD7F32' },
  silver: { label: 'Silver', icon: '🥈', color: '#94A3B8' },
  gold: { label: 'Gold', icon: '🥇', color: '#EAB308' },
}

export default function PretrainedModelSelector({ onModelReady, compact = false }) {
  const activeGameId = useGameStore((s) => s.activeGameId)
  const config = PRETRAINED_MODELS[activeGameId]
  const game = GAMES[activeGameId]

  const [status, setStatus] = useState('idle') // idle | checking | ready | training | error
  const [progress, setProgress] = useState(null)
  const [modelAvailable, setModelAvailable] = useState(false)
  const [trainedModel, setTrainedModel] = useState(null)

  // Check if pre-trained model exists
  useEffect(() => {
    if (!config) { setStatus('idle'); return }
    setStatus('checking')
    hasPretrainedModel(config.id).then(exists => {
      setModelAvailable(exists)
      setStatus(exists ? 'ready' : 'idle')
    })
  }, [activeGameId, config])

  const handleLoadModel = useCallback(async () => {
    if (!config) return
    setStatus('checking')
    const model = await loadPretrainedModel(config.id)
    if (model) {
      setTrainedModel(model)
      setStatus('ready')
      onModelReady?.(model, config)
    }
  }, [config, onModelReady])

  const handleQuickTrain = useCallback(async () => {
    if (!config) return
    setStatus('training')
    setProgress({ percent: 0, episode: 0, bestScore: 0 })

    try {
      const { model, bestScore, agent } = await quickTrainModel(activeGameId, (p) => {
        setProgress(p)
      })
      setTrainedModel(model)
      setModelAvailable(true)
      setStatus('ready')
      onModelReady?.(model, config, agent)
    } catch (err) {
      console.error('Training failed:', err)
      setStatus('error')
    }
  }, [activeGameId, config, onModelReady])

  if (!config || game.trainingMode === 'supervised') {
    return null
  }

  const tier = TIER_DISPLAY[config.tier]

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {status === 'ready' && modelAvailable ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLoadModel}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-accent-snake/10 text-accent-snake border border-accent-snake/20 hover:bg-accent-snake/20 transition-colors"
          >
            Load {config.name}
          </motion.button>
        ) : status === 'training' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-card border border-border">
            <div className="w-24 h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent-snake rounded-full"
                animate={{ width: `${progress?.percent || 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-xs font-mono text-text-muted">{progress?.percent || 0}%</span>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleQuickTrain}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-bg-card border border-border text-text-secondary hover:text-text-primary transition-colors"
          >
            Quick Train {config.name}
          </motion.button>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-bg-card overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border bg-bg-secondary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{game.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{config.name}</h3>
              <p className="text-xs text-text-muted">{config.description}</p>
            </div>
          </div>
          {tier && (
            <span className="text-xs" style={{ color: tier.color }}>
              {tier.icon} {tier.label}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        {/* Architecture preview */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-xs text-text-muted">Architecture:</span>
          <span className="px-1.5 py-0.5 rounded bg-[#6366F1]/10 text-[#6366F1] text-xs font-mono">
            Input [{game.inputSize}]
          </span>
          {config.layers.map((l, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-text-muted text-xs">→</span>
              <span className="px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-mono">
                {l.type === 'dense' ? `Dense(${l.units})` : l.type === 'dropout' ? `Drop(${l.rate})` : l.type}
              </span>
            </span>
          ))}
          <span className="text-text-muted text-xs">→</span>
          <span className="px-1.5 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] text-xs font-mono">
            Output [{game.outputSize}]
          </span>
        </div>

        {/* Status-based UI */}
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-text-secondary mb-3">
                This pre-trained model needs to be generated first. Quick Train will train it in your browser
                (~{config.hyperparams.maxEpisodes} episodes, usually takes 30-90 seconds).
              </p>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickTrain}
                className="w-full px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
                style={{
                  backgroundColor: game.accentColor === 'accent-snake' ? '#22C55E' : game.accentColor === 'accent-flappy' ? '#F97316' : game.accentColor === 'accent-cartpole' ? '#3B82F6' : '#A855F7',
                  color: '#0A0A0F',
                }}
              >
                Quick Train {config.name}
              </motion.button>
            </motion.div>
          )}

          {status === 'checking' && (
            <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-2">
              <p className="text-xs text-text-muted">Checking for saved model...</p>
            </motion.div>
          )}

          {status === 'training' && progress && (
            <motion.div key="training" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-text-muted">
                  <span>Episode {progress.episode}/{progress.totalEpisodes}</span>
                  <span>Best: {progress.bestScore.toFixed(1)}</span>
                  <span>ε: {progress.epsilon?.toFixed(3)}</span>
                </div>
                <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: '#22C55E' }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-text-muted text-center">
                  Training in your browser... {progress.percent}% complete
                </p>
              </div>
            </motion.div>
          )}

          {status === 'ready' && (
            <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <p className="text-xs text-success font-medium">Model ready!</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoadModel}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-sm bg-accent-snake/10 text-accent-snake border border-accent-snake/20 hover:bg-accent-snake/20 transition-colors"
                >
                  Load & Watch Play
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleQuickTrain}
                  className="px-4 py-2 rounded-lg text-sm text-text-muted border border-border hover:text-text-primary transition-colors"
                >
                  Retrain
                </motion.button>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-xs text-error mb-2">Training failed. Try again.</p>
              <button onClick={handleQuickTrain}
                className="px-4 py-2 rounded-lg text-sm bg-error/10 text-error border border-error/20">
                Retry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
