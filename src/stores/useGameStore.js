import { create } from 'zustand';

export const GAMES = [
  {
    id: 'snake',
    name: 'Snake',
    emoji: '🐍',
    accentColor: '#22C55E',
    inputSize: 20,
    outputSize: 4,
    trainingMode: 'rl',
    description: "Classic snake — don't eat yourself",
    tiers: { bronze: 30, silver: 50, gold: 80 },
    solvedThreshold: null,
  },
  {
    id: 'flappy',
    name: 'Flappy Bird',
    emoji: '🐦',
    accentColor: '#F97316',
    inputSize: 6,
    outputSize: 2,
    trainingMode: 'rl',
    description: 'Survive the pipes',
    tiers: { bronze: 5, silver: 15, gold: 30 },
    solvedThreshold: null,
  },
  {
    id: 'cartpole',
    name: 'CartPole',
    emoji: '⚖️',
    accentColor: '#3B82F6',
    inputSize: 4,
    outputSize: 2,
    trainingMode: 'rl',
    description: 'Balance the pole',
    tiers: { bronze: 50, silver: 150, gold: 195 },
    solvedThreshold: 195,
  },
  {
    id: 'twentyfortyeight',
    name: '2048',
    emoji: '🔢',
    accentColor: '#A855F7',
    inputSize: 20,
    outputSize: 4,
    trainingMode: 'rl',
    description: 'Merge tiles to 2048',
    tiers: { bronze: 256, silver: 512, gold: 1024 },
    solvedThreshold: null,
  },
  {
    id: 'chess',
    name: 'Chess',
    emoji: '♟️',
    accentColor: '#EAB308',
    inputSize: 780,
    outputSize: 1,
    trainingMode: 'supervised',
    description: 'Learn position evaluation',
    tiers: { bronze: 0.4, silver: 0.6, gold: 0.8 },
    solvedThreshold: null,
  },
];

export function getGameById(id) {
  return GAMES.find((g) => g.id === id);
}

export function getGameAccentHex(id) {
  const game = getGameById(id);
  return game?.accentColor ?? '#aaffdc';
}

export const useGameStore = create((set) => ({
  activeGameId: 'snake',
  view: 'builder',
  isPlaying: false,
  playbackSpeed: 200,

  setActiveGame: (id) => set({ activeGameId: id, isPlaying: false }),
  setView: (view) => set({ view }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
}));
