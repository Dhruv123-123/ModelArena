/**
 * Offline script: writes Keras-format TF.js artifacts to server/models/.
 * Weights are random placeholders — real trained weights come from browser training + export.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function randomWeights(count, scale = 0.1) {
  const arr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = (Math.random() * 2 - 1) * scale;
  }
  return arr;
}

function buildSequentialModel(layers, name) {
  const tfLayers = [];
  const weightSpecs = [];
  const weightArrays = [];
  let offset = 0;

  layers.forEach((layer, idx) => {
    if (layer.type === 'dense') {
      const config = {
        units: layer.units,
        activation: layer.activation ?? 'relu',
        use_bias: true,
        kernel_initializer: {
          class_name: 'GlorotUniform',
          config: { seed: null },
        },
        bias_initializer: {
          class_name: 'Zeros',
          config: {},
        },
      };
      if (layer.inputShape) {
        config.batch_input_shape = [null, ...layer.inputShape];
      }
      tfLayers.push({
        class_name: 'Dense',
        config,
        name: `${name}_dense_${idx}`,
      });

      const inDim = layer.inputShape
        ? layer.inputShape.reduce((a, b) => a * b, 1)
        : layers[idx - 1].units;
      const kernelCount = inDim * layer.units;
      const biasCount = layer.units;
      weightSpecs.push(
        {
          name: `${name}_dense_${idx}/kernel`,
          shape: [inDim, layer.units],
          dtype: 'float32',
        },
        {
          name: `${name}_dense_${idx}/bias`,
          shape: [layer.units],
          dtype: 'float32',
        }
      );
      const kernel = randomWeights(kernelCount);
      const bias = randomWeights(biasCount, 0.01);
      weightArrays.push(kernel, bias);
      offset += kernelCount + biasCount;
      void offset;
    }
  });

  const totalFloats = weightArrays.reduce((s, a) => s + a.length, 0);
  const combined = new Float32Array(totalFloats);
  let pos = 0;
  for (const arr of weightArrays) {
    combined.set(arr, pos);
    pos += arr.length;
  }

  return {
    modelTopology: {
      class_name: 'Sequential',
      config: { name, layers: tfLayers },
      keras_version: '2.4.0',
      backend: 'tensorflow',
    },
    weightSpecs,
    weightBuffer: combined.buffer,
  };
}

function writeModel(dirName, spec) {
  const dir = join(__dirname, 'models', dirName);
  mkdirSync(dir, { recursive: true });

  const { modelTopology, weightSpecs, weightBuffer } = spec;
  const manifest = [
    {
      paths: ['weights.bin'],
      weights: weightSpecs,
    },
  ];

  writeFileSync(
    join(dir, 'model.json'),
    JSON.stringify(
      {
        modelTopology,
        weightsManifest: manifest,
        format: 'layers-model',
        generatedBy: 'ModelArena generate-models.js',
        note: 'Placeholder weights — train in browser for real policies',
      },
      null,
      2
    )
  );

  writeFileSync(join(dir, 'weights.bin'), Buffer.from(weightBuffer));
  console.log(`Wrote ${dirName} (${weightSpecs.length} weight tensors)`);
}

writeModel(
  'snake-snakebot-v1',
  buildSequentialModel(
    [
      { type: 'dense', inputShape: [20], units: 128, activation: 'relu' },
      { type: 'dense', units: 64, activation: 'relu' },
      { type: 'dense', units: 4, activation: 'linear' },
    ],
    'snake_snakebot'
  )
);

writeModel(
  'cartpole-balancebot',
  buildSequentialModel(
    [
      { type: 'dense', inputShape: [4], units: 64, activation: 'relu' },
      { type: 'dense', units: 32, activation: 'relu' },
      { type: 'dense', units: 2, activation: 'linear' },
    ],
    'cartpole_balance'
  )
);

console.log('Done. Copy server/models to public/models for Vite dev if needed.');
