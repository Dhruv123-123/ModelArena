import { calculateShapes, getInputShape } from '../../utils/shapeCalculator';
import { getGameById, useGameStore } from '../../stores/useGameStore';
import { useModelStore } from '../../stores/useModelStore';

function ShapeBubble({ label, shape, error }) {
  const text = shape ? `[${shape.join(', ')}]` : label;
  return (
    <div
      className={`rounded-full border px-3 py-1.5 font-mono-nums text-xs ${
        error
          ? 'border-red-500/50 bg-red-500/10 text-red-300'
          : 'border-border bg-bg-elevated text-primary'
      }`}
    >
      {text}
    </div>
  );
}

export function ShapePropagator() {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const layers = useModelStore((s) => s.layers);
  const game = getGameById(activeGameId);
  const inputShape = getInputShape(activeGameId);
  const { shapes, errors } = calculateShapes(layers, inputShape);
  const outputSize = game?.outputSize ?? 4;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <ShapeBubble label="Input" shape={inputShape} error={false} />
      {layers.map((layer, i) => (
        <div key={layer.id} className="flex flex-col items-center gap-1">
          <span className="text-text-muted">↓</span>
          <span className="text-xs capitalize text-text-muted">{layer.type}</span>
          <ShapeBubble
            shape={shapes[i]}
            error={errors.some((e) => e.includes(`Layer ${i + 1}`))}
          />
        </div>
      ))}
      <span className="text-text-muted">↓</span>
      <ShapeBubble
        label={`Output [${outputSize}]`}
        shape={[outputSize]}
        error={errors.length > 0 && layers.length > 0}
      />
      {errors.length > 0 && (
        <p className="mt-2 max-w-md text-center text-xs text-red-400">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
