import { useMemo, useState } from 'react';
import { GAMES, getGameById, useGameStore } from '../../stores/useGameStore';
import { useLeaderboardStore } from '../../stores/useLeaderboardStore';
import {
  formatArchitecture,
  relativeTime,
  scoreTier,
  TIER_COLORS,
} from '../../utils/playbackPolicy.js';
import { ModelComparison } from './ModelComparison.jsx';
import { ModelExport } from './ModelExport.jsx';

const FILTERS = [{ id: 'all', name: 'All', emoji: '🏆' }, ...GAMES];

function rankLabel(rank) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}

export function Leaderboard() {
  const setView = useGameStore((s) => s.setView);
  const entries = useLeaderboardStore((s) => s.entries);
  const removeEntry = useLeaderboardStore((s) => s.removeEntry);

  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(new Set());
  const [expandedExport, setExpandedExport] = useState(null);

  const rows = useMemo(() => {
    const all = [];
    for (const [gameId, list] of Object.entries(entries)) {
      if (filter !== 'all' && gameId !== filter) continue;
      (list ?? []).forEach((e) => all.push({ ...e, gameId }));
    }
    return all.sort((a, b) => b.bestScore - a.bestScore);
  }, [entries, filter]);

  const compareEntries = rows.filter((r) => selected.has(r.id));

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors ${
                filter === f.id
                  ? 'border-current text-text-base'
                  : 'border-transparent text-text-muted'
              }`}
              style={
                filter === f.id && f.id !== 'all'
                  ? { borderColor: getGameById(f.id)?.accentColor, color: getGameById(f.id)?.accentColor }
                  : filter === f.id
                    ? { borderColor: '#aaffdc', color: '#aaffdc' }
                    : undefined
              }
            >
              <span>{f.emoji}</span>
              <span className="hidden sm:inline">{f.name}</span>
            </button>
          ))}
        </div>

        {compareEntries.length >= 2 && (
          <ModelComparison
            entries={compareEntries}
            onDismiss={() => setSelected(new Set())}
          />
        )}

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl opacity-40">🏆</span>
            <p className="mt-4 text-lg text-text-base">
              No runs yet — train a model and it&apos;ll appear here
            </p>
            <button
              type="button"
              onClick={() => setView('train')}
              className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-black"
            >
              Go to Training →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-text-muted">
                  <th className="p-2">Cmp</th>
                  <th className="p-2">#</th>
                  <th className="p-2">Model</th>
                  <th className="p-2">Score</th>
                  <th className="p-2">Architecture</th>
                  <th className="p-2">Episodes</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const game = getGameById(row.gameId);
                  const tier = scoreTier(row.bestScore, game);
                  const tierColor = tier ? TIER_COLORS[tier] : '#e8e8f0';
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 hover:bg-bg-elevated/30"
                    >
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleSelect(row.id)}
                        />
                      </td>
                      <td className="p-2 font-mono-nums">{rankLabel(idx + 1)}</td>
                      <td className="p-2 font-medium">{row.modelName}</td>
                      <td className="p-2">
                        <span
                          className="font-mono-nums text-lg font-bold"
                          style={{ color: tierColor }}
                        >
                          {row.bestScore}
                        </span>
                      </td>
                      <td className="max-w-[140px] truncate p-2 text-xs text-text-muted">
                        {formatArchitecture(row.architecture)}
                      </td>
                      <td className="p-2 font-mono-nums">{row.episodes}</td>
                      <td className="p-2 text-xs text-text-muted">
                        {relativeTime(row.timestamp)}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <ModelExport
                            entry={row}
                            expanded={expandedExport === row.id}
                            onToggle={() =>
                              setExpandedExport(
                                expandedExport === row.id ? null : row.id
                              )
                            }
                          />
                          <button
                            type="button"
                            onClick={() => removeEntry(row.gameId, row.id)}
                            className="text-red-400 hover:underline"
                            aria-label="Delete"
                          >
                            ×
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
