import * as tf from '@tensorflow/tfjs'
import { buildModel } from './ModelBuilder.js'

class ReplayBuffer {
  constructor(maxSize = 10000) {
    this.buffer = []
    this.maxSize = maxSize
    this.position = 0
  }
  push(state, action, reward, nextState, done) {
    const exp = { state, action, reward, nextState, done }
    if (this.buffer.length < this.maxSize) this.buffer.push(exp)
    else this.buffer[this.position] = exp
    this.position = (this.position + 1) % this.maxSize
  }
  sample(batchSize) {
    const batch = []
    const indices = new Set()
    while (indices.size < Math.min(batchSize, this.buffer.length)) {
      indices.add(Math.floor(Math.random() * this.buffer.length))
    }
    for (const idx of indices) batch.push(this.buffer[idx])
    return batch
  }
  get length() { return this.buffer.length }
}

export default class DQNAgent {
  constructor(layers, gameId, outputSize, hyperparams = {}) {
    this.outputSize = outputSize
    this.hp = {
      learningRate: 0.001, batchSize: 32, epsilon: 1.0, epsilonDecay: 0.995,
      epsilonMin: 0.01, replayBufferSize: 10000, gamma: 0.99, targetUpdateFreq: 100,
      ...hyperparams,
    }

    this.onlineModel = buildModel(layers, gameId, outputSize)
    this.onlineModel.compile({ optimizer: tf.train.adam(this.hp.learningRate), loss: 'meanSquaredError' })

    this.targetModel = buildModel(layers, gameId, outputSize)
    this.targetModel.compile({ optimizer: tf.train.adam(this.hp.learningRate), loss: 'meanSquaredError' })
    this.updateTargetModel()

    this.replayBuffer = new ReplayBuffer(this.hp.replayBufferSize)
    this.epsilon = this.hp.epsilon
    this.trainSteps = 0
  }

  updateTargetModel() {
    const weights = this.onlineModel.getWeights()
    this.targetModel.setWeights(weights.map(w => w.clone()))
  }

  selectAction(state, forceGreedy = false) {
    if (!forceGreedy && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.outputSize)
    }
    return tf.tidy(() => {
      const q = this.onlineModel.predict(tf.tensor2d([state]))
      return q.argMax(1).dataSync()[0]
    })
  }

  getQValues(state) {
    return tf.tidy(() => {
      const q = this.onlineModel.predict(tf.tensor2d([state]))
      return Array.from(q.dataSync())
    })
  }

  storeExperience(state, action, reward, nextState, done) {
    this.replayBuffer.push(state, action, reward, nextState, done)
  }

  async train() {
    if (this.replayBuffer.length < this.hp.batchSize) return null

    const batch = this.replayBuffer.sample(this.hp.batchSize)

    const loss = tf.tidy(() => {
      const states = tf.tensor2d(batch.map(e => e.state))
      const nextStates = tf.tensor2d(batch.map(e => e.nextState))

      // Double DQN
      const nextQOnline = this.onlineModel.predict(nextStates)
      const bestActions = nextQOnline.argMax(1).dataSync()
      const nextQTarget = this.targetModel.predict(nextStates).arraySync()

      const currentQ = this.onlineModel.predict(states).arraySync()

      for (let i = 0; i < batch.length; i++) {
        if (batch[i].done) {
          currentQ[i][batch[i].action] = batch[i].reward
        } else {
          currentQ[i][batch[i].action] = batch[i].reward + this.hp.gamma * nextQTarget[i][bestActions[i]]
        }
      }

      return tf.tensor2d(currentQ)
    })

    const statesTensor = tf.tensor2d(batch.map(e => e.state))
    const result = await this.onlineModel.trainOnBatch(statesTensor, loss)
    statesTensor.dispose()
    loss.dispose()

    this.trainSteps++
    if (this.trainSteps % this.hp.targetUpdateFreq === 0) this.updateTargetModel()
    this.epsilon = Math.max(this.hp.epsilonMin, this.epsilon * this.hp.epsilonDecay)

    return typeof result === 'number' ? result : (result?.dataSync ? result.dataSync()[0] : 0)
  }

  dispose() {
    this.onlineModel.dispose()
    this.targetModel.dispose()
  }

  getModel() { return this.onlineModel }
}
