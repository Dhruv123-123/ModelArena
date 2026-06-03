import { useModelStore } from '../../stores/useModelStore';

const ACTIVATIONS = ['relu', 'tanh', 'sigmoid', 'linear'];

export function LayerCard({ layer, index, shape, hasError, dragHandleProps }) {
  const updateLayer = useModelStore((s) => s.updateLayer);
  const removeLayer = useModelStore((s) => s.removeLayer);

  const shapeLabel = shape ? `[${shape.join(', ')}]` : '—';

  return (
    <div
      className={`glass-panel flex flex-wrap items-start gap-3 rounded-lg border p-3 ${
        hasError ? 'border-red-500/60 bg-red-500/5' : 'border-border'
      }`}
    >
      <div
        {...dragHandleProps}
        className="cursor-grab pt-1 text-text-muted active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        ⠿
      </div>
      <span className="font-mono-nums rounded bg-bg-elevated px-2 py-0.5 text-xs text-text-muted">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold capitalize text-text-base">
            {layer.type}
          </span>
          <span className="font-mono-nums rounded border border-border bg-bg-primary px-2 py-0.5 text-xs text-primary">
            {shapeLabel}
          </span>
        </div>

        {layer.type === 'dense' && (
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs text-text-muted">
              Units
              <input
                type="number"
                min={1}
                max={2048}
                value={layer.units}
                onChange={(e) =>
                  updateLayer(layer.id, { units: Number(e.target.value) })
                }
                className="w-20 rounded border border-border bg-bg-elevated px-2 py-1 text-text-base"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-text-muted">
              Activation
              <select
                value={layer.activation}
                onChange={(e) =>
                  updateLayer(layer.id, { activation: e.target.value })
                }
                className="rounded border border-border bg-bg-elevated px-2 py-1 text-text-base"
              >
                {ACTIVATIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {layer.type === 'conv2d' && (
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-xs text-text-muted">
              Filters
              <input
                type="number"
                min={1}
                value={layer.filters}
                onChange={(e) =>
                  updateLayer(layer.id, { filters: Number(e.target.value) })
                }
                className="w-16 rounded border border-border bg-bg-elevated px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-text-muted">
              Kernel
              <input
                type="number"
                min={1}
                max={7}
                value={layer.kernelSize}
                onChange={(e) =>
                  updateLayer(layer.id, { kernelSize: Number(e.target.value) })
                }
                className="w-14 rounded border border-border bg-bg-elevated px-2 py-1"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-text-muted">
              Padding
              <select
                value={layer.padding}
                onChange={(e) =>
                  updateLayer(layer.id, { padding: e.target.value })
                }
                className="rounded border border-border bg-bg-elevated px-2 py-1"
              >
                <option value="same">same</option>
                <option value="valid">valid</option>
              </select>
            </label>
          </div>
        )}

        {layer.type === 'dropout' && (
          <label className="flex w-full items-center gap-2 text-xs text-text-muted">
            Rate {layer.rate}
            <input
              type="range"
              min={0}
              max={0.9}
              step={0.05}
              value={layer.rate}
              onChange={(e) =>
                updateLayer(layer.id, { rate: Number(e.target.value) })
              }
              className="flex-1"
            />
          </label>
        )}

        {layer.type === 'activation' && (
          <select
            value={layer.activation}
            onChange={(e) =>
              updateLayer(layer.id, { activation: e.target.value })
            }
            className="rounded border border-border bg-bg-elevated px-2 py-1 text-sm"
          >
            {ACTIVATIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}
      </div>

      <button
        type="button"
        onClick={() => removeLayer(layer.id)}
        className="rounded p-1 text-text-muted hover:bg-red-500/20 hover:text-red-400"
        aria-label="Remove layer"
      >
        ×
      </button>
    </div>
  );
}
