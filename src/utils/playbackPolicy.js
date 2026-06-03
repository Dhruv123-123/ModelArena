import { getTf } from './tfLoader.js';

export async function predictGreedyAction(model, stateVector, outputSize) {
  const tf = await getTf();
  const inputSize = stateVector.length;
  return tf.tidy(() => {
    const t = tf.tensor2d([Array.from(stateVector)], [1, inputSize]);
    const q = model.predict(t);
    return q.argMax(1).dataSync()[0] % outputSize;
  });
}

export async function predictQValues(model, stateVector) {
  const tf = await getTf();
  const inputSize = stateVector.length;
  return tf.tidy(() => {
    const t = tf.tensor2d([Array.from(stateVector)], [1, inputSize]);
    const q = model.predict(t);
    return Array.from(q.dataSync());
  });
}

export function createChessEvalFn(model) {
  return async (engine) => {
    const vec = engine.getStateVector();
    const tf = await getTf();
    return tf.tidy(() => {
      const t = tf.tensor2d([Array.from(vec)], [1, vec.length]);
      const out = model.predict(t);
      return out.dataSync()[0];
    });
  };
}

export function formatArchitecture(architecture) {
  if (typeof architecture === 'string') return architecture;
  if (Array.isArray(architecture)) {
    if (typeof architecture[0] === 'string') return architecture.join('→');
    return architecture.map((l) => l.type ?? l).join('→');
  }
  return '—';
}

export function relativeTime(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export function scoreTier(score, game) {
  if (!game?.tiers) return null;
  const { bronze, silver, gold } = game.tiers;
  if (score >= gold) return 'gold';
  if (score >= silver) return 'silver';
  if (score >= bronze) return 'bronze';
  return null;
}

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};
