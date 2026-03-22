export function calculateShapes(layers, inputShape) {
  const shapes = [{ shape: inputShape, label: `Input: [${inputShape.join(', ')}]` }]
  const errors = []
  let currentShape = [...inputShape]

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i]
    let outputShape, error = null

    switch (layer.type) {
      case 'dense':
        if (currentShape.length !== 1) error = `Dense layer expects 1D input but got [${currentShape.join(', ')}]. Add a Flatten layer.`
        outputShape = [layer.units]
        break
      case 'conv2d':
        if (currentShape.length !== 3) {
          error = `Conv2D expects 3D input [h, w, channels] but got [${currentShape.join(', ')}].`
          outputShape = currentShape
        } else {
          const [h, w] = currentShape
          outputShape = layer.padding === 'same' ? [h, w, layer.filters] : [h - layer.kernelSize + 1, w - layer.kernelSize + 1, layer.filters]
        }
        break
      case 'flatten':
        outputShape = [currentShape.reduce((a, b) => a * b, 1)]
        break
      case 'dropout': case 'batchnorm': case 'activation':
        outputShape = [...currentShape]
        break
      default:
        error = `Unknown layer type: ${layer.type}`
        outputShape = currentShape
    }

    if (error) errors.push({ layerId: layer.id, layerIndex: i, message: error })
    shapes.push({ shape: outputShape, label: `[${outputShape.join(', ')}]`, layerId: layer.id })
    currentShape = outputShape
  }

  return { shapes, errors, outputShape: currentShape }
}

export function getInputShape(gameId) {
  const shapes = { snake: [20], flappy: [6], cartpole: [4], twentyfortyeight: [20], chess: [780] }
  return shapes[gameId] || [20]
}
