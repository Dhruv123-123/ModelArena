import { create } from 'zustand'

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem('modelarena-leaderboard')
    return data ? JSON.parse(data) : {}
  } catch { return {} }
}

const saveToStorage = (entries) => {
  localStorage.setItem('modelarena-leaderboard', JSON.stringify(entries))
}

const useLeaderboardStore = create((set, get) => ({
  entries: loadFromStorage(),
  addEntry: (gameId, entry) => set((state) => {
    const gameEntries = state.entries[gameId] || []
    const newEntry = { ...entry, id: crypto.randomUUID(), timestamp: Date.now() }
    const updated = { ...state.entries, [gameId]: [...gameEntries, newEntry].sort((a, b) => b.bestScore - a.bestScore) }
    saveToStorage(updated)
    return { entries: updated }
  }),
  removeEntry: (gameId, entryId) => set((state) => {
    const updated = { ...state.entries, [gameId]: (state.entries[gameId] || []).filter((e) => e.id !== entryId) }
    saveToStorage(updated)
    return { entries: updated }
  }),
  getGameEntries: (gameId) => get().entries[gameId] || [],
  clearGame: (gameId) => set((state) => {
    const updated = { ...state.entries, [gameId]: [] }
    saveToStorage(updated)
    return { entries: updated }
  }),
}))

export default useLeaderboardStore
