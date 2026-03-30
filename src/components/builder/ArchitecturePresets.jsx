import { motion as M } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'

export default function ArchitecturePresets() {
  const { loadPreset, getPresets } = useModelStore()
  const presets = getPresets()

  return (
    <div>
      <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted px-1 mb-2 font-black">Presets</p>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(presets).map(([key, preset]) => (
          <M.button
            key={key}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => loadPreset(key)}
            className="px-2.5 py-2 rounded-lg text-left transition-all hover:bg-bg-hover border border-border hover:border-primary/20"
          >
            <div className="text-[12px] font-bold text-text-primary leading-tight font-label tracking-tight">{preset.name}</div>
            <div className="text-[10px] text-text-muted font-mono">{preset.layers.length} layers</div>
          </M.button>
        ))}
      </div>
    </div>
  )
}
