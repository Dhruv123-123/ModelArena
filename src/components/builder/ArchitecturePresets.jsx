import useModelStore from '../../stores/useModelStore'

export default function ArchitecturePresets() {
  const { loadPreset, getPresets } = useModelStore()
  const presets = getPresets()

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-text-muted px-1 mb-2 font-medium">Presets</p>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => loadPreset(key)}
            className="px-2.5 py-2 rounded-lg text-left transition-all hover:bg-bg-hover"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-[13px] font-medium text-text-primary leading-tight">{preset.name}</div>
            <div className="text-[11px] text-text-muted font-mono">{preset.layers.length} layers</div>
          </button>
        ))}
      </div>
    </div>
  )
}
