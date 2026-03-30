import { useState, useMemo } from 'react'
import { motion as M } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import useLeaderboardStore from '../../stores/useLeaderboardStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'

function alignTwoSeries(a = [], b = []) {
  const n = Math.max(a.length, b.length)
  const rows = []
  for (let i = 0; i < n; i++) {
    rows.push({
      idx: i,
      first: a[i] ?? null,
      second: b[i] ?? null,
    })
  }
  return rows
}

const COMPARISON_COLORS = ['#aaffdc', '#6e9bff']

const tooltipStyle = {
  background: '#19191e',
  border: '1px solid rgba(170, 255, 220, 0.1)',
  borderRadius: 8,
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
}

const axisTickStyle = { fill: '#6B6B88', fontSize: 9 }
const gridStroke = 'rgba(170, 255, 220, 0.04)'

export default function ModelComparison() {
  const { activeGameId } = useGameStore()
  const game = GAMES[activeGameId]

  const entries = useLeaderboardStore((s) => s.entries[activeGameId] || [])
  const [idA, setIdA] = useState('')
  const [idB, setIdB] = useState('')

  const eA = useMemo(() => entries.find((e) => e.id === idA), [entries, idA])
  const eB = useMemo(() => entries.find((e) => e.id === idB), [entries, idB])

  const rewardChartData = useMemo(
    () => alignTwoSeries(eA?.rewardHistory, eB?.rewardHistory),
    [eA, eB],
  )
  const lossChartData = useMemo(
    () => alignTwoSeries(eA?.lossHistory, eB?.lossHistory),
    [eA, eB],
  )

  if (entries.length < 2) {
    return (
      <div className="p-6 text-center">
        <span className="material-symbols-outlined text-text-ghost text-3xl mb-2 block">compare_arrows</span>
        <p className="text-[11px] text-text-muted font-label">Train at least 2 models to compare curves</p>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-secondary text-lg">compare_arrows</span>
        <h3 className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-text-primary">Model Comparison</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1.5 font-black">Model A</p>
          <select
            value={idA}
            onChange={(e) => setIdA(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-xs font-mono text-text-primary focus:border-primary/30 focus:outline-none transition-colors"
          >
            <option value="">Select…</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>{e.modelName} · best {e.bestScore?.toFixed?.(1) ?? e.bestScore}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1.5 font-black">Model B</p>
          <select
            value={idB}
            onChange={(e) => setIdB(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-primary border border-border text-xs font-mono text-text-primary focus:border-primary/30 focus:outline-none transition-colors"
          >
            <option value="">Select…</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>{e.modelName} · best {e.bestScore?.toFixed?.(1) ?? e.bestScore}</option>
            ))}
          </select>
        </div>
      </div>

      {eA && eB && idA !== idB && (rewardChartData.some((r) => r.first != null || r.second != null)) && (
        <div className="rounded-xl p-4 bg-bg-hover border border-border">
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted mb-3 font-black">
            {activeGameId === 'chess' ? 'Training signal (1 − val loss)' : 'Episode reward'}
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rewardChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="idx" tick={axisTickStyle} />
                <YAxis tick={axisTickStyle} width={42} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
                <Line type="monotone" dataKey="first" name={eA.modelName} stroke={COMPARISON_COLORS[0]} dot={false} strokeWidth={2} connectNulls />
                <Line type="monotone" dataKey="second" name={eB.modelName} stroke={COMPARISON_COLORS[1]} dot={false} strokeWidth={2} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {eA && eB && idA !== idB && (lossChartData.some((r) => r.first != null || r.second != null)) && (
        <div className="rounded-xl p-4 bg-bg-hover border border-border">
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted mb-3 font-black">Loss</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lossChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="idx" tick={axisTickStyle} />
                <YAxis tick={axisTickStyle} width={42} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
                <Line type="monotone" dataKey="first" name={eA.modelName} stroke={COMPARISON_COLORS[0]} dot={false} strokeWidth={2} connectNulls opacity={0.85} />
                <Line type="monotone" dataKey="second" name={eB.modelName} stroke="#EF4444" dot={false} strokeWidth={2} connectNulls opacity={0.7} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {eA && eB && idA === idB && (
        <p className="text-[11px] text-text-muted text-center font-label">Pick two different runs to overlay curves</p>
      )}

      {eA && eB && (
        <div className="space-y-3">
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted font-black">Best Score</p>
          {(() => {
            const maxScore = Math.max(Number(eA.bestScore) || 0, Number(eB.bestScore) || 0, 1)
            return [eA, eB].map((entry, i) => (
              <div key={entry.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-text-secondary truncate max-w-[200px] font-label">{entry.modelName}</span>
                  <span className="text-[11px] font-mono font-bold text-text-primary tabular-nums">
                    {typeof entry.bestScore === 'number' ? entry.bestScore.toFixed(1) : entry.bestScore}
                  </span>
                </div>
                <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                  <M.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, ((Number(entry.bestScore) || 0) / maxScore) * 100)}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: COMPARISON_COLORS[i % 2] }}
                  />
                </div>
              </div>
            ))
          })()}
        </div>
      )}

      {typeof game.tiers.gold === 'number' && (
        <div className="space-y-2">
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted font-black">Tier Targets</p>
          {Object.entries(game.tiers).map(([tier, target]) => (
            <div key={tier} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary capitalize font-label text-[11px]">{tier}</span>
              <div className="flex-1 mx-3 border-b border-border border-dashed" />
              <span className="font-mono text-text-primary text-[11px] font-bold">{target}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
