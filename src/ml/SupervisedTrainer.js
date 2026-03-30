import * as tf from '@tensorflow/tfjs'
import { buildModel } from './ModelBuilder.js'
import { LABELED_POSITIONS } from '../games/chess/chessPositions.js'
import { boardToVector } from '../utils/chessBoardVector.js'

export default class SupervisedTrainer {
  constructor(layers, callbacks = {}) {
    this.model = buildModel(layers, 'chess', 1)
    this.model.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError' })
    this.callbacks = callbacks
    this.running = false
  }

  async train(epochs = 50, batchSize = 32) {
    this.running = true
    const data = LABELED_POSITIONS
    const splitIdx = Math.floor(data.length * 0.8)
    const trainData = data.slice(0, splitIdx)
    const valData = data.slice(splitIdx)

    const trainX = tf.tensor2d(trainData.map(d => boardToVector(d.board)))
    const trainY = tf.tensor2d(trainData.map(d => [d.eval]))
    const valX = tf.tensor2d(valData.map(d => boardToVector(d.board)))
    const valY = tf.tensor2d(valData.map(d => [d.eval]))

    for (let epoch = 0; epoch < epochs && this.running; epoch++) {
      const history = await this.model.fit(trainX, trainY, {
        epochs: 1, batchSize, validationData: [valX, valY], shuffle: true,
      })

      this.callbacks.onEpoch?.({
        epoch,
        loss: history.history.loss[0],
        valLoss: history.history.val_loss[0],
      })
    }

    trainX.dispose(); trainY.dispose(); valX.dispose(); valY.dispose()
    this.running = false
    this.callbacks.onTrainingEnd?.()
  }

  stop() { this.running = false }
  getModel() { return this.model }
  dispose() { this.stop(); this.model.dispose() }
}
