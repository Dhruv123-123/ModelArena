import { useState, useEffect, useCallback } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'
import { PRETRAINED_MODELS, hasPretrainedModel, loadPretrainedModel, quickTrainModel } from '../../ml/pretrainedModels'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const TIER_DISPLAY = {
  bronze: { label: 'Bronze', color: '#CD7F32', icon: 'workspace_premium' },
  silver: { label: 'Silver', color: '#94A3B8', icon: 'workspace_premium' },
  gold: { label: 'Gold', color: '#EAB308', icon: 'workspace_premium' },
}

export default function PretrainedModelSelector({ onModelReady, compact = false }) {
  const activeGameId = useGameStore((s) => s.activeGameId)
  const config = PRETRAINED_MODELS[activeGameId]
  const game = GAMES[activeGameId]

  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(null)
  const [modelAvailable, setModelAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      if (!config) {
        setStatus('idle')
        return
      }
      setStatus('checking')
      hasPretrainedModel(config.id).then((exists) => {
        if (!cancelled) {
          setModelAvailable(exists)
          setStatus(exists ? 'ready' : 'idle')
        }
      })
    })
    return () => { cancelled = true }
  }, [activeGameId, config])

  const handleLoadModel = useCallback(async () => {
    if (!config) return
    setStatus('checking')
    const model = await loadPretrainedModel(config.id)
    if (model) {
      setStatus('ready')
      onModelReady?.(model, config)
    }
  }, [config, onModelReady])

  const handleQuickTrain = useCallback(async () => {
    if (!config) return
    setStatus('training')
    setProgress({ percent: 0, episode: 0, bestScore: 0 })

    try {
      const { model, agent } = await quickTrainModel(activeGameId, (p) => {
        setProgress(p)
      })
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
          <M.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLoadModel}
            className="px-3 py-1.5 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            Load {config.name}
          </M.button>
        ) : status === 'training' ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-hover border border-border">
            <div className="w-24 h-1.5 bg-bg-primary rounded-full overflow-hidden">
              <M.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress?.percent || 0}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[10px] font-mono text-text-muted tabular-nums">{progress?.percent || 0}%</span>
          </div>
        ) : (
          <M.button
            whileTap={{ scale: 0.97 }}
            onClick={handleQuickTrain}
            className="px-3 py-1.5 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-bg-hover border border-border text-text-secondary hover:text-text-primary hover:border-primary/20 transition-colors"
          >
            Quick Train {config.name}
          </M.button>
        )}
      </div>
    )
  }

  return (
    <M.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-bg-hover overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border bg-bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-lg">smart_toy</span>
            <div>
              <h3 className="text-sm font-black text-text-primary font-label tracking-tight">{config.name}</h3>
              <p className="text-[10px] text-text-muted font-mono">{config.description}</p>
            </div>
          </div>
          {tier && (
            <div className="flex items-center gap-1" style={{ color: tier.color }}>
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{tier.icon}</span>
              <span className="text-[10px] font-label uppercase tracking-wider font-black">{tier.label}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        {/* Architecture preview */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[10px] text-text-muted font-label">Architecture:</span>
          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">
            Input [{game.inputSize}]
          </span>
          {config.layers.map((l, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="text-text-ghost text-[10px]">→</span>
              <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary text-[10px] font-mono">
                {l.type === 'dense' ? `Dense(${l.units})` : l.type === 'dropout' ? `Drop(${l.rate})` : l.type}
              </span>
            </span>
          ))}
          <span className="text-text-ghost text-[10px]">→</span>
          <span className="px-1.5 py-0.5 rounded bg-error/10 text-error text-[10px] font-mono">
            Output [{game.outputSize}]
          </span>
        </div>

        {/* Status-based UI */}
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <M.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[11px] text-text-secondary mb-3 leading-relaxed">
                This pre-trained model needs to be generated first. Quick Train will train it in your browser
                (~{config.hyperparams.maxEpisodes} episodes, usually takes 30-90 seconds).
              </p>
              <M.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleQuickTrain}
                className="w-full px-4 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.2em] font-black bg-primary text-on-primary hover:brightness-110 transition-all neural-glow"
              >
                Quick Train {config.name}
              </M.button>
            </M.div>
          )}

          {status === 'checking' && (
            <M.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-2">
              <p className="text-[11px] text-text-muted font-label">Checking for saved model...</p>
            </M.div>
          )}

          {status === 'training' && progress && (
            <M.div key="training" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono text-text-muted tabular-nums">
                  <span>Episode {progress.episode}/{progress.totalEpisodes}</span>
                  <span>Best: {progress.bestScore.toFixed(1)}</span>
                  <span>ε: {progress.epsilon?.toFixed(3)}</span>
                </div>
                <div className="w-full h-2 bg-bg-primary rounded-full overflow-hidden">
                  <M.div
                    className="h-full rounded-full bg-primary"
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-[10px] text-text-muted text-center font-label">
                  Training in your browser... {progress.percent}% complete
                </p>
              </div>
            </M.div>
          )}

          {status === 'ready' && (
            <M.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-primary status-pulse" />
                <p className="text-[11px] text-primary font-label font-black">Model ready!</p>
              </div>
              <div className="flex gap-2">
                <M.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLoadModel}
                  className="flex-1 px-4 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  Load & Watch Play
                </M.button>
                <M.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleQuickTrain}
                  className="px-4 py-2.5 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black text-text-muted border border-border hover:text-text-primary hover:border-primary/20 transition-colors"
                >
                  Retrain
                </M.button>
              </div>
            </M.div>
          )}

          {status === 'error' && (
            <M.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p className="text-[11px] text-error mb-2 font-label">Training failed. Try again.</p>
              <button onClick={handleQuickTrain}
                className="px-4 py-2 rounded-lg text-[10px] font-label uppercase tracking-wider font-black bg-error/10 text-error border border-error/20 hover:bg-error/15 transition-colors">
                Retry
              </button>
            </M.div>
          )}
        </AnimatePresence>
      </div>
    </M.div>
  )
}
