import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import useModelStore from '../../stores/useModelStore'
import useGameStore from '../../stores/useGameStore'
import { buildModel } from '../../ml/ModelBuilder'
import { exportModel, importModel, saveModel } from '../../ml/modelSerializer'

const SAVED_MODELS_KEY = 'modelarena-saved-models'

function getSavedModels() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_MODELS_KEY) || '[]')
  } catch { return [] }
}

function setSavedModels(models) {
  localStorage.setItem(SAVED_MODELS_KEY, JSON.stringify(models))
}

export default function ModelSaveLoad() {
  const layers = useModelStore((s) => s.layers)
  const modelName = useModelStore((s) => s.modelName)
  const setModelName = useModelStore((s) => s.setModelName)
  const activeGameId = useGameStore((s) => s.activeGameId)
  const [showPanel, setShowPanel] = useState(false)
  const [savedModels, setSavedModelsState] = useState(getSavedModels)
  const [status, setStatus] = useState(null)
  const fileInputRef = useRef(null)

  const refreshModels = useCallback(() => {
    setSavedModelsState(getSavedModels())
  }, [])

  const handleSave = useCallback(async () => {
    if (layers.length === 0) return setStatus({ type: 'error', msg: 'No layers to save' })
    try {
      const model = buildModel(layers, activeGameId, useGameStore.getState().activeGameId === 'chess' ? 1 : { snake: 4, flappy: 2, cartpole: 2, twentyfortyeight: 4 }[activeGameId] || 4)
      model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
      const key = await saveModel(model, activeGameId, modelName)
      model.dispose()

      const entry = {
        key,
        name: modelName,
        gameId: activeGameId,
        layers: layers.map(l => ({ type: l.type, units: l.units, filters: l.filters, activation: l.activation, rate: l.rate })),
        savedAt: Date.now(),
      }
      const existing = getSavedModels().filter(m => m.key !== key)
      existing.unshift(entry)
      setSavedModels(existing)
      refreshModels()
      setStatus({ type: 'success', msg: 'Model saved!' })
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setStatus({ type: 'error', msg: `Save failed: ${err.message}` })
    }
  }, [layers, modelName, activeGameId, refreshModels])

  const handleExport = useCallback(async () => {
    if (layers.length === 0) return setStatus({ type: 'error', msg: 'No layers to export' })
    try {
      const outputSize = { snake: 4, flappy: 2, cartpole: 2, twentyfortyeight: 4, chess: 1 }[activeGameId] || 4
      const model = buildModel(layers, activeGameId, outputSize)
      model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
      await exportModel(model, modelName)
      model.dispose()
      setStatus({ type: 'success', msg: 'Exported as JSON!' })
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setStatus({ type: 'error', msg: `Export failed: ${err.message}` })
    }
  }, [layers, modelName, activeGameId])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { name } = await importModel(file)
      setStatus({ type: 'success', msg: `Imported "${name || 'model'}"` })
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setStatus({ type: 'error', msg: `Import failed: ${err.message}` })
    }
    e.target.value = ''
  }, [])

  const handleLoadArchitecture = useCallback((saved) => {
    const store = useModelStore.getState()
    store.clearAll()
    saved.layers.forEach(l => store.addLayer(l.type))
    const currentLayers = useModelStore.getState().layers
    saved.layers.forEach((l, i) => {
      if (currentLayers[i]) {
        store.updateLayer(currentLayers[i].id, l)
      }
    })
    store.setModelName(saved.name)
    setStatus({ type: 'success', msg: `Loaded "${saved.name}"` })
    setTimeout(() => setStatus(null), 2000)
  }, [])

  const handleDelete = useCallback((key) => {
    const remaining = getSavedModels().filter(m => m.key !== key)
    setSavedModels(remaining)
    refreshModels()
    // Try to remove from IndexedDB too
    tf.io.removeModel(`indexeddb://${key}`).catch(() => {})
  }, [refreshModels])

  return (
    <div className="space-y-3">
      {/* Model name input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="flex-1 px-3 py-2 bg-bg-primary border border-border rounded-lg text-xs font-mono text-text-primary focus:border-border-light focus:outline-none"
          placeholder="Model name..."
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-success/10 text-success border border-success/20 hover:bg-success/20 transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleExport}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-accent-snake/10 text-accent-snake border border-accent-snake/20 hover:bg-accent-snake/20 transition-colors"
        >
          Export
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-bg-hover text-text-primary border border-border hover:border-border-light transition-colors"
        >
          Import
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {/* Status message */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs px-3 py-1.5 rounded-lg ${
              status.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            }`}
          >
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved models toggle */}
      <button
        onClick={() => { setShowPanel(!showPanel); refreshModels() }}
        className="w-full text-left text-xs text-text-muted hover:text-text-secondary transition-colors flex items-center justify-between px-1 py-1"
      >
        <span>My Saved Models ({savedModels.length})</span>
        <span>{showPanel ? '▾' : '▸'}</span>
      </button>

      {/* Saved models list */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {savedModels.length === 0 ? (
              <p className="text-xs text-text-muted px-1">No saved models yet</p>
            ) : (
              savedModels.map((m) => (
                <div key={m.key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-card border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.gameId} · {m.layers?.length || '?'} layers</p>
                  </div>
                  <button
                    onClick={() => handleLoadArchitecture(m)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-accent-snake/10 text-accent-snake hover:bg-accent-snake/20 transition-colors shrink-0"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleDelete(m.key)}
                    className="px-2 py-1 rounded-lg text-sm text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
