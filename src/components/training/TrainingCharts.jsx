import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import useTrainingStore from '../../stores/useTrainingStore'

const chartStyle = {
  background: 'transparent',
  fontSize: 11,
  fontFamily: 'JetBrains Mono',
}

function MiniChart({ title, data, dataKey, color, yDomain }) {
  return (
    <div className="rounded-xl p-4 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3 font-medium">{title}</p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} style={chartStyle}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="idx" tick={{ fill: '#505068', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} />
            <YAxis domain={yDomain} tick={{ fill: '#505068', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} width={40} />
            <Tooltip
              contentStyle={{ background: '#0D0D14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
              labelStyle={{ color: '#8A8AA3' }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${dataKey})`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function TrainingCharts() {
  const { episodeRewards, rollingAvg, losses } = useTrainingStore()

  const rewardData = episodeRewards.map((r, i) => ({ idx: i, reward: r, avg: rollingAvg[i] || 0 }))
  const lossData = losses.slice(-200).map((l, i) => ({ idx: i, loss: l }))
  const epsilonData = episodeRewards.map((_, i) => ({
    idx: i,
    epsilon: Math.max(0.01, Math.pow(0.995, i)),
  }))

  return (
    <div className="space-y-4">
      {/* Reward chart with rolling average */}
      <div className="rounded-xl p-4 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3 font-medium">Episode Reward</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rewardData} style={chartStyle}>
              <defs>
                <linearGradient id="grad-reward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="idx" tick={{ fill: '#505068', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} />
              <YAxis tick={{ fill: '#505068', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.04)' }} width={45} />
              <Tooltip contentStyle={{ background: '#0D0D14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="reward" stroke="#22C55E" fill="url(#grad-reward)" strokeWidth={1} dot={false} opacity={0.5} />
              <Line type="monotone" dataKey="avg" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MiniChart title="Loss" data={lossData} dataKey="loss" color="#EF4444" />
        <MiniChart title="Epsilon" data={epsilonData} dataKey="epsilon" color="#8B5CF6" yDomain={[0, 1]} />
      </div>
    </div>
  )
}
