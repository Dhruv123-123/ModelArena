import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import useTrainingStore from '../../stores/useTrainingStore'
import useGameStore from '../../stores/useGameStore'
import { getGameAccentHex } from '../../utils/gameTheme'

const chartStyle = {
  background: 'transparent',
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
}

const tooltipStyle = {
  background: '#19191e',
  border: '1px solid rgba(170, 255, 220, 0.1)',
  borderRadius: 8,
  fontSize: 10,
  fontFamily: "'JetBrains Mono', monospace",
}

const axisTickStyle = { fill: '#6B6B88', fontSize: 9 }
const gridStroke = 'rgba(170, 255, 220, 0.04)'

function MiniChart({ title, data, dataKey, color, yDomain, gradId }) {
  const gid = gradId || dataKey
  return (
    <div className="rounded-xl p-4 bg-bg-hover border border-border">
      <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted mb-3 font-black">{title}</p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} style={chartStyle}>
            <defs>
              <linearGradient id={`grad-${gid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="idx" tick={axisTickStyle} axisLine={{ stroke: gridStroke }} />
            <YAxis domain={yDomain} tick={axisTickStyle} axisLine={{ stroke: gridStroke }} width={40} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6B6B88' }} />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${gid})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function TrainingCharts() {
  const { episodeRewards, rollingAvg, losses } = useTrainingStore()
  const activeGameId = useGameStore((s) => s.activeGameId)
  const accent = getGameAccentHex(activeGameId)
  const avgColor = '#EAB308'

  const rewardData = episodeRewards.map((r, i) => ({ idx: i, reward: r, avg: rollingAvg[i] || 0 }))
  const lossData = losses.slice(-200).map((l, i) => ({ idx: i, loss: l }))
  const epsilonData = episodeRewards.map((_, i) => ({
    idx: i,
    epsilon: Math.max(0.01, Math.pow(0.995, i)),
  }))

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4 bg-bg-hover border border-border">
        <div className="flex items-center justify-between mb-3">
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted font-black">Episode Reward</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
              <span className="text-[9px] font-mono text-text-muted">Raw</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded-full bg-warning" />
              <span className="text-[9px] font-mono text-text-muted">Avg</span>
            </div>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rewardData} style={chartStyle}>
              <defs>
                <linearGradient id="grad-reward-primary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={accent} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="idx" tick={axisTickStyle} axisLine={{ stroke: gridStroke }} />
              <YAxis tick={axisTickStyle} axisLine={{ stroke: gridStroke }} width={45} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="reward" stroke={accent} fill="url(#grad-reward-primary)" strokeWidth={1} dot={false} opacity={0.55} />
              <Line type="monotone" dataKey="avg" stroke={avgColor} strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MiniChart title="Loss" data={lossData} dataKey="loss" color="#EF4444" gradId={`loss-${activeGameId}`} />
        <MiniChart title="Epsilon" data={epsilonData} dataKey="epsilon" color={accent} yDomain={[0, 1]} gradId={`eps-${activeGameId}`} />
      </div>
    </div>
  )
}
