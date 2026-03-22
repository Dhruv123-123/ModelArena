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
    <div className="bg-bg-card border border-border rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-widest text-text-muted mb-3">Hyperparameters</p>
      <div className="space-y-2">
        {PARAMS.map(({ key, label, min, max, step }) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <label className="text-[10px] text-text-secondary whitespace-nowrap">{label}</label>
            <input
              type="number"
              value={hyperparams[key]}
              onChange={(e) => setHyperparam(key, Number(e.target.value))}
              disabled={isTraining}
              min={min} max={max} step={step}
              className="w-24 px-2 py-1 bg-bg-primary border border-border rounded text-[11px] font-mono text-text-primary focus:border-border-light focus:outline-none disabled:opacity-50"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
