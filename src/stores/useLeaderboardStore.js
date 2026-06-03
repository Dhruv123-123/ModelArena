import { create } from 'zustand';

const LEADERBOARD_KEY = 'modelarena-leaderboard';
const MAX_ENTRIES_PER_GAME = 50;

function sortEntries(entries) {
  return [...entries].sort((a, b) => b.bestScore - a.bestScore);
}

function persistEntries(entries) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export const useLeaderboardStore = create((set) => {
  const initialEntries = loadFromStorage();

  return {
    entries: initialEntries,

    addEntry: (entry) => {
      const { gameId } = entry;
      set((state) => {
        const gameEntries = state.entries[gameId] ?? [];
        const updated = sortEntries([...gameEntries, entry]).slice(
          0,
          MAX_ENTRIES_PER_GAME
        );
        const entries = { ...state.entries, [gameId]: updated };
        persistEntries(entries);
        return { entries };
      });
    },

    removeEntry: (gameId, id) => {
      set((state) => {
        const gameEntries = (state.entries[gameId] ?? []).filter(
          (e) => e.id !== id
        );
        const entries = { ...state.entries, [gameId]: gameEntries };
        persistEntries(entries);
        return { entries };
      });
    },

    clearGame: (gameId) => {
      set((state) => {
        const entries = { ...state.entries };
        delete entries[gameId];
        persistEntries(entries);
        return { entries };
      });
    },

    loadLeaderboard: () => set({ entries: loadFromStorage() }),
  };
});
