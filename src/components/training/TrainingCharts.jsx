import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import useTrainingStore from '../../stores/useTrainingStore'

const chartStyle = {
  background: 'transparent',
  fontSize: 10,
  fontFamily: 'JetBrains Mono',
}

function MiniChart({ title, data, dataKey, color, yDomain }) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">{title}</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} style={chartStyle}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
            <XAxis dataKey="idx" tick={{ fill: '#5A5A70', fontSize: 9 }} axisLine={{ stroke: '#2A2A3A' }} />
            <YAxis domain={yDomain} tick={{ fill: '#5A5A70', fontSize: 9 }} axisLine={{ stroke: '#2A2A3A' }} width={35} />
            <Tooltip
              contentStyle={{ background: '#151520', border: '1px solid #2A2A3A', borderRadius: 6, fontSize: 10, fontFamily: 'JetBrains Mono' }}
              labelStyle={{ color: '#8888A0' }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function TrainingCharts() {
  const { episodeRewards, rollingAvg, losses, epsilon: currentEpsilon } = useTrainingStore()

  const rewardData = episodeRewards.map((r, i) => ({ idx: i, reward: r, avg: rollingAvg[i] || 0 }))
  const lossData = losses.slice(-200).map((l, i) => ({ idx: i, loss: l }))
  const epsilonData = episodeRewards.map((_, i) => ({
    idx: i,
    epsilon: Math.max(0.01, Math.pow(0.995, i)),
  }))

  return (
    <div className="space-y-3">
      {/* Reward chart with rolling average */}
      <div className="bg-bg-card border border-border rounded-lg p-3">
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2">Episode Reward</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rewardData} style={chartStyle}>
              <defs>
                <linearGradient id="grad-reward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3A" />
              <XAxis dataKey="idx" tick={{ fill: '#5A5A70', fontSize: 9 }} axisLine={{ stroke: '#2A2A3A' }} />
              <YAxis tick={{ fill: '#5A5A70', fontSize: 9 }} axisLine={{ stroke: '#2A2A3A' }} width={40} />
              <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2A2A3A', borderRadius: 6, fontSize: 10 }} />
              <Area type="monotone" dataKey="reward" stroke="#22C55E" fill="url(#grad-reward)" strokeWidth={1} dot={false} opacity={0.5} />
              <Line type="monotone" dataKey="avg" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MiniChart title="Loss" data={lossData} dataKey="loss" color="#EF4444" />
        <MiniChart title="Epsilon (Exploration)" data={epsilonData} dataKey="epsilon" color="#8B5CF6" yDomain={[0, 1]} />
      </div>
    </div>
  )
}
