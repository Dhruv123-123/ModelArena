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
    <div className="rounded-xl p-4 card-inset" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-[11px] uppercase tracking-widest text-text-muted mb-4 font-medium">Hyperparameters</p>
      <div className="space-y-3">
        {PARAMS.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <label className="text-[11px] text-text-muted font-medium block mb-1">{label}</label>
            <input
              type="number"
              value={hyperparams[key]}
              onChange={(e) => setHyperparam(key, Number(e.target.value))}
              disabled={isTraining}
              min={min} max={max} step={step}
              className="w-full px-2.5 py-1.5 rounded-md text-xs font-mono text-text-primary focus:outline-none disabled:opacity-30 transition-opacity tabular-nums"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />
          </div>
        ))}
      </div>
      {isTraining && (
        <p className="text-[11px] text-text-muted mt-4 text-center">Stop training to edit</p>
      )}
    </div>
  )
}
