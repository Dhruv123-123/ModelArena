export function getInputShape(gameId) {
  switch (gameId) {
    case 'snake':
    case 'twentyfortyeight':
      return [20];
    case 'flappy':
      return [6];
    case 'cartpole':
      return [4];
    case 'chess':
      return [780];
    default:
      return [1];
  }
}

function is1D(shape) {
  return shape.length === 1;
}

function is3D(shape) {
  return shape.length === 3;
}

function convOutputSize(size, kernel, padding) {
  if (padding === 'same') return size;
  return size - kernel + 1;
}

export function calculateShapes(layers, inputShape) {
  const shapes = [];
  const errors = [];
  let current = [...inputShape];

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const prev = [...current];

    switch (layer.type) {
      case 'dense': {
        if (!is1D(current)) {
          errors.push(
            `Layer ${i + 1} (dense): expected 1D input, got [${current.join(', ')}]`
          );
        }
        current = [layer.units ?? 64];
        break;
      }
      case 'conv2d': {
        if (!is3D(current)) {
          errors.push(
            `Layer ${i + 1} (conv2d): expected 3D input [H,W,C], got [${current.join(', ')}]`
          );
          current = [8, 8, layer.filters ?? 32];
        } else {
          const [h, w, cIn] = current;
          const k = layer.kernelSize ?? 3;
          const pad = layer.padding ?? 'same';
          const filters = layer.filters ?? 32;
          const hOut = convOutputSize(h, k, pad);
          const wOut = convOutputSize(w, k, pad);
          if (hOut <= 0 || wOut <= 0) {
            errors.push(`Layer ${i + 1} (conv2d): invalid output dimensions`);
          }
          current = [hOut, wOut, filters];
          if (cIn === undefined) {
            errors.push(`Layer ${i + 1} (conv2d): missing input channels`);
          }
        }
        break;
      }
      case 'flatten': {
        const product = current.reduce((a, b) => a * b, 1);
        current = [product];
        break;
      }
      case 'dropout':
      case 'batchnorm':
      case 'activation':
        break;
      default:
        errors.push(`Layer ${i + 1}: unknown type "${layer.type}"`);
    }

    shapes.push([...current]);

    if (errors.length > 0 && i === layers.length - 1) break;
    void prev;
  }

  return { shapes, errors };
}

export function estimateParams(layers, inputShape, outputSize = 4) {
  const { shapes, errors } = calculateShapes(layers, inputShape);
  if (errors.length > 0 || shapes.length === 0) {
    const outDim = inputShape.reduce((a, b) => a * b, 1);
    return outDim * outputSize + outputSize;
  }

  let total = 0;
  let inDim = inputShape.reduce((a, b) => a * b, 1);

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    if (layer.type === 'dense') {
      const units = layer.units ?? 64;
      total += inDim * units + units;
      inDim = units;
    } else if (layer.type === 'conv2d') {
      const prevShape = i === 0 ? inputShape : shapes[i - 1];
      let cIn = 1;
      let k = layer.kernelSize ?? 3;
      if (is3D(prevShape) || (i > 0 && shapes[i - 1]?.length === 3)) {
        const shape = shapes[i - 1] ?? prevShape;
        cIn = shape[2] ?? 1;
      } else if (is3D(inputShape)) {
        cIn = inputShape[2];
      }
      const filters = layer.filters ?? 32;
      total += k * k * cIn * filters + filters;
      inDim = shapes[i].reduce((a, b) => a * b, 1);
    } else if (layer.type === 'flatten') {
      inDim = shapes[i][0];
    }
  }

  const lastDim = shapes[shapes.length - 1];
  const finalIn = Array.isArray(lastDim)
    ? lastDim.reduce((a, b) => a * b, 1)
    : inDim;
  total += finalIn * outputSize + outputSize;

  return Math.round(total);
}

export function complexityLabel(paramCount) {
  if (paramCount < 50_000) return 'Simple';
  if (paramCount < 500_000) return 'Moderate';
  return 'Complex';
}
