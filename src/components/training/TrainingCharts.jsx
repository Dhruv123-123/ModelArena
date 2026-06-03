import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTrainingStore } from '../../stores/useTrainingStore';

const chartStyle = { background: 'transparent' };
const axisStyle = { fill: '#6b6b82', fontSize: 11 };
const gridStroke = '#2a2a38';

function useThrottledTrainingData(intervalMs = 500) {
  const episodeRewards = useTrainingStore((s) => s.episodeRewards);
  const rollingAvg = useTrainingStore((s) => s.rollingAvg);
  const losses = useTrainingStore((s) => s.losses);
  const isTraining = useTrainingStore((s) => s.isTraining);

  const [snapshot, setSnapshot] = useState({
    episodeRewards,
    rollingAvg,
    losses,
  });

  useEffect(() => {
    if (!isTraining) {
      setSnapshot({ episodeRewards, rollingAvg, losses });
      return;
    }
    const id = setInterval(() => {
      setSnapshot({
        episodeRewards: useTrainingStore.getState().episodeRewards,
        rollingAvg: useTrainingStore.getState().rollingAvg,
        losses: useTrainingStore.getState().losses,
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [
    isTraining,
    episodeRewards,
    rollingAvg,
    losses,
    episodeRewards.length,
    losses.length,
    intervalMs,
  ]);

  useEffect(() => {
    if (!isTraining) {
      setSnapshot({ episodeRewards, rollingAvg, losses });
    }
  }, [episodeRewards, rollingAvg, losses, isTraining]);

  return snapshot;
}

export function TrainingCharts() {
  const { episodeRewards, rollingAvg, losses } = useThrottledTrainingData(500);

  const rewardData = useMemo(
    () =>
      episodeRewards.map((reward, episode) => ({
        episode,
        reward,
        avg: rollingAvg[episode] ?? reward,
      })),
    [episodeRewards, rollingAvg]
  );

  const lossData = useMemo(
    () => losses.map((loss, i) => ({ step: i, loss })),
    [losses]
  );

  const empty = episodeRewards.length === 0 && losses.length === 0;

  if (empty) {
    return (
      <div className="glass-panel flex h-[360px] items-center justify-center p-8 text-center text-sm text-text-muted">
        Charts will populate when training starts. Episode rewards and loss
        update in real time.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-panel p-3" style={{ height: 200 }}>
        <p className="mb-2 text-xs font-medium text-text-muted">
          Episode Rewards
        </p>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={rewardData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="episode" stroke={gridStroke} tick={axisStyle} />
            <YAxis stroke={gridStroke} tick={axisStyle} />
            <Tooltip
              contentStyle={{
                background: '#13131a',
                border: '1px solid #2a2a38',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e8e8f0' }}
            />
            <Line
              type="monotone"
              dataKey="reward"
              stroke="#6b6b82"
              strokeWidth={1}
              dot={false}
              name="Reward"
            />
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#aaffdc"
              strokeWidth={2.5}
              dot={false}
              name="20-ep Avg"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-3" style={{ height: 160 }}>
        <p className="mb-2 text-xs font-medium text-text-muted">
          Training Loss
        </p>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={lossData} style={chartStyle}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="step" stroke={gridStroke} tick={axisStyle} />
            <YAxis stroke={gridStroke} tick={axisStyle} />
            <Tooltip
              contentStyle={{
                background: '#13131a',
                border: '1px solid #2a2a38',
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="loss"
              stroke="#e966ff"
              strokeWidth={2}
              dot={false}
              name="Loss"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
