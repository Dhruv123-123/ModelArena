import * as tf from '@tensorflow/tfjs'
import { calculateShapes, getInputShape } from '../utils/shapeCalculator.js'

export function buildModel(layers, gameId, outputSize) {
  const inputShape = getInputShape(gameId)
  const { errors } = calculateShapes(layers, inputShape)
  if (errors.length > 0) throw new Error(`Shape errors: ${errors.map(e => e.message).join('; ')}`)

  const model = tf.sequential()

  layers.forEach((layer, index) => {
    const config = index === 0 ? { inputShape } : {}
    switch (layer.type) {
      case 'dense':
        model.add(tf.layers.dense({ ...config, units: layer.units, activation: layer.activation || 'relu' }))
        break
      case 'conv2d':
        model.add(tf.layers.conv2d({ ...config, filters: layer.filters, kernelSize: layer.kernelSize, activation: layer.activation || 'relu', padding: layer.padding || 'same' }))
        break
      case 'flatten': model.add(tf.layers.flatten(config)); break
      case 'dropout': model.add(tf.layers.dropout({ ...config, rate: layer.rate })); break
      case 'batchnorm': model.add(tf.layers.batchNormalization(config)); break
      case 'activation': model.add(tf.layers.activation({ ...config, activation: layer.activation })); break
    }
  })

  model.add(tf.layers.dense({ units: outputSize, activation: outputSize === 1 ? 'tanh' : 'linear' }))
  return model
}
