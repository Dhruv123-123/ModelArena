let tfPromise = null;

export function loadTf() {
  if (!tfPromise) {
    tfPromise = import('@tensorflow/tfjs');
  }
  return tfPromise;
}

export async function getTf() {
  const mod = await loadTf();
  return mod.default ?? mod;
}
