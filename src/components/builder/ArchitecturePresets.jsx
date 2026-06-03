import { PRESETS, useModelStore } from '../../stores/useModelStore';
import { estimateParams, getInputShape } from '../../utils/shapeCalculator';
import { getGameById, useGameStore } from '../../stores/useGameStore';

const PRESET_KEYS = [
  { key: 'starter', label: 'Starter' },
  { key: 'deep', label: 'Deep' },
  { key: 'wide', label: 'Wide' },
  { key: 'cnn', label: 'CNN' },
];

export function ArchitecturePresets() {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const layers = useModelStore((s) => s.layers);
  const loadPreset = useModelStore((s) => s.loadPreset);
  const game = getGameById(activeGameId);

  const handlePreset = (key) => {
    if (layers.length > 0) {
      const ok = window.confirm(
        'Replace current architecture with this preset?'
      );
      if (!ok) return;
    }
    loadPreset(key);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_KEYS.map(({ key, label }) => {
        const templates = PRESETS[key] ?? [];
        const count = estimateParams(
          templates,
          getInputShape(activeGameId),
          game?.outputSize ?? 4
        );
        return (
          <button
            key={key}
            type="button"
            onClick={() => handlePreset(key)}
            className="glass-panel flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary/40 hover:bg-bg-elevated"
          >
            <span className="font-medium text-text-base">{label}</span>
            <span className="font-mono-nums rounded bg-bg-elevated px-1.5 py-0.5 text-xs text-text-muted">
              {(count / 1000).toFixed(count >= 1000 ? 1 : 0)}
              {count >= 1000 ? 'k' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
