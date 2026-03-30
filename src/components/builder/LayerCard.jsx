import { useState } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'
import LayerExplainer from '../learning/LayerExplainer'

const LAYER_COLORS = {
  dense: 'var(--color-secondary)',
  conv2d: '#8B5CF6',
  dropout: 'var(--color-warning)',
  batchnorm: 'var(--color-primary)',
  flatten: 'var(--color-tertiary)',
  activation: '#06B6D4',
}

const LAYER_ICONS = {
  dense: 'hub',
  conv2d: 'grid_view',
  dropout: 'blur_on',
  batchnorm: 'equalizer',
  flatten: 'view_stream',
  activation: 'bolt',
}

const ACTIVATIONS = ['relu', 'sigmoid', 'tanh', 'leaky_relu', 'swish', 'elu', 'linear']

function NumberInput({ label, value, onChange, min = 1, max = 1024, step = 1 }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-text-secondary font-label uppercase tracking-wider">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min} max={max} step={step}
        className="w-24 px-3 py-1.5 bg-bg-primary border border-border rounded-lg text-xs font-mono text-text-primary focus:border-primary/50 focus:outline-none transition-colors"
      />
    </div>
  )
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-text-secondary font-label uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-28 px-3 py-1.5 bg-bg-primary border border-border rounded-lg text-xs font-mono text-text-primary focus:border-primary/50 focus:outline-none transition-colors"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export default function LayerCard({
  layer,
  index,
  shape,
  isSelected,
  hasError,
  errorMessage,
  dragHandleProps,
  isDragging = false,
}) {
  const { selectLayer, updateLayer, removeLayer } = useModelStore()
  const [showExplainer, setShowExplainer] = useState(false)
  const color = LAYER_COLORS[layer.type] || '#666'
  const icon = LAYER_ICONS[layer.type] || 'layers'

  const renderConfig = () => {
    if (!isSelected) return null
    switch (layer.type) {
      case 'dense':
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <NumberInput label="Units" value={layer.units} onChange={(v) => updateLayer(layer.id, { units: v })} />
            <SelectInput label="Activation" value={layer.activation} onChange={(v) => updateLayer(layer.id, { activation: v })} options={ACTIVATIONS} />
          </div>
        )
      case 'conv2d':
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <NumberInput label="Filters" value={layer.filters} onChange={(v) => updateLayer(layer.id, { filters: v })} />
            <NumberInput label="Kernel" value={layer.kernelSize} onChange={(v) => updateLayer(layer.id, { kernelSize: v })} min={1} max={7} />
            <SelectInput label="Activation" value={layer.activation} onChange={(v) => updateLayer(layer.id, { activation: v })} options={ACTIVATIONS} />
            <SelectInput label="Padding" value={layer.padding} onChange={(v) => updateLayer(layer.id, { padding: v })} options={['same', 'valid']} />
          </div>
        )
      case 'dropout':
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <NumberInput label="Rate" value={layer.rate} onChange={(v) => updateLayer(layer.id, { rate: v })} min={0} max={0.9} step={0.05} />
          </div>
        )
      case 'activation':
        return (
          <div className="space-y-3 mt-3 pt-3 border-t border-border">
            <SelectInput label="Function" value={layer.activation} onChange={(v) => updateLayer(layer.id, { activation: v })} options={ACTIVATIONS} />
          </div>
        )
      default: return null
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
    <M.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0, scale: isDragging ? 1.02 : 1 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onClick={() => selectLayer(isSelected ? null : layer.id)}
      className={`rounded-xl border cursor-pointer transition-all ${
        hasError ? 'border-error/50 bg-error/5'
          : isSelected ? 'border-primary/30 bg-bg-hover'
          : 'border-border bg-bg-card hover:border-border-light'
      } ${isDragging ? 'shadow-lg ring-1 ring-primary/20 z-10' : ''}`}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {dragHandleProps && (
          <button
            type="button"
            className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-secondary cursor-grab active:cursor-grabbing touch-none border border-transparent hover:border-border hover:bg-bg-hover"
            aria-label="Drag to reorder"
            {...dragHandleProps}
            onClick={(e) => {
              dragHandleProps.onClick?.(e)
              e.stopPropagation()
            }}
          >
            <span className="material-symbols-outlined text-sm">drag_indicator</span>
          </button>
        )}
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: color + '18', color }}
        >
          <span className="material-symbols-outlined text-lg">{icon}</span>
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary capitalize font-label tracking-tight">{layer.type}</span>
            <span className="text-[10px] font-mono text-text-muted truncate">{getSummary()}</span>
          </div>
          {shape && (
            <span className={`text-[10px] font-mono ${hasError ? 'text-error' : 'text-text-muted'}`}>
              &rarr; [{shape.join(', ')}]
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-text-ghost bg-bg-hover px-2 py-0.5 rounded-full">#{index + 1}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setShowExplainer(!showExplainer) }}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
            showExplainer ? 'text-secondary bg-secondary/10' : 'text-text-muted hover:text-secondary hover:bg-secondary/10'
          }`}
          title="What does this layer do?"
        >
          <span className="material-symbols-outlined text-sm">help</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-error hover:bg-error/10 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      {hasError && errorMessage && (
        <div className="px-4 pb-3">
          <p className="text-[11px] text-error font-mono">{errorMessage}</p>
        </div>
      )}

      {isSelected && (
        <M.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 pb-4"
        >
          {renderConfig()}
        </M.div>
      )}

      <AnimatePresence>
        {showExplainer && (
          <M.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3"
          >
            <LayerExplainer layerType={layer.type} />
          </M.div>
        )}
      </AnimatePresence>
    </M.div>
  )
}
