import { useModelStore } from '../../stores/useModelStore';

const LAYER_TYPES = [
  { type: 'dense', label: 'Dense', color: 'border-primary/50 text-primary' },
  { type: 'conv2d', label: 'Conv2D', color: 'border-secondary/50 text-secondary' },
  { type: 'dropout', label: 'Dropout', color: 'border-tertiary/50 text-tertiary' },
  { type: 'batchnorm', label: 'BatchNorm', color: 'border-text-muted/50 text-text-muted' },
  { type: 'flatten', label: 'Flatten', color: 'border-accent-cartpole/50 text-accent-cartpole' },
  { type: 'activation', label: 'Activation', color: 'border-accent-flappy/50 text-accent-flappy' },
];

export function LayerPalette() {
  const addLayer = useModelStore((s) => s.addLayer);

  return (
    <div className="grid grid-cols-2 gap-2">
      {LAYER_TYPES.map(({ type, label, color }) => (
        <button
          key={type}
          type="button"
          onClick={() => addLayer(type)}
          className={`glass-panel rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-bg-elevated ${color}`}
        >
          <span className="mr-1.5 opacity-60">+</span>
          {label}
        </button>
      ))}
    </div>
  );
}
