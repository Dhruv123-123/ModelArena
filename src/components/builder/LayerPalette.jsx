import { motion } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'
import useGameStore from '../../stores/useGameStore'

const LAYER_TYPES = [
  { type: 'dense', label: 'Dense', desc: 'Fully connected', color: '#3B82F6', icon: '◣' },
  { type: 'conv2d', label: 'Conv2D', desc: '2D convolution', color: '#8B5CF6', icon: '⊞', requires2D: true },
  { type: 'dropout', label: 'Dropout', desc: 'Regularization', color: '#F59E0B', icon: '◌' },
  { type: 'batchnorm', label: 'BatchNorm', desc: 'Normalize', color: '#10B981', icon: '≡' },
  { type: 'flatten', label: 'Flatten', desc: 'Reshape to 1D', color: '#EC4899', icon: '▬' },
  { type: 'activation', label: 'Activation', desc: 'Activation fn', color: '#06B6D4', icon: 'ƒ' },
]

const GAMES_WITH_2D_INPUT = new Set(['chess'])

export default function LayerPalette() {
  const addLayer = useModelStore((s) => s.addLayer)
  const activeGameId = useGameStore((s) => s.activeGameId)
  const has2DInput = GAMES_WITH_2D_INPUT.has(activeGameId)

  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-widest text-text-muted px-1 mb-2 font-medium">Add Layer</p>
      {LAYER_TYPES.map((lt) => {
        const disabled = lt.requires2D && !has2DInput
        return (
          <button
            key={lt.type}
            onClick={() => !disabled && addLayer(lt.type)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
              disabled
                ? 'opacity-25 cursor-not-allowed'
                : 'hover:bg-bg-hover'
            }`}
          >
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0"
              style={{ backgroundColor: lt.color + '15', color: lt.color }}
            >
              {lt.icon}
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-text-primary leading-tight">{lt.label}</div>
              <div className="text-[11px] text-text-muted leading-tight">
                {disabled ? 'Needs 2D input' : lt.desc}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
