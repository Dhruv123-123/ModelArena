import { useState, useRef, useCallback } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'
import * as tf from '@tensorflow/tfjs'
import useModelStore from '../../stores/useModelStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import { buildModel } from '../../ml/ModelBuilder'
import { exportModel, importModel, saveModel, exportStandardTfjsModel } from '../../ml/modelSerializer'

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
  const setActiveGame = useGameStore((s) => s.setActiveGame)
  const setSavedWeightsKey = useModelStore((s) => s.setSavedWeightsKey)
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
      const outputSize = GAMES[activeGameId]?.outputSize ?? 4
      const model = buildModel(layers, activeGameId, outputSize)
      model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
      const key = await saveModel(model, activeGameId, modelName)
      model.dispose()
      setSavedWeightsKey(key)

      const entry = {
        key,
        name: modelName,
        gameId: activeGameId,
        layers: layers.map((l) => ({
          type: l.type, units: l.units, filters: l.filters, activation: l.activation, rate: l.rate,
          kernelSize: l.kernelSize, padding: l.padding,
        })),
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
  }, [layers, modelName, activeGameId, refreshModels, setSavedWeightsKey])

  const handleExport = useCallback(async () => {
    if (layers.length === 0) return setStatus({ type: 'error', msg: 'No layers to export' })
    try {
      const outputSize = GAMES[activeGameId]?.outputSize ?? 4
      const model = buildModel(layers, activeGameId, outputSize)
      model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
      const layerMeta = layers.map((l) => ({
        type: l.type, units: l.units, filters: l.filters, activation: l.activation, rate: l.rate,
        kernelSize: l.kernelSize, padding: l.padding,
      }))
      await exportModel(model, modelName, { gameId: activeGameId, layers: layerMeta })
      model.dispose()
      setStatus({ type: 'success', msg: 'Exported as JSON!' })
      setTimeout(() => setStatus(null), 2000)
    } catch (err) {
      setStatus({ type: 'error', msg: `Export failed: ${err.message}` })
    }
  }, [layers, modelName, activeGameId])

  const handleDownloadStandard = useCallback(async () => {
    if (layers.length === 0) return setStatus({ type: 'error', msg: 'No layers to download' })
    try {
      const outputSize = GAMES[activeGameId]?.outputSize ?? 4
      const model = buildModel(layers, activeGameId, outputSize)
      model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
      await exportStandardTfjsModel(model, modelName)
      model.dispose()
      setStatus({ type: 'success', msg: 'Started download (model.json + weights.bin)' })
      setTimeout(() => setStatus(null), 3000)
    } catch (err) {
      setStatus({ type: 'error', msg: `Download failed: ${err.message}` })
    }
  }, [layers, modelName, activeGameId])

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { model, name, gameId: fileGameId, layers: importedLayers } = await importModel(file)
      const store = useModelStore.getState()
      const gid = fileGameId && GAMES[fileGameId] ? fileGameId : useGameStore.getState().activeGameId
      if (fileGameId && GAMES[fileGameId]) setActiveGame(fileGameId)

      if (importedLayers?.length) {
        store.clearAll()
        importedLayers.forEach((l) => store.addLayer(l.type))
        const currentLayers = useModelStore.getState().layers
        importedLayers.forEach((l, i) => {
          if (currentLayers[i]) store.updateLayer(currentLayers[i].id, l)
        })
      }

      model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
      const saveName = (name || 'imported').slice(0, 80)
      const key = await saveModel(model, gid, saveName)
      model.dispose()
      store.setModelName(saveName)
      store.setSavedWeightsKey(key)

      const entry = {
        key,
        name: saveName,
        gameId: gid,
        layers: importedLayers || store.layers.map((l) => ({
          type: l.type, units: l.units, filters: l.filters, activation: l.activation, rate: l.rate,
          kernelSize: l.kernelSize, padding: l.padding,
        })),
        savedAt: Date.now(),
      }
      const existing = getSavedModels().filter((m) => m.key !== key)
      existing.unshift(entry)
      setSavedModels(existing)
      refreshModels()

      setStatus({ type: 'success', msg: `Imported "${saveName}" — weights ready` })
      setTimeout(() => setStatus(null), 2500)
    } catch (err) {
      setStatus({ type: 'error', msg: `Import failed: ${err.message}` })
    }
    e.target.value = ''
  }, [refreshModels, setActiveGame])

  const handleLoadSaved = useCallback(async (saved) => {
    const store = useModelStore.getState()
    if (saved.gameId && GAMES[saved.gameId]) setActiveGame(saved.gameId)
    if (saved.layers?.length) {
      store.clearAll()
      saved.layers.forEach((l) => store.addLayer(l.type))
      const currentLayers = useModelStore.getState().layers
      saved.layers.forEach((l, i) => {
        if (currentLayers[i]) store.updateLayer(currentLayers[i].id, l)
      })
    }
    store.setModelName(saved.name)
    store.setSavedWeightsKey(saved.key)
    try {
      await tf.loadLayersModel(`indexeddb://${saved.key}`)
      setStatus({ type: 'success', msg: `Loaded "${saved.name}" (architecture + weights)` })
    } catch {
      setStatus({ type: 'success', msg: `Loaded "${saved.name}" — weights missing; train or re-save` })
    }
    setTimeout(() => setStatus(null), 2500)
  }, [setActiveGame])

  const handleDelete = useCallback((key) => {
    const remaining = getSavedModels().filter(m => m.key !== key)
    setSavedModels(remaining)
    refreshModels()
    tf.io.removeModel(`indexeddb://${key}`).catch(() => {})
  }, [refreshModels])

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex gap-2">
        <M.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="flex-1 px-3 py-2 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          Save
        </M.button>
        <M.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          className="flex-1 px-3 py-2 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">upload</span>
          Export
        </M.button>
        <M.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-3 py-2 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-bg-hover text-text-primary border border-border hover:border-primary/20 transition-colors flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Import
        </M.button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      <M.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadStandard}
        className="w-full px-3 py-2 rounded-lg text-[10px] font-label uppercase tracking-[0.15em] font-black bg-tertiary/10 text-tertiary border border-tertiary/20 hover:bg-tertiary/20 transition-colors flex items-center justify-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">cloud_download</span>
        Download for TF.js (External Use)
      </M.button>

      {/* Status message */}
      <AnimatePresence>
        {status && (
          <M.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-[11px] font-mono px-3 py-2 rounded-lg ${
              status.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-error/10 text-error border border-error/20'
            }`}
          >
            {status.msg}
          </M.div>
        )}
      </AnimatePresence>

      {/* Saved models toggle */}
      <M.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => { setShowPanel(!showPanel); refreshModels() }}
        className="w-full text-left text-[10px] font-label uppercase tracking-[0.15em] text-text-muted hover:text-text-secondary transition-colors flex items-center justify-between px-1 py-1"
      >
        <span>My Saved Models ({savedModels.length})</span>
        <span className="material-symbols-outlined text-sm">{showPanel ? 'expand_less' : 'expand_more'}</span>
      </M.button>

      {/* Saved models list */}
      <AnimatePresence>
        {showPanel && (
          <M.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {savedModels.length === 0 ? (
              <p className="text-[11px] text-text-ghost px-1 font-label">No saved models yet</p>
            ) : (
              savedModels.map((m) => (
                <div key={m.key} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-bg-hover border border-border group hover:border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-text-primary truncate font-label">{m.name}</p>
                    <p className="text-[10px] text-text-muted font-mono">{m.gameId} · {m.layers?.length || '?'} layers</p>
                  </div>
                  <M.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleLoadSaved(m)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-label uppercase tracking-wider font-black bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                  >
                    Load
                  </M.button>
                  <M.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDelete(m.key)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </M.button>
                </div>
              ))
            )}
          </M.div>
        )}
      </AnimatePresence>
    </div>
  )
}
