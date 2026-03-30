import * as tf from '@tensorflow/tfjs'

export async function saveModel(model, gameId, modelName) {
  const key = `modelarena-${gameId}-${modelName.replace(/\s+/g, '-').toLowerCase()}`
  await model.save(`indexeddb://${key}`)
  return key
}

/** Stable key for the last trained chess model in this browser session */
export async function saveChessSessionWeights(model) {
  const key = 'modelarena-chess-_session_'
  await model.save(`indexeddb://${key}`)
  return key
}

export async function loadModel(key) {
  return await tf.loadLayersModel(`indexeddb://${key}`)
}

export async function exportModel(model, modelName, meta = {}) {
  await model.save(tf.io.withSaveHandler(async (artifacts) => {
    const weightsArray = new Uint8Array(artifacts.weightData)
    const exportData = {
      modelTopology: artifacts.modelTopology,
      weightSpecs: artifacts.weightSpecs,
      weightData: Array.from(weightsArray),
      name: modelName,
      exportedAt: Date.now(),
      gameId: meta.gameId ?? null,
      layers: meta.layers ?? null,
    }
    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${modelName.replace(/\s+/g, '-').toLowerCase()}.modelarena.json`
    a.click()
    URL.revokeObjectURL(url)
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: 'JSON' } }
  }))
}

/** Export in standard TF.js format (model.json + weights.bin) */
export async function exportStandardTfjsModel(model, modelName) {
  const fileName = modelName.replace(/\s+/g, '-').toLowerCase()
  await model.save(`downloads://${fileName}`)
}

export async function importModel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const weightData = new Uint8Array(data.weightData).buffer
        const model = await tf.loadLayersModel(tf.io.fromMemory(data.modelTopology, data.weightSpecs, weightData))
        resolve({
          model,
          name: data.name,
          gameId: data.gameId,
          layers: data.layers,
        })
      } catch (err) { reject(err) }
    }
    reader.readAsText(file)
  })
}
