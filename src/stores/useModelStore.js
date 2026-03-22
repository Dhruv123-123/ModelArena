import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

const LAYER_DEFAULTS = {
  dense: { type: 'dense', units: 64, activation: 'relu' },
  conv2d: { type: 'conv2d', filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' },
  dropout: { type: 'dropout', rate: 0.2 },
  batchnorm: { type: 'batchnorm' },
  flatten: { type: 'flatten' },
  activation: { type: 'activation', activation: 'relu' },
}

const PRESETS = {
  starter: {
    name: 'Starter (2-layer)',
    layers: [
      { type: 'dense', units: 32, activation: 'relu' },
      { type: 'dense', units: 32, activation: 'relu' },
    ],
  },
  deep: {
    name: 'Deep (5-layer)',
    layers: [
      { type: 'dense', units: 128, activation: 'relu' },
      { type: 'dense', units: 128, activation: 'relu' },
      { type: 'dropout', rate: 0.2 },
      { type: 'dense', units: 64, activation: 'relu' },
      { type: 'dense', units: 64, activation: 'relu' },
    ],
  },
  wide: {
    name: 'Wide (256-unit)',
    layers: [
      { type: 'dense', units: 256, activation: 'relu' },
      { type: 'dropout', rate: 0.3 },
      { type: 'dense', units: 256, activation: 'relu' },
    ],
  },
  cnn: {
    name: 'CNN',
    layers: [
      { type: 'conv2d', filters: 32, kernelSize: 3, activation: 'relu', padding: 'same' },
      { type: 'conv2d', filters: 64, kernelSize: 3, activation: 'relu', padding: 'same' },
      { type: 'flatten' },
      { type: 'dense', units: 128, activation: 'relu' },
      { type: 'dropout', rate: 0.3 },
    ],
  },
}

const useModelStore = create((set, get) => ({
  layers: [],
  modelName: 'My Model',
  selectedLayerId: null,
  shapeErrors: [],

  addLayer: (type) => {
    const defaults = LAYER_DEFAULTS[type]
    if (!defaults) return
    set((state) => ({ layers: [...state.layers, { ...defaults, id: uuidv4() }] }))
  },
  removeLayer: (id) => set((state) => ({
    layers: state.layers.filter((l) => l.id !== id),
    selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
  })),
  updateLayer: (id, updates) => set((state) => ({
    layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
  })),
  reorderLayers: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.layers)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return { layers: result }
  }),
  selectLayer: (id) => set({ selectedLayerId: id }),
  loadPreset: (presetKey) => {
    const preset = PRESETS[presetKey]
    if (!preset) return
    set({ layers: preset.layers.map((l) => ({ ...l, id: uuidv4() })), selectedLayerId: null })
  },
  setModelName: (name) => set({ modelName: name }),
  setShapeErrors: (errors) => set({ shapeErrors: errors }),
  clearAll: () => set({ layers: [], selectedLayerId: null, shapeErrors: [] }),
  getPresets: () => PRESETS,
}))

export default useModelStore
