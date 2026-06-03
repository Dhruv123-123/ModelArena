import * as tf from '@tensorflow/tfjs';
import { buildModel } from './ModelBuilder.js';
import { TrainingLoop } from './TrainingLoop.js';
import { createEngine } from '../utils/engineFactory.js';

export const PRETRAINED_MODELS = {
  'snake-snakebot-v1': {
    gameId: 'snake',
    name: 'SnakeBot v1',
    layers: [
      { type: 'dense', units: 128, activation: 'relu' },
      { type: 'dense', units: 64, activation: 'relu' },
    ],
    hyperparams: { learningRate: 0.001, gamma: 0.99 },
    expectedScore: 15,
    tier: 'silver',
    description: 'Solid snake policy — survives ~15 foods on average',
    remoteUrl: '/models/snake-snakebot-v1/model.json',
  },
  'cartpole-balancebot': {
    gameId: 'cartpole',
    name: 'BalanceBot',
    layers: [
      { type: 'dense', units: 64, activation: 'relu' },
      { type: 'dense', units: 32, activation: 'relu' },
    ],
    expectedScore: 195,
    tier: 'gold',
    description: 'Solves CartPole — 195+ steps reliably',
    remoteUrl: '/models/cartpole-balancebot/model.json',
  },
};

export async function loadPretrainedModel(modelId) {
  const config = PRETRAINED_MODELS[modelId];
  if (!config) return null;

  const idbKey = `indexeddb://pretrained-${modelId}`;

  try {
    const allModels = await tf.io.listModels();
    if (allModels[idbKey]) {
      return tf.loadLayersModel(idbKey);
    }
  } catch {
    /* listModels may fail in some environments */
  }

  if (config.remoteUrl) {
    try {
      const model = await tf.loadLayersModel(config.remoteUrl);
      await model.save(idbKey);
      return model;
    } catch {
      return null;
    }
  }

  return null;
}

export async function quickTrainModel(modelId, progressCallback) {
  const config = PRETRAINED_MODELS[modelId];
  if (!config) return null;

  const engine = createEngine(config.gameId);
  const gameMeta = { snake: 4, flappy: 2, cartpole: 2, twentyfortyeight: 4 };
  const outputSize = gameMeta[config.gameId] ?? 4;

  const hyperparams = {
    learningRate: 0.001,
    batchSize: 32,
    epsilon: 1.0,
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    replayBufferSize: 5000,
    gamma: 0.99,
    targetUpdateFreq: 100,
    maxEpisodes: 200,
    maxStepsPerEpisode: 500,
    ...config.hyperparams,
  };

  const loop = new TrainingLoop(
    engine,
    config.layers,
    config.gameId,
    outputSize,
    hyperparams,
    {
      onStep: (data) => progressCallback?.({ type: 'step', ...data }),
      onEpisodeEnd: (data) => progressCallback?.({ type: 'episode', ...data }),
      onTrainingEnd: (data) => progressCallback?.({ type: 'end', ...data }),
    }
  );

  await loop.start();
  return loop.agent?.onlineModel ?? buildModel(config.layers, config.gameId, outputSize);
}
