import { create } from 'zustand'

export const GAMES = {
  snake: {
    id: 'snake', name: 'Snake', description: 'Navigate the snake to eat food without hitting walls or yourself',
    difficulty: 'Starter', category: 'Classification', accentColor: 'accent-snake',
    icon: '🐍', inputSize: 20, outputSize: 4,
    actionLabels: ['Up', 'Down', 'Left', 'Right'],
    tiers: { bronze: 30, silver: 50, gold: 80 }, defaultPreset: 'starter',
  },
  flappy: {
    id: 'flappy', name: 'Flappy Bird', description: 'Navigate through pipes by timing your flaps',
    difficulty: 'Intermediate', category: 'Continuous Control', accentColor: 'accent-flappy',
    icon: '🐦', inputSize: 6, outputSize: 2,
    actionLabels: ['No Flap', 'Flap'],
    tiers: { bronze: 10, silver: 25, gold: 50 }, defaultPreset: 'starter',
  },
  cartpole: {
    id: 'cartpole', name: 'CartPole', description: 'Balance a pole on a moving cart',
    difficulty: 'Classic', category: 'RL Benchmark', accentColor: 'accent-cartpole',
    icon: '⚖️', inputSize: 4, outputSize: 2,
    actionLabels: ['Push Left', 'Push Right'],
    solvedThreshold: 195, tiers: { bronze: 100, silver: 150, gold: 195 }, defaultPreset: 'starter',
  },
  twentyfortyeight: {
    id: 'twentyfortyeight', name: '2048', description: 'Merge tiles to reach higher numbers',
    difficulty: 'Intermediate', category: 'Planning', accentColor: 'accent-2048',
    icon: '🔢', inputSize: 20, outputSize: 4,
    actionLabels: ['Up', 'Down', 'Left', 'Right'],
    tiers: { bronze: 512, silver: 1024, gold: 2048 }, defaultPreset: 'starter',
  },
  chess: {
    id: 'chess', name: 'Chess', description: 'Train an evaluation function for minimax search',
    difficulty: 'Advanced', category: 'Strategic Reasoning', accentColor: 'accent-chess',
    icon: '♟️', inputSize: 780, outputSize: 1,
    actionLabels: ['Eval Score'], trainingMode: 'supervised',
    tiers: { bronze: 'beat-random', silver: 'beat-material', gold: 'beat-pst' }, defaultPreset: 'deep',
  },
}

const useGameStore = create((set, get) => ({
  activeGameId: 'snake',
  gameState: null,
  isPlaying: false,
  playbackSpeed: 1,
  view: 'builder',
  setActiveGame: (gameId) => set({ activeGameId: gameId, gameState: null, isPlaying: false }),
  setGameState: (state) => set({ gameState: state }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setView: (view) => set({ view }),
  getActiveGame: () => GAMES[get().activeGameId],
}))

export default useGameStore
