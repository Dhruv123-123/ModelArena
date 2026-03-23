import { motion, AnimatePresence } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import { calculateShapes, getInputShape } from '../../utils/shapeCalculator'
import LayerPalette from './LayerPalette'
import LayerCard from './LayerCard'
import ArchitecturePresets from './ArchitecturePresets'
import ShapePropagator from './ShapePropagator'
import NetworkGraph from '../viz/NetworkGraph'
import GameTutorial from '../learning/GameTutorial'
import ModelSaveLoad from './ModelSaveLoad'

export default function ModelBuilderView() {
  const { layers, selectedLayerId, modelName, setModelName, clearAll } = useModelStore()
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  const inputShape = getInputShape(activeGameId)
  const { shapes, errors } = calculateShapes(layers, inputShape)

  return (
    <div className="h-full flex">
      {/* Left: Layer palette */}
      <div className="w-56 border-r border-border bg-bg-secondary p-3 overflow-y-auto shrink-0 space-y-5">
        <ArchitecturePresets />
        <LayerPalette />
        <div className="pt-4 border-t border-border">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-3 font-medium">Save / Load</p>
          <ModelSaveLoad />
        </div>
      </div>

      {/* Center: Layer stack */}
      <div className="flex-1 overflow-y-auto p-6">
        <GameTutorial />

        <div className="flex items-center gap-4 mb-6">
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="bg-transparent border-b border-border text-lg font-semibold text-text-primary focus:border-border-light focus:outline-none pb-1 w-56 transition-colors"
          />
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs text-text-muted hover:text-error rounded-lg hover:bg-error/5 transition-colors font-medium"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Clear All
          </button>
        </div>

        {/* Input indicator */}
        <div className="mb-2 px-3.5 py-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.12)' }}>
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>&rarr;</span>
            <span className="text-sm font-medium text-text-primary">Input</span>
          </div>
          <span className="text-xs font-mono text-text-muted">[{inputShape.join(', ')}] — {game.name}</span>
        </div>

        {/* Layers */}
        <div className="space-y-2">
          <AnimatePresence>
            {layers.map((layer, index) => {
              const shape = shapes[index + 1]?.shape
              const error = errors.find(e => e.layerId === layer.id)
              return (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  index={index}
                  shape={shape}
                  isSelected={selectedLayerId === layer.id}
                  hasError={!!error}
                  errorMessage={error?.message}
                />
              )
            })}
          </AnimatePresence>
        </div>

        {layers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center py-14 rounded-xl"
            style={{ border: '2px dashed rgba(255,255,255,0.06)' }}
          >
            <p className="text-text-muted text-sm mb-1">Add layers from the palette on the left</p>
            <p className="text-text-ghost text-xs">or load a preset to get started</p>
          </motion.div>
        )}

        {/* Output indicator */}
        {layers.length > 0 && (
          <div className="mt-2 px-3.5 py-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.12)' }}>
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>&larr;</span>
              <span className="text-sm font-medium text-text-primary">Output (auto)</span>
            </div>
            <span className="text-xs font-mono text-text-muted">[{game.outputSize}] — {game.actionLabels.join(', ')}</span>
          </div>
        )}

        <div className="mt-4">
          <ShapePropagator />
        </div>
      </div>

      {/* Right: Network visualization */}
      <div className="w-[340px] border-l border-border bg-bg-secondary p-4 overflow-y-auto shrink-0">
        <NetworkGraph width={310} height={Math.max(400, (layers.length + 2) * 60 + 80)} />
      </div>
    </div>
  )
}
