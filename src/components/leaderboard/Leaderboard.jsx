import { motion as M } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import useLeaderboardStore from '../../stores/useLeaderboardStore'
import ModelComparison from './ModelComparison'

function getTier(score, tiers) {
  if (typeof tiers.gold === 'number') {
    if (score >= tiers.gold) return { label: 'Gold', color: '#EAB308', textColor: 'text-warning' }
    if (score >= tiers.silver) return { label: 'Silver', color: '#94A3B8', textColor: 'text-secondary' }
    if (score >= tiers.bronze) return { label: 'Bronze', color: '#CD7F32', textColor: 'text-tertiary' }
  }
  return null
}

function getRankColor(idx) {
  if (idx === 0) return 'text-primary'
  if (idx === 1) return 'text-secondary'
  if (idx === 2) return 'text-tertiary'
  return 'text-text-muted'
}

export default function Leaderboard() {
  const { activeGameId, setView } = useGameStore()
  const game = GAMES[activeGameId]
  const { entries, removeEntry, clearGame } = useLeaderboardStore()
  const gameEntries = entries[activeGameId] || []
  const champion = gameEntries[0]

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Top: Champion Spotlight */}
        <section className="xl:col-span-12">
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-text-primary uppercase mb-2">
                {game.name} Leaderboard
              </h1>
              <p className="font-label text-[11px] uppercase tracking-[0.3em] text-text-secondary flex items-center">
                <span className="w-1 h-4 bg-primary mr-3" />
                Local Rankings — Trained Neural Weights
              </p>
            </div>
            {gameEntries.length > 0 && (
              <button
                onClick={() => clearGame(activeGameId)}
                className="font-label text-[10px] uppercase tracking-widest text-text-muted hover:text-error transition-colors px-4 py-2 border border-border rounded-lg hover:border-error/30"
              >
                Clear All
              </button>
            )}
          </header>

          {/* Tier Targets */}
          {typeof game.tiers.gold === 'number' && (
            <div className="flex gap-3 mb-8">
              {Object.entries(game.tiers).map(([tier, target]) => {
                const colors = { gold: 'primary', silver: 'secondary', bronze: 'tertiary' }
                const c = colors[tier] || 'primary'
                return (
                  <div key={tier} className={`flex-1 bg-${c}/5 border border-${c}/20 rounded-lg p-4 text-center`}>
                    <p className="font-label text-[9px] uppercase tracking-widest text-text-muted mb-1 capitalize">{tier}</p>
                    <p className="font-mono text-lg font-bold text-text-primary">{target}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Champion Card */}
          {champion && (
            <div className="champion-glow relative overflow-hidden rounded-xl border border-primary/20 bg-bg-elevated p-8 flex flex-col md:flex-row gap-8 items-center mb-8">
              {/* Mesh glow background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none mesh-bg" />

              <div className="relative z-10 w-full md:w-1/4 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full" />
                  <div className="relative w-32 h-32 rounded-xl bg-bg-card border-2 border-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                  </div>
                  <div className="absolute -top-3 -left-3 bg-primary text-on-primary font-black px-3 py-1 rounded-full text-lg shadow-lg">#1</div>
                </div>
              </div>

              <div className="relative z-10 flex-1 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/20 rounded-full">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full status-pulse" />
                  <span className="text-[10px] font-label font-black uppercase tracking-[0.2em] text-primary">Champion</span>
                </div>

                <h2 className="text-3xl md:text-4xl font-black text-text-primary tracking-tighter uppercase">
                  {champion.modelName}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Architecture', value: champion.architecture, mono: true },
                    { label: 'Best Score', value: champion.bestScore.toFixed(1) },
                    { label: 'Episodes', value: champion.episodes.toLocaleString() },
                    { label: 'Layers', value: champion.layerCount },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-bg-hover p-3 rounded-lg border border-border">
                      <p className="font-label text-[9px] uppercase tracking-widest text-text-muted mb-1">{stat.label}</p>
                      <p className={`font-mono text-sm font-bold ${stat.mono ? 'text-primary text-xs' : 'text-text-primary'}`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex flex-wrap gap-3">
                  <button
                    onClick={() => setView('play')}
                    className="px-6 py-3 bg-primary text-on-primary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:brightness-110 transition-all neural-glow flex items-center gap-2"
                  >
                    Watch Replay
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                  </button>
                  <button
                    onClick={() => setView('builder')}
                    className="px-6 py-3 border border-border text-text-secondary font-label text-[10px] uppercase tracking-[0.2em] font-black rounded-lg hover:bg-bg-hover transition-all"
                  >
                    View Architecture
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Left: Rankings Table */}
        <section className="xl:col-span-8 space-y-4">
          {gameEntries.length > 1 && (
            <h3 className="font-label text-[11px] uppercase tracking-[0.3em] text-text-muted mb-4 pl-2">
              Rankings {champion ? '2' : '1'}–{gameEntries.length}
            </h3>
          )}

          {gameEntries.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-border">
              <span className="material-symbols-outlined text-text-ghost text-5xl mb-4 block">leaderboard</span>
              <p className="text-text-muted text-sm">No models trained yet</p>
              <p className="text-text-ghost text-xs mt-1">Train a model to see it here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left font-label text-[9px] uppercase tracking-[0.25em] text-text-muted">
                    <th className="pb-3 pl-4">Rank</th>
                    <th className="pb-3">Model</th>
                    <th className="pb-3">Architecture</th>
                    <th className="pb-3">Episodes</th>
                    <th className="pb-3 pr-4 text-right">Score</th>
                    <th className="pb-3 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {gameEntries.slice(champion ? 1 : 0).map((entry, relIdx) => {
                    const idx = champion ? relIdx + 1 : relIdx
                    const tier = getTier(entry.bestScore, game.tiers)
                    return (
                      <M.tr
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: relIdx * 0.04 }}
                        className="bg-bg-hover hover:bg-bg-active transition-all group cursor-pointer"
                      >
                        <td className="py-4 pl-4 rounded-l-xl border-l border-y border-border group-hover:border-primary/30">
                          <span className={`font-black text-lg ${getRankColor(idx)}`}>
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="py-4">
                          <div>
                            <p className="font-bold text-text-primary text-sm tracking-tight mb-0.5">{entry.modelName}</p>
                            {tier && (
                              <p className="text-[9px] font-mono uppercase tracking-widest" style={{ color: tier.color }}>
                                {tier.label} Tier
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <span className="font-mono text-[10px] text-text-muted bg-bg-hover px-2 py-1 rounded-full border border-border">
                            {entry.architecture}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="font-mono text-[10px] text-text-muted">{entry.episodes}</span>
                        </td>
                        <td className="py-4 pr-4 text-right rounded-r-xl border-r border-y border-border group-hover:border-primary/30">
                          <span className="font-mono font-bold text-text-primary text-lg tracking-tighter">
                            {entry.bestScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-4 pr-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); removeEntry(activeGameId, entry.id) }}
                            className="text-text-ghost hover:text-error transition-colors text-sm opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </td>
                      </M.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right: Model Comparison */}
        <aside className="xl:col-span-4 space-y-6">
          <div className="glass-panel rounded-xl p-6">
            <ModelComparison />
          </div>

          {/* Quick Action */}
          <div className="bg-tertiary/5 rounded-xl p-6 border border-tertiary/10">
            <div className="flex items-center gap-3 mb-4">
              <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              <h4 className="font-label text-[11px] font-black uppercase tracking-[0.3em] text-tertiary">Quick Actions</h4>
            </div>
            <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">Train a new model to challenge the leaderboard.</p>
            <div className="space-y-2">
              <button
                onClick={() => setView('train')}
                className="w-full flex items-center justify-between p-3 bg-bg-primary/40 rounded-lg border border-border hover:border-tertiary/30 transition-all group"
              >
                <span className="font-mono text-[10px] text-text-primary font-bold tracking-widest">START TRAINING</span>
                <span className="material-symbols-outlined text-tertiary text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
              <button
                onClick={() => setView('builder')}
                className="w-full flex items-center justify-between p-3 bg-bg-primary/40 rounded-lg border border-border hover:border-tertiary/30 transition-all group"
              >
                <span className="font-mono text-[10px] text-text-primary font-bold tracking-widest">BUILD NEW MODEL</span>
                <span className="material-symbols-outlined text-tertiary text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
