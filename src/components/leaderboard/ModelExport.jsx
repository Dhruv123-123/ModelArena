import { useState } from 'react';
import { exportModel, exportStandardTfjsModel, loadModel } from '../../ml/modelSerializer.js';
import { formatArchitecture } from '../../utils/playbackPolicy.js';
import { useToastStore } from '../../stores/useToastStore';

export function ModelExport({ entry, expanded, onToggle }) {
  const pushToast = useToastStore((s) => s.push);
  const [preview, setPreview] = useState(null);

  const metadata = {
    name: entry.modelName,
    gameId: entry.gameId,
    timestamp: entry.timestamp,
    bestScore: entry.bestScore,
    architecture: formatArchitecture(entry.architecture),
    episodes: entry.episodes,
    layerCount: entry.layerCount,
    rewardHistoryLength: entry.rewardHistory?.length ?? 0,
  };

  const handleExportJson = () => {
    const json = JSON.stringify(metadata, null, 2);
    setPreview(json);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.modelName ?? 'run'}-metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Metadata exported', 'success');
  };

  const handleExportWeights = async () => {
    if (!entry.weightsKey) {
      pushToast('No saved weights for this run', 'error');
      return;
    }
    try {
      const model = await loadModel(entry.weightsKey);
      await exportStandardTfjsModel(model, entry.modelName ?? 'model');
      model.dispose();
      pushToast('Weights download started', 'success');
    } catch {
      try {
        const model = await loadModel(entry.weightsKey);
        await exportModel(model, entry.modelName ?? 'model');
        model.dispose();
        pushToast('Weights exported as JSON', 'success');
      } catch (e) {
        pushToast(e.message, 'error');
      }
    }
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="text-xs text-text-muted hover:text-primary"
      >
        Export ▾
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-bg-primary p-3 text-xs">
      <button type="button" onClick={onToggle} className="mb-2 text-text-muted">
        ▴ Collapse
      </button>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExportJson}
          className="rounded border border-border px-2 py-1 hover:bg-bg-elevated"
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={handleExportWeights}
          className="rounded border border-border px-2 py-1 hover:bg-bg-elevated"
        >
          Export Weights
        </button>
      </div>
      {preview && (
        <pre className="mt-2 max-h-32 overflow-auto rounded bg-bg-elevated p-2 font-mono-nums text-[10px] text-text-muted">
          {preview}
        </pre>
      )}
    </div>
  );
}
