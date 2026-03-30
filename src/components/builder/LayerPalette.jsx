import { useState } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'
import useGameStore from '../../stores/useGameStore'

const LAYER_TYPES = [
  { type: 'dense', label: 'Dense', desc: 'Fully connected', color: 'var(--color-secondary)', icon: 'hub' },
  { type: 'conv2d', label: 'Conv2D', desc: '2D convolution', color: '#8B5CF6', icon: 'grid_view', requires2D: true },
  { type: 'dropout', label: 'Dropout', desc: 'Regularization', color: 'var(--color-warning)', icon: 'blur_on' },
  { type: 'batchnorm', label: 'BatchNorm', desc: 'Normalize', color: 'var(--color-primary)', icon: 'equalizer' },
  { type: 'flatten', label: 'Flatten', desc: 'Reshape to 1D', color: 'var(--color-tertiary)', icon: 'view_stream' },
  { type: 'activation', label: 'Activation', desc: 'Activation fn', color: '#06B6D4', icon: 'bolt' },
]

const LAYER_HINTS = {
  dense: 'Every input connects to every output. The workhorse of neural networks.',
  conv2d: 'Slides a small filter across spatial input to detect local patterns. Needs 2D input.',
  dropout: 'Randomly zeroes neurons during training to prevent overfitting.',
  batchnorm: 'Normalizes layer outputs for faster, more stable training.',
  flatten: 'Reshapes multi-dimensional data to 1D. Required before Dense after Conv2D.',
  activation: 'Applies a non-linear function (ReLU, sigmoid, tanh) to the output.',
}

const GAMES_WITH_2D_INPUT = new Set(['chess'])

export default function LayerPalette() {
  const addLayer = useModelStore((s) => s.addLayer)
  const activeGameId = useGameStore((s) => s.activeGameId)
  const has2DInput = GAMES_WITH_2D_INPUT.has(activeGameId)
  const [hoveredType, setHoveredType] = useState(null)

  return (
    <div className="space-y-1">
      <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted px-1 mb-2 font-black">Add Layer</p>
      {LAYER_TYPES.map((lt) => {
        const disabled = lt.requires2D && !has2DInput
        return (
          <div key={lt.type} className="relative">
            <button
              onClick={() => !disabled && addLayer(lt.type)}
              onMouseEnter={() => setHoveredType(lt.type)}
              onMouseLeave={() => setHoveredType(null)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
                disabled
                  ? 'opacity-25 cursor-not-allowed'
                  : 'hover:bg-bg-hover'
              }`}
            >
              <span
                className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: lt.color + '15', color: lt.color }}
              >
                <span className="material-symbols-outlined text-base">{lt.icon}</span>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-text-primary leading-tight font-label tracking-tight">{lt.label}</div>
                <div className="text-[10px] text-text-muted leading-tight font-mono">
                  {disabled ? 'Needs 2D input' : lt.desc}
                </div>
              </div>
            </button>
            <AnimatePresence>
              {hoveredType === lt.type && (
                <M.div
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-full top-0 ml-2 z-50 w-52 px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-[11px] text-text-secondary leading-relaxed shadow-xl backdrop-blur-sm"
                >
                  {LAYER_HINTS[lt.type]}
                </M.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
