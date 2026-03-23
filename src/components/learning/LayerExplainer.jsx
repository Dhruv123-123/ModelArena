const EXPLANATIONS = {
  dense: {
    title: 'Dense (Fully Connected) Layer',
    analogy: 'Like a committee where every member considers every piece of evidence before voting.',
    detail: 'Each input connects to every output neuron. The "units" parameter is how many neurons are in this layer. More units = more capacity to learn complex patterns, but also more parameters to train.',
  },
  conv2d: {
    title: 'Convolutional 2D Layer',
    analogy: 'Like a magnifying glass that scans across an image looking for specific patterns (edges, shapes, textures).',
    detail: 'Slides a small filter across the input, detecting local patterns. "Filters" = how many patterns to look for. "Kernel size" = how big the magnifying glass is. Great for spatial data like chess boards.',
  },
  dropout: {
    title: 'Dropout Layer',
    analogy: 'Like studying for a test by randomly covering parts of your notes each time — forces you to learn the material from multiple angles.',
    detail: 'During training, randomly sets a fraction of inputs to zero (the "rate"). This prevents neurons from co-adapting and makes the network more robust. Disabled during inference.',
  },
  batchnorm: {
    title: 'Batch Normalization',
    analogy: 'Like a translator that normalizes accents so everyone speaks the same "dialect" between layers.',
    detail: 'Normalizes the output of the previous layer to have zero mean and unit variance. Makes training faster and more stable by reducing "internal covariate shift."',
  },
  flatten: {
    title: 'Flatten Layer',
    analogy: 'Like taking a 2D spreadsheet and reading all cells left-to-right, top-to-bottom into a single list.',
    detail: 'Reshapes multi-dimensional input into a 1D vector. Required between Conv2D and Dense layers since Dense expects 1D input.',
  },
  activation: {
    title: 'Activation Layer',
    analogy: 'Like a filter that decides which signals are strong enough to pass through to the next layer.',
    detail: 'Applies a non-linear function to the input. ReLU: passes positive values, blocks negative. Sigmoid: squashes to 0-1. Tanh: squashes to -1 to 1.',
  },
}

export default function LayerExplainer({ layerType }) {
  const info = EXPLANATIONS[layerType]
  if (!info) return null

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 space-y-2.5">
      <h4 className="text-sm font-semibold text-text-primary">{info.title}</h4>
      <p className="text-xs text-accent-cartpole italic leading-relaxed">{info.analogy}</p>
      <p className="text-xs text-text-secondary leading-relaxed">{info.detail}</p>
    </div>
  )
}
