import * as tf from '@tensorflow/tfjs';
import { calculateShapes, getInputShape } from '../utils/shapeCalculator.js';

export function buildModel(layers, gameId, outputSize, learningRate = 0.001) {
  const inputShape = getInputShape(gameId);
  const { errors } = calculateShapes(layers, inputShape);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }

  const model = tf.sequential();
  let isFirst = true;

  for (const layer of layers) {
    const config = { ...layer };

    switch (layer.type) {
      case 'dense': {
        const denseConfig = {
          units: layer.units ?? 64,
          activation: layer.activation ?? 'relu',
        };
        if (isFirst) {
          denseConfig.inputShape = inputShape;
          isFirst = false;
        }
        model.add(tf.layers.dense(denseConfig));
        break;
      }
      case 'conv2d': {
        const convConfig = {
          filters: layer.filters ?? 32,
          kernelSize: layer.kernelSize ?? 3,
          padding: layer.padding ?? 'same',
          activation: layer.activation ?? 'relu',
        };
        if (isFirst) {
          convConfig.inputShape = inputShape;
          isFirst = false;
        }
        model.add(tf.layers.conv2d(convConfig));
        break;
      }
      case 'flatten':
        model.add(tf.layers.flatten());
        isFirst = false;
        break;
      case 'dropout':
        model.add(tf.layers.dropout({ rate: layer.rate ?? 0.2 }));
        isFirst = false;
        break;
      case 'batchnorm':
        model.add(tf.layers.batchNormalization());
        isFirst = false;
        break;
      case 'activation':
        model.add(
          tf.layers.activation({ activation: layer.activation ?? 'relu' })
        );
        isFirst = false;
        break;
      default:
        break;
    }
    void config;
  }

  const outputActivation = outputSize === 1 ? 'tanh' : 'linear';
  model.add(
    tf.layers.dense({ units: outputSize, activation: outputActivation })
  );

  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'meanSquaredError',
  });

  return model;
}
