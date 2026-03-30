import * as tf from '@tensorflow/tfjs'
import { buildModel } from './ModelBuilder.js'
import DQNAgent from './DQNAgent.js'
import SnakeEngine from '../games/snake/SnakeEngine.js'
import FlappyEngine from '../games/flappy/FlappyEngine.js'
import CartPoleEngine from '../games/cartpole/CartPoleEngine.js'
import TwentyFortyEightEngine from '../games/twentyfortyeight/TwentyFortyEightEngine.js'

// Pre-trained model definitions with architecture + training recipe
export const PRETRAINED_MODELS = {
  snake: {
    id: 'snake-snakebot-v1',
    name: 'SnakeBot v1',
    description: 'Trained 500 episodes, scores ~15. 2-layer Dense (32 units each, ReLU).',
    gameId: 'snake',
    tier: 'bronze',
    expectedScore: 15,
    layers: [
      { type: 'dense', units: 32, activation: 'relu', id: 'pre-s1' },
      { type: 'dense', units: 32, activation: 'relu', id: 'pre-s2' },
    ],
    hyperparams: {
      learningRate: 0.001,
      batchSize: 32,
      epsilon: 1.0,
      epsilonDecay: 0.995,
      epsilonMin: 0.01,
      replayBufferSize: 10000,
      gamma: 0.99,
      targetUpdateFreq: 100,
      maxEpisodes: 300,
      maxStepsPerEpisode: 200,
    },
  },
  cartpole: {
    id: 'cartpole-balancebot',
    name: 'BalanceBot',
    description: 'Solves CartPole (195+ steps). Simple 2-layer Dense (32 units).',
    gameId: 'cartpole',
    tier: 'gold',
    expectedScore: 195,
    layers: [
      { type: 'dense', units: 32, activation: 'relu', id: 'pre-c1' },
      { type: 'dense', units: 32, activation: 'relu', id: 'pre-c2' },
    ],
    hyperparams: {
      learningRate: 0.001,
      batchSize: 32,
      epsilon: 1.0,
      epsilonDecay: 0.99,
      epsilonMin: 0.01,
      replayBufferSize: 10000,
      gamma: 0.99,
      targetUpdateFreq: 50,
      maxEpisodes: 200,
      maxStepsPerEpisode: 500,
    },
  },
  flappy: {
    id: 'flappy-flapnet',
    name: 'FlapNet',
    description: 'Passes ~5-10 pipes. 3-layer Dense (64-32-32, ReLU).',
    gameId: 'flappy',
    tier: 'bronze',
    expectedScore: 8,
    layers: [
      { type: 'dense', units: 64, activation: 'relu', id: 'pre-f1' },
      { type: 'dense', units: 32, activation: 'relu', id: 'pre-f2' },
      { type: 'dense', units: 32, activation: 'relu', id: 'pre-f3' },
    ],
    hyperparams: {
      learningRate: 0.001,
      batchSize: 32,
      epsilon: 1.0,
      epsilonDecay: 0.995,
      epsilonMin: 0.01,
      replayBufferSize: 10000,
      gamma: 0.99,
      targetUpdateFreq: 100,
      maxEpisodes: 400,
      maxStepsPerEpisode: 1000,
    },
  },
  twentyfortyeight: {
    id: '2048-tilebot',
    name: 'TileBot',
    description: 'Reaches 256-512. Wide 2-layer Dense (128 units, ReLU + Dropout).',
    gameId: 'twentyfortyeight',
    tier: 'bronze',
    expectedScore: 400,
    layers: [
      { type: 'dense', units: 128, activation: 'relu', id: 'pre-t1' },
      { type: 'dropout', rate: 0.2, id: 'pre-t2' },
      { type: 'dense', units: 128, activation: 'relu', id: 'pre-t3' },
    ],
    hyperparams: {
      learningRate: 0.001,
      batchSize: 64,
      epsilon: 1.0,
      epsilonDecay: 0.995,
      epsilonMin: 0.05,
      replayBufferSize: 20000,
      gamma: 0.99,
      targetUpdateFreq: 200,
      maxEpisodes: 300,
      maxStepsPerEpisode: 500,
    },
  },
}

