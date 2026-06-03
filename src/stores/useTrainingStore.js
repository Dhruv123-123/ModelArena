import { create } from 'zustand';

function computeRollingAvg(episodeRewards, window = 20) {
  if (episodeRewards.length === 0) return [];
  const result = [];
  for (let i = 0; i < episodeRewards.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = episodeRewards.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }
  return result;
}

const defaultHyperparams = {
  learningRate: 0.001,
  batchSize: 32,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  epsilonMin: 0.01,
  replayBufferSize: 10000,
  gamma: 0.99,
  targetUpdateFreq: 100,
  maxEpisodes: 1000,
  maxStepsPerEpisode: 500,
};

export const useTrainingStore = create((set, get) => ({
  isTraining: false,
  isPaused: false,
  currentEpisode: 0,
  currentStep: 0,
  epsilon: 1.0,
  bestScore: -Infinity,
  episodeRewards: [],
  losses: [],
  rollingAvg: [],
  hyperparams: { ...defaultHyperparams },

  startTraining: () =>
    set({
      isTraining: true,
      isPaused: false,
      currentEpisode: 0,
      currentStep: 0,
      epsilon: get().hyperparams.epsilon,
      episodeRewards: [],
      losses: [],
      rollingAvg: [],
      bestScore: -Infinity,
    }),

  stopTraining: () => set({ isTraining: false, isPaused: false }),

  pauseTraining: () => set({ isPaused: true }),

  resumeTraining: () => set({ isPaused: false }),

  setCurrentEpisode: (n) => set({ currentEpisode: n }),

  setCurrentStep: (n) => set({ currentStep: n }),

  setEpsilon: (e) => set({ epsilon: e }),

  addEpisodeReward: (score) =>
    set((state) => {
      const episodeRewards = [...state.episodeRewards, score];
      const rollingAvg = computeRollingAvg(episodeRewards);
      const bestScore =
        score > state.bestScore ? score : state.bestScore;
      return { episodeRewards, rollingAvg, bestScore };
    }),

  addLoss: (loss) =>
    set((state) => ({ losses: [...state.losses, loss] })),

  setHyperparam: (key, val) =>
    set((state) => ({
      hyperparams: { ...state.hyperparams, [key]: val },
    })),

  resetMetrics: () =>
    set({
      currentEpisode: 0,
      currentStep: 0,
      episodeRewards: [],
      losses: [],
      rollingAvg: [],
      bestScore: -Infinity,
    }),
}));
