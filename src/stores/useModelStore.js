import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const LAYER_DEFAULTS = {
  dense: { type: 'dense', units: 64, activation: 'relu' },
  conv2d: {
    type: 'conv2d',
    filters: 32,
    kernelSize: 3,
    padding: 'same',
    activation: 'relu',
  },
  dropout: { type: 'dropout', rate: 0.2 },
  batchnorm: { type: 'batchnorm' },
  flatten: { type: 'flatten' },
  activation: { type: 'activation', activation: 'relu' },
};

function layerFromTemplate(template) {
  const defaults = LAYER_DEFAULTS[template.type] ?? {};
  return { id: uuidv4(), ...defaults, ...template };
}

export const PRESETS = {
  starter: [
    { type: 'dense', units: 32, activation: 'relu' },
    { type: 'dense', units: 32, activation: 'relu' },
  ],
  deep: [
    { type: 'dense', units: 128, activation: 'relu' },
    { type: 'dense', units: 128, activation: 'relu' },
    { type: 'dropout', rate: 0.2 },
    { type: 'dense', units: 64, activation: 'relu' },
    { type: 'dense', units: 64, activation: 'relu' },
  ],
  wide: [
    { type: 'dense', units: 256, activation: 'relu' },
    { type: 'dropout', rate: 0.2 },
    { type: 'dense', units: 256, activation: 'relu' },
  ],
  cnn: [
    { type: 'conv2d', filters: 32, kernelSize: 3, padding: 'same', activation: 'relu' },
    { type: 'conv2d', filters: 64, kernelSize: 3, padding: 'same', activation: 'relu' },
    { type: 'flatten' },
    { type: 'dense', units: 128, activation: 'relu' },
    { type: 'dropout', rate: 0.2 },
  ],
};

const SAVED_MODELS_KEY = 'modelarena-saved-models';

function presetToLayers(presetKey) {
  const templates = PRESETS[presetKey];
  if (!templates) return [];
  return templates.map(layerFromTemplate);
}

export const useModelStore = create((set) => ({
  layers: [],
  savedWeightsKey: null,
  savedModels: [],

  addLayer: (type) => {
    const defaults = LAYER_DEFAULTS[type];
    if (!defaults) return;
    set((state) => ({
      layers: [...state.layers, { id: uuidv4(), ...defaults }],
    }));
  },

  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
    })),

  updateLayer: (id, patch) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    })),

  reorderLayers: (newOrder) => set({ layers: newOrder }),

  loadPreset: (presetKey) => set({ layers: presetToLayers(presetKey) }),

  clearLayers: () => set({ layers: [] }),

  setSavedWeightsKey: (key) => set({ savedWeightsKey: key }),

  loadSavedModels: () => {
    try {
      const raw = localStorage.getItem(SAVED_MODELS_KEY);
      const savedModels = raw ? JSON.parse(raw) : [];
      set({ savedModels: Array.isArray(savedModels) ? savedModels : [] });
    } catch {
      set({ savedModels: [] });
    }
  },
}));
