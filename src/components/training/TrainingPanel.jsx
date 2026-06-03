import { useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TrainingCharts } from './TrainingCharts';
import { HyperparamConfig } from './HyperparamConfig';
import { TrainingLoop } from '../../ml/TrainingLoop.js';
import { SupervisedTrainer } from '../../ml/SupervisedTrainer.js';
import { saveModel, saveChessModel } from '../../ml/modelSerializer.js';
import { createEngine } from '../../utils/engineFactory.js';
import { getGameById, getGameAccentHex, useGameStore } from '../../stores/useGameStore';
import { useModelStore } from '../../stores/useModelStore';
import { useTrainingStore } from '../../stores/useTrainingStore';
import { useLeaderboardStore } from '../../stores/useLeaderboardStore';
import { useToastStore } from '../../stores/useToastStore';

const TRAINING_HINTS = {
  snake:
    'Tip: Use the starter preset. Reward shaping helps the agent find food faster.',
  flappy:
    'Tip: Smaller networks train faster; increase max episodes for better policies.',
  cartpole:
    'Tip: CartPole usually solves in 200–300 episodes with the starter preset.',
  twentyfortyeight:
    'Tip: 2048 rewards come from merges — deeper nets learn slower but peak higher.',
  chess:
    'Tip: Supervised training fits evaluation labels; use Deep preset for best accuracy.',
};

