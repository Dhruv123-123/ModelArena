import { create } from 'zustand'

const useTrainingStore = create((set, get) => ({
  isTraining: false,
  isPaused: false,
  episode: 0,
  step: 0,
  totalSteps: 0,
  epsilon: 1.0,
  episodeRewards: [],
  losses: [],
  rollingAvg: [],
  bestScore: -Infinity,
  stepsPerSecond: 0,
  trainingSpeed: 1,

  hyperparams: {
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
  },

  setHyperparam: (key, value) => set((state) => ({
    hyperparams: { ...state.hyperparams, [key]: value },
  })),
  startTraining: () => set({
    isTraining: true, isPaused: false, episode: 0, step: 0, totalSteps: 0,
    epsilon: 1.0, episodeRewards: [], losses: [], rollingAvg: [], bestScore: -Infinity,
  }),
  pauseTraining: () => set({ isPaused: true }),
  resumeTraining: () => set({ isPaused: false }),
  stopTraining: () => set({ isTraining: false, isPaused: false }),
  addEpisodeReward: (reward) => set((state) => {
    const episodeRewards = [...state.episodeRewards, reward]
    const recent = episodeRewards.slice(-20)
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length
    return {
      episodeRewards, rollingAvg: [...state.rollingAvg, avg],
      bestScore: Math.max(state.bestScore, reward), episode: state.episode + 1,
    }
  }),
  addLoss: (loss) => set((state) => ({ losses: [...state.losses, loss] })),
  setEpsilon: (epsilon) => set({ epsilon }),
  setStep: (step) => set({ step }),
  setTotalSteps: (totalSteps) => set({ totalSteps }),
  setStepsPerSecond: (sps) => set({ stepsPerSecond: sps }),
  setTrainingSpeed: (speed) => set({ trainingSpeed: speed }),
}))

export default useTrainingStore
