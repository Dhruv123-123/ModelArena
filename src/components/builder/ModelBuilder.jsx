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

export default function ModelBuilderView() {
  const { layers, selectedLayerId, modelName, setModelName, clearAll, reorderLayers } = useModelStore()
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  const inputShape = getInputShape(activeGameId)
  const { shapes, errors } = calculateShapes(layers, inputShape)

  return (
    <div className="h-full flex">
      {/* Left: Layer palette */}
      <div className="w-52 border-r border-border bg-bg-secondary p-3 overflow-y-auto shrink-0 space-y-4">
        <ArchitecturePresets />
        <LayerPalette />
      </div>

      {/* Center: Layer stack */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Tutorial */}
        <GameTutorial />

        <div className="flex items-center gap-3 mb-4">
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="bg-transparent border-b border-border text-lg font-semibold text-text-primary focus:border-border-light focus:outline-none pb-1"
          />
          <button
            onClick={clearAll}
            className="px-2 py-1 text-[10px] text-text-muted hover:text-error border border-border rounded hover:border-error/30 transition-colors"
          >
            Clear All
          </button>
        </div>

        {/* Input indicator */}
        <div className="mb-2 px-3 py-2 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold bg-[#6366F1]/20 text-[#6366F1]">→</span>
            <span className="text-xs font-medium text-text-primary">Input Layer</span>
          </div>
          <span className="text-[10px] font-mono text-text-muted">[{inputShape.join(', ')}] — {game.name} state</span>
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
            className="mt-8 text-center py-12 border-2 border-dashed border-border rounded-lg"
          >
            <p className="text-text-muted text-sm">Add layers from the palette on the left</p>
            <p className="text-text-muted text-xs mt-1">or load a preset to get started</p>
          </motion.div>
        )}

        {/* Output indicator */}
        {layers.length > 0 && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-mono font-bold bg-[#EF4444]/20 text-[#EF4444]">←</span>
              <span className="text-xs font-medium text-text-primary">Output Layer (auto)</span>
            </div>
            <span className="text-[10px] font-mono text-text-muted">[{game.outputSize}] — {game.actionLabels.join(', ')}</span>
          </div>
        )}

        <ShapePropagator />
      </div>

      {/* Right: Network visualization */}
      <div className="w-[360px] border-l border-border bg-bg-secondary p-3 overflow-y-auto shrink-0">
        <NetworkGraph width={340} height={Math.max(400, (layers.length + 2) * 60 + 80)} />
      </div>
    </div>
  )
}