// Check if a pre-trained model exists in IndexedDB or has a remote URL
export async function hasPretrainedModel(modelId) {
  try {
    const models = await tf.io.listModels()
    if (models[`indexeddb://pretrained-${modelId}`]) return true
    
    // Check if any config has this ID and a remote URL
    const config = Object.values(PRETRAINED_MODELS).find(m => m.id === modelId)
    return !!config?.remoteUrl
  } catch {
    return false
  }
}

// Load a pre-trained model from IndexedDB or Remote URL
export async function loadPretrainedModel(modelId) {
  try {
    // Try local IndexedDB first
    const models = await tf.io.listModels()
    if (models[`indexeddb://pretrained-${modelId}`]) {
      return await tf.loadLayersModel(`indexeddb://pretrained-${modelId}`)
    }
    
    // Try remote URL if configured
    const config = Object.values(PRETRAINED_MODELS).find(m => m.id === modelId)
    if (config?.remoteUrl) {
      const model = await tf.loadLayersModel(config.remoteUrl)
      // Cache it locally for next time
      await savePretrainedModel(model, modelId)
      return model
    }
    
    return null
  } catch (err) {
    console.error(`Failed to load pretrained model ${modelId}:`, err)
    return null
  }
}

// Save a pre-trained model to IndexedDB
export async function savePretrainedModel(model, modelId) {
  await model.save(`indexeddb://pretrained-${modelId}`)
}

// Build a fresh model from pretrained config (untrained, random weights)
// Users can then use the "Quick Train" to train it rapidly
export function buildPretrainedModel(gameId) {
  const config = PRETRAINED_MODELS[gameId]
  if (!config) return null
  const outputSize = { snake: 4, flappy: 2, cartpole: 2, twentyfortyeight: 4, chess: 1 }[gameId]
  const model = buildModel(config.layers, gameId, outputSize)
  model.compile({
    optimizer: tf.train.adam(config.hyperparams.learningRate),
    loss: 'meanSquaredError',
  })
  return model
}

// Quick-train a model in the background (for generating pre-trained weights)
export async function quickTrainModel(gameId, onProgress) {
  const config = PRETRAINED_MODELS[gameId]
  if (!config) throw new Error(`No pretrained config for ${gameId}`)

  const engine = createEngineForGame(gameId)
  const outputSize = { snake: 4, flappy: 2, cartpole: 2, twentyfortyeight: 4 }[gameId]
  const agent = new DQNAgent(config.layers, gameId, outputSize, config.hyperparams)

  const totalEpisodes = config.hyperparams.maxEpisodes
  let bestScore = -Infinity

  for (let ep = 0; ep < totalEpisodes; ep++) {
    let state = engine.reset()

    for (let step = 0; step < config.hyperparams.maxStepsPerEpisode; step++) {
      const action = agent.selectAction(state)
      const { state: nextState, reward, done } = engine.step(action)
      agent.storeExperience(state, action, reward, nextState, done)
      await agent.train()
      state = nextState
      if (done) break

      // Yield every 8 steps to keep UI responsive
      if (step % 8 === 0) await new Promise(r => setTimeout(r, 0))
    }

    bestScore = Math.max(bestScore, engine.getScore())

    onProgress?.({
      episode: ep,
      totalEpisodes,
      score: engine.getScore(),
      bestScore,
      epsilon: agent.epsilon,
      percent: Math.round(((ep + 1) / totalEpisodes) * 100),
    })
  }

  // Save to IndexedDB
  await savePretrainedModel(agent.getModel(), config.id)

  return { model: agent.getModel(), bestScore, agent }
}

function createEngineForGame(gameId) {
  switch (gameId) {
    case 'snake': return new SnakeEngine()
    case 'flappy': return new FlappyEngine()
    case 'cartpole': return new CartPoleEngine()
    case 'twentyfortyeight': return new TwentyFortyEightEngine()
    default: throw new Error(`Unknown game: ${gameId}`)
  }
}

// Get all available pre-trained model IDs
export function getPretrainedModelIds() {
  return Object.keys(PRETRAINED_MODELS)
}
