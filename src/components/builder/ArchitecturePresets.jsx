import { motion } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'

export default function ArchitecturePresets() {
  const { loadPreset, getPresets } = useModelStore()
  const presets = getPresets()

  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted px-1 mb-2">Presets</p>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(presets).map(([key, preset]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => loadPreset(key)}
            className="px-2 py-1.5 rounded-lg bg-bg-card border border-border hover:border-border-light text-left transition-all"
          >
            <div className="text-[11px] font-medium text-text-primary">{preset.name}</div>
            <div className="text-[10px] text-text-muted font-mono">{preset.layers.length} layers</div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
