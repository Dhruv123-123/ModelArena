import { useState } from 'react';
import {
  PRETRAINED_MODELS,
  loadPretrainedModel,
  quickTrainModel,
} from '../../ml/pretrainedModels.js';
import { useGameStore } from '../../stores/useGameStore';
import { useToastStore } from '../../stores/useToastStore';

export function PretrainedModelSelector({ onModelLoaded }) {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const pushToast = useToastStore((s) => s.push);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [training, setTraining] = useState(false);

  const models = Object.entries(PRETRAINED_MODELS).filter(
    ([, cfg]) => cfg.gameId === activeGameId
  );

  if (models.length === 0) return null;

  const handleLoad = async (modelId) => {
    setStatus('Loading…');
    try {
      setStatus('Downloading from server…');
      const model = await loadPretrainedModel(modelId);
      if (model) {
        setStatus('Using cached model');
        onModelLoaded?.(model);
        pushToast('Pretrained model loaded', 'success');
      } else {
        setStatus('Load failed — try Quick Train');
        pushToast('Could not load pretrained model', 'error');
      }
    } catch (e) {
      setStatus(e.message);
    }
  };

  const handleQuickTrain = async (modelId) => {
    setTraining(true);
    setProgress(0);
    setStatus('Quick training…');
    try {
      const model = await quickTrainModel(modelId, (data) => {
        if (data.type === 'episode') {
          setProgress(Math.min(100, ((data.episode + 1) / 200) * 100));
        }
      });
      if (model) {
        onModelLoaded?.(model);
        pushToast('Quick train complete', 'success');
      }
      setStatus('');
    } catch (e) {
      pushToast(e.message, 'error');
    } finally {
      setTraining(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-text-muted">Pretrained models</p>
      {models.map(([id, cfg]) => (
        <div
          key={id}
          className="rounded-lg border border-border bg-bg-elevated/50 p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-text-base">{cfg.name}</p>
              <p className="text-xs text-text-muted">{cfg.description}</p>
              <p className="mt-1 font-mono-nums text-xs text-text-muted">
                Expected ~{cfg.expectedScore} ·{' '}
                <span className="capitalize text-primary">{cfg.tier}</span>
              </p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => handleLoad(id)}
              className="rounded-lg bg-secondary/20 px-3 py-1.5 text-xs font-medium text-secondary"
            >
              Load
            </button>
            <button
              type="button"
              disabled={training}
              onClick={() => handleQuickTrain(id)}
              className="rounded-lg border border-primary/40 px-3 py-1.5 text-xs font-medium text-primary"
            >
              ⚡ Quick Train
            </button>
          </div>
        </div>
      ))}
      {status && (
        <p className="text-xs text-text-muted">{status}</p>
      )}
      {training && (
        <div className="h-2 overflow-hidden rounded-full bg-bg-elevated">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
