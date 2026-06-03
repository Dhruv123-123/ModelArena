import * as tf from '@tensorflow/tfjs';

const SAVED_MODELS_KEY = 'modelarena-saved-models';

function getMetaList() {
  try {
    const raw = localStorage.getItem(SAVED_MODELS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setMetaList(meta) {
  localStorage.setItem(SAVED_MODELS_KEY, JSON.stringify(meta));
}

export async function saveModel(model, gameId, name, extra = {}) {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const key = `indexeddb://modelarena-${gameId}-${slug}`;
  await model.save(key);
  const meta = getMetaList();
  meta.push({
    key,
    gameId,
    name,
    timestamp: Date.now(),
    layers: extra.layers ?? [],
    paramCount: extra.paramCount ?? 0,
  });
  setMetaList(meta);
  return key;
}

export async function loadModel(key) {
  return tf.loadLayersModel(key);
}

export async function exportStandardTfjsModel(model, filename) {
  await model.save(`downloads://${filename}`);
}

export async function exportModel(model, filename) {
  const topology = model.toJSON(undefined, false);
  const weights = model.getWeights();
  const weightData = weights.map((w) => Array.from(w.dataSync()));
  const weightSpecs = weights.map((w) => ({
    name: w.name,
    shape: w.shape,
    dtype: w.dtype,
  }));
  const json = JSON.stringify({
    topology,
    weightData,
    weightSpecs,
    version: '1.0',
  });
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importModel(file) {
  const text = await file.text();
  const { topology, weightData, weightSpecs } = JSON.parse(text);
  const flat = weightData.flat();
  const buffer = new Float32Array(flat).buffer;
  const modelTopology =
    typeof topology === 'string' ? JSON.parse(topology) : topology;
  return tf.loadLayersModel(
    tf.io.fromMemory(modelTopology, weightSpecs, buffer)
  );
}

export async function saveChessModel(model) {
  return saveModel(model, 'chess', '_session_');
}

export function removeModelFromMeta(key) {
  const meta = getMetaList().filter((m) => m.key !== key);
  setMetaList(meta);
  return meta;
}

export function saveArchitectureMeta(entry) {
  const meta = getMetaList();
  meta.push({ ...entry, timestamp: Date.now() });
  setMetaList(meta);
}

export function getSavedModelsMeta() {
  return getMetaList();
}
