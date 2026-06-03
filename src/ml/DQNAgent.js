import * as tf from '@tensorflow/tfjs';
import { buildModel } from './ModelBuilder.js';
import { getInputShape } from '../utils/shapeCalculator.js';

class ReplayBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = [];
    this.pointer = 0;
  }

  push(state, action, reward, nextState, done) {
    const entry = {
      state: Float32Array.from(state),
      action,
      reward,
      nextState: Float32Array.from(nextState),
      done,
    };
    if (this.buffer.length < this.capacity) {
      this.buffer.push(entry);
    } else {
      this.buffer[this.pointer] = entry;
    }
    this.pointer = (this.pointer + 1) % this.capacity;
  }

  sample(batchSize) {
    const n = Math.min(batchSize, this.buffer.length);
    const indices = new Set();
    while (indices.size < n) {
      indices.add(Math.floor(Math.random() * this.buffer.length));
    }
    return [...indices].map((i) => this.buffer[i]);
  }

  get size() {
    return this.buffer.length;
  }
}

export class DQNAgent {
  constructor(layers, gameId, outputSize, hyperparams) {
    this.outputSize = outputSize;
    this.gameId = gameId;
    this.inputSize = getInputShape(gameId).reduce((a, b) => a * b, 1);
    this.learningRate = hyperparams.learningRate ?? 0.001;
    this.batchSize = hyperparams.batchSize ?? 32;
    this.gamma = hyperparams.gamma ?? 0.99;
    this.epsilon = hyperparams.epsilon ?? 1.0;
    this.epsilonDecay = hyperparams.epsilonDecay ?? 0.995;
    this.epsilonMin = hyperparams.epsilonMin ?? 0.01;
    this.targetUpdateFreq = hyperparams.targetUpdateFreq ?? 100;
    this.replayBuffer = new ReplayBuffer(hyperparams.replayBufferSize ?? 10000);
    this.trainStep = 0;

    this.onlineModel = buildModel(
      layers,
      gameId,
      outputSize,
      this.learningRate
    );
    this.targetModel = buildModel(
      layers,
      gameId,
      outputSize,
      this.learningRate
    );
    this.syncTargetModel();
  }

  selectAction(stateArray, forceGreedy = false) {
    if (
      !forceGreedy &&
      Math.random() < this.epsilon
    ) {
      return Math.floor(Math.random() * this.outputSize);
    }

    return tf.tidy(() => {
      const stateTensor = tf.tensor2d([stateArray], [1, this.inputSize]);
      const qValues = this.onlineModel.predict(stateTensor);
      return qValues.argMax(1).dataSync()[0];
    });
  }

  storeExperience(state, action, reward, nextState, done) {
    this.replayBuffer.push(state, action, reward, nextState, done);
  }

  async train() {
    if (this.replayBuffer.size < this.batchSize) return null;

    const batch = this.replayBuffer.sample(this.batchSize);
    const batchSize = batch.length;

    const stateData = new Float32Array(batchSize * this.inputSize);
    const nextStateData = new Float32Array(batchSize * this.inputSize);

    for (let i = 0; i < batchSize; i++) {
      stateData.set(batch[i].state, i * this.inputSize);
      nextStateData.set(batch[i].nextState, i * this.inputSize);
    }

    const statesTensor = tf.tensor2d(stateData, [batchSize, this.inputSize]);
    const nextStatesTensor = tf.tensor2d(nextStateData, [
      batchSize,
      this.inputSize,
    ]);

    const onlineNextQs = this.onlineModel.predict(nextStatesTensor);
    const targetNextQs = this.targetModel.predict(nextStatesTensor);
    const currentQs = this.onlineModel.predict(statesTensor);

    const currentQsArray = await currentQs.array();
    const onlineNextArray = await onlineNextQs.array();
    const targetNextArray = await targetNextQs.array();

    const targetData = [];
    for (let i = 0; i < batchSize; i++) {
      const targetQ = [...currentQsArray[i]];
      const action = batch[i].action;
      if (batch[i].done) {
        targetQ[action] = batch[i].reward;
      } else {
        const onlineRow = onlineNextArray[i];
        let bestNextAction = 0;
        let bestVal = -Infinity;
        for (let a = 0; a < this.outputSize; a++) {
          if (onlineRow[a] > bestVal) {
            bestVal = onlineRow[a];
            bestNextAction = a;
          }
        }
        targetQ[action] =
          batch[i].reward +
          this.gamma * targetNextArray[i][bestNextAction];
      }
      targetData.push(targetQ);
    }

    const targetTensor = tf.tensor2d(targetData);

    const history = await this.onlineModel.trainOnBatch(
      statesTensor,
      targetTensor
    );

    statesTensor.dispose();
    nextStatesTensor.dispose();
    onlineNextQs.dispose();
    targetNextQs.dispose();
    currentQs.dispose();
    targetTensor.dispose();

    this.trainStep++;
    if (this.trainStep % this.targetUpdateFreq === 0) {
      this.syncTargetModel();
    }
    this.epsilon = Math.max(
      this.epsilonMin,
      this.epsilon * this.epsilonDecay
    );

    const loss = Array.isArray(history) ? history[0] : history;
    return typeof loss === 'number' ? loss : null;
  }

  syncTargetModel() {
    this.targetModel.setWeights(this.onlineModel.getWeights());
  }

  dispose() {
    this.onlineModel.dispose();
    this.targetModel.dispose();
  }
}
