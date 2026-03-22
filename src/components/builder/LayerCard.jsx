import { motion } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'

const LAYER_COLORS = {
  dense: '#3B82F6',
  conv2d: '#8B5CF6',
  dropout: '#F59E0B',
  batchnorm: '#10B981',
  flatten: '#EC4899',
  activation: '#06B6D4',
}

const LAYER_ICONS = {
  dense: '▣',
  conv2d: '⊞',
  dropout: '◌',
  batchnorm: '≡',
  flatten: '▬',
  activation: 'ƒ',
}

const ACTIVATIONS = ['relu', 'sigmoid', 'tanh', 'leaky_relu', 'swish', 'elu', 'linear']

function NumberInput({ label, value, onChange, min = 1, max = 1024, step = 1 }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-text-muted">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-20 px-2 py-1 bg-bg-primary border border-border rounded text-[11px] font-mono text-text-primary focus:border-border-light focus:outline-none"
      />
    </div>
  )
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 px-2 py-1 bg-bg-primary border border-border rounded text-[11px] font-mono text-text-primary focus:border-border-light focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export default function LayerCard({ layer, index, shape, isSelected, hasError, errorMessage }) {
  const { selectLayer, updateLayer, removeLayer } = useModelStore()
  const color = LAYER_COLORS[layer.type] || '#666'

  const renderConfig = () => {
    if (!isSelected) return null

    switch (layer.type) {
      case 'dense':
        return (
          <div className="space-y-2 mt-2 pt-2 border-t border-border">
            <NumberInput label="Units" value={layer.units} onChange={(v) => updateLayer(layer.id, { units: v })} />
            <SelectInput label="Activation" value={layer.activation} onChange={(v) => updateLayer(layer.id, { activation: v })} options={ACTIVATIONS} />
          </div>
        )
      case 'conv2d':
        return (
          <div className="space-y-2 mt-2 pt-2 border-t border-border">
            <NumberInput label="Filters" value={layer.filters} onChange={(v) => updateLayer(layer.id, { filters: v })} />
            <NumberInput label="Kernel Size" value={layer.kernelSize} onChange={(v) => updateLayer(layer.id, { kernelSize: v })} min={1} max={7} />
            <SelectInput label="Activation" value={layer.activation} onChange={(v) => updateLayer(layer.id, { activation: v })} options={ACTIVATIONS} />
            <SelectInput label="Padding" value={layer.padding} onChange={(v) => updateLayer(layer.id, { padding: v })} options={['same', 'valid']} />
          </div>
        )
      case 'dropout':
        return (
          <div className="space-y-2 mt-2 pt-2 border-t border-border">
            <NumberInput label="Rate" value={layer.rate} onChange={(v) => updateLayer(layer.id, { rate: v })} min={0} max={0.9} step={0.05} />
          </div>
        )
      case 'activation':
        return (
          <div className="space-y-2 mt-2 pt-2 border-t border-border">
            <SelectInput label="Function" value={layer.activation} onChange={(v) => updateLayer(layer.id, { activation: v })} options={ACTIVATIONS} />
          </div>
        )
      default:
        return null
    }
  }

  const getSummary = () => {
    switch (layer.type) {
      case 'dense': return `${layer.units} units, ${layer.activation}`
      case 'conv2d': return `${layer.filters} filters, ${layer.kernelSize}x${layer.kernelSize}`
      case 'dropout': return `rate ${layer.rate}`
      case 'batchnorm': return 'normalize'
      case 'flatten': return 'reshape to 1D'
      case 'activation': return layer.activation
      default: return ''
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      onClick={() => selectLayer(isSelected ? null : layer.id)}
      className={`rounded-lg border cursor-pointer transition-all ${
        hasError
          ? 'border-error/50 bg-error/5'
          : isSelected
          ? 'border-border-light bg-bg-hover'
          : 'border-border bg-bg-card hover:border-border-light'
      }`}
    >
      <div className="px-3 py-2 flex items-center gap-2.5">
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold shrink-0"
          style={{ backgroundColor: color + '20', color }}
        >
          {LAYER_ICONS[layer.type]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-primary capitalize">{layer.type}</span>
            <span className="text-[10px] font-mono text-text-muted truncate">{getSummary()}</span>
          </div>
          {shape && (
            <span className={`text-[10px] font-mono ${hasError ? 'text-error' : 'text-text-muted'}`}>
              → [{shape.join(', ')}]
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-text-muted">#{index + 1}</span>
        <button
          onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
          className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors text-xs"
        >
          ×
        </button>
      </div>

      {hasError && errorMessage && (
        <div className="px-3 pb-2">
          <p className="text-[10px] text-error">{errorMessage}</p>
        </div>
      )}

      {isSelected && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-3 pb-3"
        >
          {renderConfig()}
        </motion.div>
      )}
    </motion.div>
  )
}
