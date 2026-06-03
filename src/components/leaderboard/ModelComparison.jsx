import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatArchitecture } from '../../utils/playbackPolicy.js';

const COLORS = ['#aaffdc', '#6e9bff', '#e966ff', '#f97316', '#eab308'];

export function ModelComparison({ entries, maxPoints = 100, onDismiss }) {
  if (!entries?.length) return null;

  const maxLen = Math.max(
    ...entries.map((e) => (e.rewardHistory ?? []).length),
    1
  );
  const len = Math.min(maxLen, maxPoints);
  const start = Math.max(0, maxLen - len);

  const data = Array.from({ length: len }, (_, i) => {
    const row = { episode: start + i };
    entries.forEach((entry) => {
      const hist = entry.rewardHistory ?? [];
      row[entry.id] = hist[start + i] ?? null;
    });
    return row;
  });

  return (
    <div className="glass-panel mb-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-text-base">
          Comparing {entries.length} models
        </h3>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-text-muted hover:text-text-base"
        >
          Dismiss
        </button>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a38" />
          <XAxis dataKey="episode" tick={{ fill: '#6b6b82', fontSize: 11 }} />
          <YAxis tick={{ fill: '#6b6b82', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: '#13131a',
              border: '1px solid #2a2a38',
            }}
          />
          <Legend />
          {entries.map((entry, idx) => (
            <Line
              key={entry.id}
              type="monotone"
              dataKey={entry.id}
              name={entry.modelName ?? formatArchitecture(entry.architecture)}
              stroke={COLORS[idx % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
