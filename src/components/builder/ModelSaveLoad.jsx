import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { buildModel } from '../../ml/ModelBuilder.js';
import {
  exportModel,
  exportStandardTfjsModel,
  getSavedModelsMeta,
  importModel,
  removeModelFromMeta,
  saveArchitectureMeta,
  saveModel,
} from '../../ml/modelSerializer.js';
import { estimateParams } from '../../utils/shapeCalculator';
import { getInputShape } from '../../utils/shapeCalculator';
import { useModelStore } from '../../stores/useModelStore';
import { getGameById, useGameStore } from '../../stores/useGameStore';

export function ModelSaveLoad({ open, onClose, trainedModelRef }) {
  const [name, setName] = useState('');
  const [models, setModels] = useState(getSavedModelsMeta());
  const layers = useModelStore((s) => s.layers);
  const setSavedWeightsKey = useModelStore((s) => s.setSavedWeightsKey);
  const loadSavedModels = useModelStore((s) => s.loadSavedModels);
  const activeGameId = useGameStore((s) => s.activeGameId);
  const game = getGameById(activeGameId);

  const refresh = () => {
    setModels(getSavedModelsMeta());
    loadSavedModels();
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const paramCount = estimateParams(
      layers,
      getInputShape(activeGameId),
      game?.outputSize ?? 4
    );
    let key = null;
    if (trainedModelRef?.current) {
      key = await saveModel(trainedModelRef.current, activeGameId, name, {
        layers,
        paramCount,
      });
      setSavedWeightsKey(key);
    } else {
      saveArchitectureMeta({
        key: `arch-${uuidv4()}`,
        gameId: activeGameId,
        name: name.trim(),
        layers: layers.map(({ id, ...rest }) => ({ ...rest, id })),
        paramCount,
        architectureOnly: true,
      });
    }
    setName('');
    refresh();
  };

  const handleLoad = (meta) => {
    if (meta.layers?.length) {
      const withIds = meta.layers.map((l) => ({
        ...l,
        id: l.id ?? uuidv4(),
      }));
      useModelStore.setState({ layers: withIds });
    }
    if (meta.key && !meta.architectureOnly) {
      setSavedWeightsKey(meta.key);
    }
    onClose?.();
  };

  const handleDelete = (key) => {
    removeModelFromMeta(key);
    refresh();
  };

  const handleExport = async () => {
    if (!trainedModelRef?.current) {
      try {
        const model = buildModel(
          layers,
          activeGameId,
          game?.outputSize ?? 4
        );
        await exportStandardTfjsModel(model, `${activeGameId}-architecture`);
        model.dispose();
      } catch (e) {
        alert(e.message);
      }
      return;
    }
    await exportModel(trainedModelRef.current, `${activeGameId}-weights`);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const model = await importModel(file);
      trainedModelRef.current = model;
      alert('Model imported. Save with a name to persist to IndexedDB.');
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="glass-panel max-h-[80vh] w-full max-w-md overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-base">Save / Load Model</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text-base"
          >
            ×
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Architecture name"
            className="flex-1 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black"
          >
            Save
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-bg-elevated"
          >
            Download Weights
          </button>
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-bg-elevated">
            Import JSON
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>

        <ul className="space-y-2">
          {models.length === 0 && (
            <li className="text-sm text-text-muted">No saved models yet.</li>
          )}
          {models.map((m) => (
            <li
              key={m.key}
              className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated/50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-text-muted">
                  {m.gameId} · {new Date(m.timestamp).toLocaleDateString()}
                  {m.paramCount ? ` · ${m.paramCount.toLocaleString()} params` : ''}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleLoad(m)}
                  className="text-xs text-primary hover:underline"
                >
                  Load
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(m.key)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Del
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
