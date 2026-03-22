import { motion } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'

const LAYER_TYPES = [
  { type: 'dense', label: 'Dense', desc: 'Fully connected layer', color: '#3B82F6', icon: '▣' },
  { type: 'conv2d', label: 'Conv2D', desc: '2D convolution', color: '#8B5CF6', icon: '⊞' },
  { type: 'dropout', label: 'Dropout', desc: 'Regularization', color: '#F59E0B', icon: '◌' },
  { type: 'batchnorm', label: 'BatchNorm', desc: 'Normalize activations', color: '#10B981', icon: '≡' },
  { type: 'flatten', label: 'Flatten', desc: 'Reshape to 1D', color: '#EC4899', icon: '▬' },
  { type: 'activation', label: 'Activation', desc: 'Activation function', color: '#06B6D4', icon: 'ƒ' },
]

export default function LayerPalette() {
  const addLayer = useModelStore((s) => s.addLayer)

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-text-muted px-1 mb-2">Add Layer</p>
      {LAYER_TYPES.map((lt) => (
        <motion.button
          key={lt.type}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => addLayer(lt.type)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-bg-card border border-border hover:border-border-light transition-all text-left group"
        >
          <span
            className="w-7 h-7 rounded flex items-center justify-center text-sm font-mono font-bold shrink-0"
            style={{ backgroundColor: lt.color + '20', color: lt.color }}
          >
            {lt.icon}
          </span>
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-primary group-hover:text-white transition-colors">{lt.label}</div>
            <div className="text-[10px] text-text-muted truncate">{lt.desc}</div>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
