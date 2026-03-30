import useTrainingStore from '../../stores/useTrainingStore'

const PARAMS = [
  { key: 'learningRate', label: 'Learning Rate', min: 0.0001, max: 0.1, step: 0.0001 },
  { key: 'batchSize', label: 'Batch Size', min: 8, max: 256, step: 8 },
  { key: 'gamma', label: 'Discount (γ)', min: 0.5, max: 0.999, step: 0.001 },
  { key: 'epsilon', label: 'Initial ε', min: 0.1, max: 1.0, step: 0.05 },
  { key: 'epsilonDecay', label: 'ε Decay', min: 0.9, max: 0.999, step: 0.001 },
  { key: 'epsilonMin', label: 'Min ε', min: 0.001, max: 0.1, step: 0.001 },
  { key: 'replayBufferSize', label: 'Replay Buffer', min: 1000, max: 100000, step: 1000 },
  { key: 'targetUpdateFreq', label: 'Target Update', min: 10, max: 1000, step: 10 },
  { key: 'maxEpisodes', label: 'Max Episodes', min: 50, max: 5000, step: 50 },
  { key: 'maxStepsPerEpisode', label: 'Max Steps/Ep', min: 50, max: 2000, step: 50 },
]

export default function HyperparamConfig() {
  const { hyperparams, setHyperparam, isTraining } = useTrainingStore()

  return (
    <div className="rounded-xl p-5 bg-bg-hover border border-border">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-secondary text-lg">tune</span>
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-text-primary font-black">Hyperparameters</p>
      </div>
      <div className="space-y-3">
        {PARAMS.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <label className="font-label text-[10px] text-text-muted uppercase tracking-wider font-medium block mb-1">{label}</label>
            <input
              type="number"
              value={hyperparams[key]}
              onChange={(e) => setHyperparam(key, Number(e.target.value))}
              disabled={isTraining}
              min={min} max={max} step={step}
              className="w-full px-3 py-2 rounded-lg text-xs font-mono text-text-primary bg-bg-primary border border-border focus:border-primary/30 focus:outline-none disabled:opacity-30 transition-all tabular-nums"
            />
          </div>
        ))}
      </div>
      {isTraining && (
        <div className="flex items-center gap-2 mt-4 justify-center">
          <span className="material-symbols-outlined text-text-ghost text-sm">lock</span>
          <p className="text-[10px] text-text-ghost font-label">Stop training to edit</p>
        </div>
      )}
    </div>
  )
}