export function TrainingPanel({ onCelebrate }) {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const setView = useGameStore((s) => s.setView);
  const game = getGameById(activeGameId);
  const accent = getGameAccentHex(activeGameId);

  const layers = useModelStore((s) => s.layers);
  const loadPreset = useModelStore((s) => s.loadPreset);
  const setSavedWeightsKey = useModelStore((s) => s.setSavedWeightsKey);

  const isTraining = useTrainingStore((s) => s.isTraining);
  const isPaused = useTrainingStore((s) => s.isPaused);
  const currentEpisode = useTrainingStore((s) => s.currentEpisode);
  const currentStep = useTrainingStore((s) => s.currentStep);
  const epsilon = useTrainingStore((s) => s.epsilon);
  const bestScore = useTrainingStore((s) => s.bestScore);
  const hyperparams = useTrainingStore((s) => s.hyperparams);
  const startTraining = useTrainingStore((s) => s.startTraining);
  const stopTraining = useTrainingStore((s) => s.stopTraining);
  const pauseTraining = useTrainingStore((s) => s.pauseTraining);
  const resumeTraining = useTrainingStore((s) => s.resumeTraining);
  const setCurrentEpisode = useTrainingStore((s) => s.setCurrentEpisode);
  const setCurrentStep = useTrainingStore((s) => s.setCurrentStep);
  const setEpsilon = useTrainingStore((s) => s.setEpsilon);
  const addEpisodeReward = useTrainingStore((s) => s.addEpisodeReward);
  const addLoss = useTrainingStore((s) => s.addLoss);

  const addEntry = useLeaderboardStore((s) => s.addEntry);
  const pushToast = useToastStore((s) => s.push);

  const loopRef = useRef(null);
  const trainerRef = useRef(null);
  const prevBestRef = useRef(-Infinity);

  const [warning, setWarning] = useState('');

  const isSupervised = game?.trainingMode === 'supervised';
  const maxEp = hyperparams.maxEpisodes;
  const epsilonPct = Math.min(
    100,
    ((hyperparams.epsilon - epsilon) /
      (hyperparams.epsilon - hyperparams.epsilonMin + 1e-6)) *
      100
  );

  const finishTraining = async (model, archLayers) => {
    stopTraining();
    const trainState = useTrainingStore.getState();
    const score =
      trainState.bestScore > -Infinity
        ? trainState.bestScore
        : trainState.episodeRewards.at(-1) ?? 0;

    let savedKey = null;
    if (model) {
      try {
        const name = `Training Run ${new Date().toLocaleString()}`;
        savedKey =
          activeGameId === 'chess'
            ? await saveChessModel(model)
            : await saveModel(model, activeGameId, name, {
                layers: archLayers,
              });
        setSavedWeightsKey(savedKey);
        pushToast('Model saved!', 'success');
      } catch (e) {
        pushToast(`Save failed: ${e.message}`, 'error');
      }
    }

    const gameEntries =
      useLeaderboardStore.getState().entries[activeGameId] ?? [];
    addEntry({
      id: uuidv4(),
      timestamp: Date.now(),
      modelName: `Run #${gameEntries.length + 1}`,
      gameId: activeGameId,
      bestScore: score,
      architecture: archLayers.map((l) => l.type).join('→'),
      episodes: trainState.currentEpisode + 1,
      layerCount: archLayers.length,
      rewardHistory: trainState.episodeRewards.slice(-100),
      lossHistory: trainState.losses.slice(-100),
      weightsKey: savedKey,
    });

    pushToast('Training complete! Added to leaderboard.', 'success');
    setView('leaderboard');
  };

  const handleEpisodeEnd = ({ score }) => {
    const prevBest = prevBestRef.current;
    addEpisodeReward(score);
    const newBest = useTrainingStore.getState().bestScore;
    if (newBest > prevBest) {
      prevBestRef.current = newBest;
      onCelebrate?.();
      if (
        game?.solvedThreshold != null &&
        score >= game.solvedThreshold
      ) {
        pushToast(`Solved! Reached ${game.solvedThreshold}+`, 'success');
      }
    }
  };

  const handleStart = async () => {
    let archLayers = layers;
    if (archLayers.length === 0) {
      setWarning('No layers configured — loading starter preset…');
      loadPreset(activeGameId === 'chess' ? 'deep' : 'starter');
      archLayers = useModelStore.getState().layers;
    } else {
      setWarning('');
    }

    prevBestRef.current = -Infinity;
    startTraining();

    const hp = { ...useTrainingStore.getState().hyperparams };

    if (isSupervised) {
      const trainer = new SupervisedTrainer(archLayers, hp, {
        onEpoch: ({ epoch, loss, valLoss }) => {
          setCurrentEpisode(epoch);
          if (loss != null) addLoss(loss);
          if (valLoss != null) addEpisodeReward(Math.max(0, 1 - valLoss));
        },
        onEnd: async ({ model }) => {
          await finishTraining(model, archLayers);
          trainerRef.current = null;
        },
      });
      trainerRef.current = trainer;
      await trainer.start();
      return;
    }

    const engine = createEngine(activeGameId);
    const loop = new TrainingLoop(
      engine,
      archLayers,
      activeGameId,
      game.outputSize,
      hp,
      {
        onStep: ({ step, episode, loss, epsilon: eps }) => {
          if (step % 10 === 0) {
            setCurrentStep(step);
            setCurrentEpisode(episode);
            setEpsilon(eps);
          }
          if (loss != null) addLoss(loss);
        },
        onEpisodeEnd: ({ score }) => handleEpisodeEnd({ score }),
        onTrainingEnd: async ({ agent }) => {
          await finishTraining(agent.onlineModel, archLayers);
          loopRef.current = null;
        },
      }
    );

    loopRef.current = loop;
    await loop.start();
    loop.dispose();
  };

  const handlePause = () => {
    pauseTraining();
    if (!isSupervised) loopRef.current?.pause();
  };

  const handleResume = () => {
    resumeTraining();
    if (!isSupervised) loopRef.current?.resume();
  };

  const handleStop = () => {
    loopRef.current?.stop();
    loopRef.current?.dispose();
    loopRef.current = null;
    trainerRef.current?.stop();
    trainerRef.current?.dispose();
    trainerRef.current = null;
    stopTraining();
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
      {isSupervised && (
        <div className="rounded-lg border border-accent-chess/40 bg-accent-chess/10 px-4 py-2 text-sm text-accent-chess">
          Supervised Training — Chess Evaluation
        </div>
      )}

      {warning && <p className="text-sm text-accent-flappy">{warning}</p>}

      <div className="glass-panel flex flex-wrap items-center gap-4 px-4 py-3">
        <span className="font-mono-nums text-sm text-text-base">
          Episode {currentEpisode + 1} / {maxEp}
        </span>
        <span
          className="rounded-full px-3 py-1 font-mono-nums text-sm font-bold"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          Score: {bestScore > -Infinity ? bestScore.toFixed(1) : '—'}
        </span>
        {!isSupervised && (
          <div className="flex min-w-[120px] flex-1 items-center gap-2">
            <span className="text-xs text-text-muted">ε</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${100 - epsilonPct}%` }}
              />
            </div>
            <span className="font-mono-nums text-xs text-text-muted">
              {epsilon.toFixed(3)}
            </span>
          </div>
        )}
        {bestScore > -Infinity && (
          <span className="text-sm text-primary">
            ⭐ Best: {bestScore.toFixed(1)}
          </span>
        )}
        <span className="font-mono-nums text-xs text-text-muted">
          Step {currentStep}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {!isTraining ? (
          <button
            type="button"
            onClick={handleStart}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-black hover:glow-primary"
          >
            ▶ Start Training
          </button>
        ) : (
          <>
            {!isSupervised &&
              (isPaused ? (
                <button
                  type="button"
                  onClick={handleResume}
                  className="rounded-xl border border-primary px-5 py-2.5 text-sm font-medium text-primary"
                >
                  ▶ Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePause}
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-text-base"
                >
                  ⏸ Pause
                </button>
              ))}
            <button
              type="button"
              onClick={handleStop}
              className="rounded-xl border border-red-500/40 px-5 py-2.5 text-sm text-red-400"
            >
              ⏹ Stop
            </button>
          </>
        )}
      </div>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-h-0 space-y-3">
          <TrainingCharts />
          <p className="text-xs text-text-muted">
            {TRAINING_HINTS[activeGameId] ?? ''}
          </p>
        </div>
        <HyperparamConfig />
      </div>
    </div>
  );
}
