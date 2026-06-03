import { useState } from 'react';
import { useTrainingStore } from '../../stores/useTrainingStore';

export function HyperparamConfig() {
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const hyperparams = useTrainingStore((s) => s.hyperparams);
  const isTraining = useTrainingStore((s) => s.isTraining);
  const setHyperparam = useTrainingStore((s) => s.setHyperparam);

  const disabled = isTraining;

  return (
    <div className="glass-panel space-y-4 p-4">
      <h3 className="text-sm font-bold text-text-base">Hyperparameters</h3>

      <label className="block text-xs text-text-muted">
        Learning Rate: {hyperparams.learningRate}
        <input
          type="range"
          min={0.0001}
          max={0.01}
          step={0.0001}
          value={hyperparams.learningRate}
          disabled={disabled}
          onChange={(e) =>
            setHyperparam('learningRate', Number(e.target.value))
          }
          className="mt-1 w-full"
        />
        <span className="flex justify-between text-[10px]">
          <span>1e-4</span>
          <span>1e-2</span>
        </span>
      </label>

      <label className="block text-xs text-text-muted">
        Batch Size
        <select
          value={hyperparams.batchSize}
          disabled={disabled}
          onChange={(e) =>
            setHyperparam('batchSize', Number(e.target.value))
          }
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-2 py-1.5 text-text-base"
        >
          {[16, 32, 64, 128].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs text-text-muted">
        Epsilon Decay: {hyperparams.epsilonDecay}
        <input
          type="range"
          min={0.99}
          max={0.9999}
          step={0.0001}
          value={hyperparams.epsilonDecay}
          disabled={disabled}
          onChange={(e) =>
            setHyperparam('epsilonDecay', Number(e.target.value))
          }
          className="mt-1 w-full"
        />
      </label>

      <label className="block text-xs text-text-muted">
        Gamma: {hyperparams.gamma}
        <input
          type="range"
          min={0.9}
          max={0.999}
          step={0.001}
          value={hyperparams.gamma}
          disabled={disabled}
          onChange={(e) => setHyperparam('gamma', Number(e.target.value))}
          className="mt-1 w-full"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-text-muted">
          Max Episodes
          <input
            type="number"
            min={1}
            max={10000}
            value={hyperparams.maxEpisodes}
            disabled={disabled}
            onChange={(e) =>
              setHyperparam('maxEpisodes', Number(e.target.value))
            }
            className="mt-1 w-full rounded border border-border bg-bg-elevated px-2 py-1"
          />
        </label>
        <label className="text-xs text-text-muted">
          Max Steps/Ep
          <input
            type="number"
            min={1}
            max={5000}
            value={hyperparams.maxStepsPerEpisode}
            disabled={disabled}
            onChange={(e) =>
              setHyperparam('maxStepsPerEpisode', Number(e.target.value))
            }
            className="mt-1 w-full rounded border border-border bg-bg-elevated px-2 py-1"
          />
        </label>
      </div>

      <label className="block text-xs text-text-muted">
        Target Update Freq
        <input
          type="number"
          min={1}
          max={1000}
          value={hyperparams.targetUpdateFreq}
          disabled={disabled}
          onChange={(e) =>
            setHyperparam('targetUpdateFreq', Number(e.target.value))
          }
          className="mt-1 w-full rounded border border-border bg-bg-elevated px-2 py-1"
        />
      </label>

      <button
        type="button"
        onClick={() => setAdvancedOpen((o) => !o)}
        className="text-xs text-primary hover:underline"
      >
        {advancedOpen ? '▼' : '▶'} Advanced Hyperparameters
      </button>

      {advancedOpen && (
        <label className="block text-xs text-text-muted">
          Replay Buffer Size
          <input
            type="number"
            min={100}
            max={50000}
            step={100}
            value={hyperparams.replayBufferSize}
            disabled={disabled}
            onChange={(e) =>
              setHyperparam('replayBufferSize', Number(e.target.value))
            }
            className="mt-1 w-full rounded border border-border bg-bg-elevated px-2 py-1"
          />
        </label>
      )}
    </div>
  );
}
