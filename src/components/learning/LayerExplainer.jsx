const EXPLAINERS = {
  dense:
    'Fully connected layer — every input connects to every neuron. Great for tabular state vectors like Snake or CartPole.',
  conv2d:
    'Convolutional layer — learns spatial patterns on grid inputs. Requires 3D input shape [height, width, channels].',
  dropout:
    'Randomly drops activations during training to prevent overfitting. Typical rates: 0.1–0.3.',
  batchnorm:
    'Normalizes activations per batch for stabler gradients. Often used after conv or dense layers.',
  flatten:
    'Reshapes multi-dimensional tensors into 1D for dense layers. Required between conv blocks and MLP heads.',
  activation:
    'Applies a non-linearity (ReLU, tanh, etc.) without changing tensor shape. Adds expressiveness between linear layers.',
};

export function LayerExplainer({ layerType, hoveredType }) {
  const type = hoveredType ?? layerType ?? 'dense';
  const text = EXPLAINERS[type] ?? 'Select or add a layer to see how it works.';

  return (
    <div className="rounded-lg border border-border bg-bg-elevated/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        Layer guide
      </p>
      <p className="mt-1 text-sm capitalize text-primary">{type}</p>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">{text}</p>
    </div>
  );
}
