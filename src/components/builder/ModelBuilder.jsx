import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { motion as M } from 'framer-motion'
import useModelStore from '../../stores/useModelStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import { calculateShapes, getInputShape, estimateParameterCount } from '../../utils/shapeCalculator'
import LayerPalette from './LayerPalette'
import LayerCard from './LayerCard'
import ArchitecturePresets from './ArchitecturePresets'
import ShapePropagator from './ShapePropagator'
import NetworkGraph from '../viz/NetworkGraph'
import GameTutorial from '../learning/GameTutorial'
import ModelSaveLoad from './ModelSaveLoad'

export default function ModelBuilderView() {
  const { layers, selectedLayerId, modelName, setModelName, clearAll, reorderLayers, loadPreset, getPresets } = useModelStore()
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  const inputShape = getInputShape(activeGameId)
  const { shapes, errors } = calculateShapes(layers, inputShape)
  const paramCount = layers.length
    ? estimateParameterCount(layers, inputShape, game.outputSize)
    : 0
  const complexityLabel = paramCount < 50_000 ? 'Simple' : paramCount < 500_000 ? 'Moderate' : 'Complex'

  const onLayerDragEnd = (result) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    reorderLayers(result.source.index, result.destination.index)
  }

  const presets = getPresets()

  const BLUEPRINT_CARDS = [
    {
      key: 'starter',
      icon: 'account_tree',
      color: 'primary',
      badge: 'BASIC',
      title: 'MLP Core',
      desc: 'A streamlined multi-layer perceptron. Optimized for low-latency linear decision trees and basic spatial logic.',
    },
    {
      key: 'deep',
      icon: 'memory',
      color: 'secondary',
      badge: 'AGENT',
      title: 'Reinforce RL',
      desc: 'Deep Reinforcement Learning shell with integrated replay buffer. Best for autonomous game agents.',
    },
    {
      key: 'wide',
      icon: 'layers',
      color: 'tertiary',
      badge: 'POWER',
      title: 'Wide Net',
      desc: 'Wide neural network with large hidden layers. Higher parameter count for complex spatial feature extraction.',
    },
  ]

  return (
    <div className="h-full flex gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Builder Area (Left/Center) */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Main Workspace */}
        <section className="flex-1 flex flex-col glass-panel rounded-xl p-8 relative overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] pointer-events-none" />

          {layers.length === 0 ? (
            /* Empty State: Blueprint Selection */
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-1.5 h-6 bg-primary" />
                  <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase">Neural Workspace</h2>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xl">
                  Initialize your architecture by selecting a foundational blueprint.
                  Each starter provides a refined neural layout optimized for specific behavioral tasks.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {BLUEPRINT_CARDS.map((card) => {
                  const preset = presets[card.key]
                  return (
                    <button
                      key={card.key}
                      onClick={() => loadPreset(card.key)}
                      className={`blueprint-card group cursor-pointer border border-border-light p-6 rounded-xl flex flex-col h-full relative overflow-hidden text-left`}
                    >
                      <div className="absolute inset-0 kinetic-pattern opacity-30 group-hover:opacity-50 transition-opacity" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                          <div className={`w-12 h-12 rounded-lg bg-${card.color}/10 border border-${card.color}/20 flex items-center justify-center`}>
                            <span className={`material-symbols-outlined text-${card.color} text-2xl`}>{card.icon}</span>
                          </div>
                          <span className={`font-label text-[9px] py-1 px-2.5 bg-${card.color}/10 text-${card.color} uppercase tracking-[0.2em] font-black rounded-full border border-${card.color}/20`}>
                            {card.badge}
                          </span>
                        </div>
                        <h3 className="font-black text-xl mb-3 tracking-tight">{card.title}</h3>
                        <p className="text-xs text-text-secondary leading-relaxed mb-6 flex-1">{card.desc}</p>
                        <p className="text-[10px] font-mono text-text-muted mb-4">
                          {preset ? `${preset.length} layers` : ''}
                        </p>
                        <div className={`w-full py-3 bg-bg-hover border border-border text-[10px] font-label uppercase tracking-[0.2em] font-black text-center group-hover:bg-${card.color} group-hover:text-bg-primary group-hover:border-${card.color} transition-all rounded-lg`}>
                          Initialize
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            /* Active State: Layer Stack */
            <>
              <GameTutorial />
              <div className="flex items-center gap-4 mb-6">
                <input
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="bg-transparent border-b border-border text-lg font-bold text-text-primary focus:border-primary focus:outline-none pb-1 w-56 transition-colors font-label tracking-tight"
                />
                <M.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={clearAll}
                  className="px-4 py-2 text-[10px] font-label uppercase tracking-[0.2em] font-black text-text-muted hover:text-error rounded-lg hover:bg-error/5 transition-colors border border-border"
                >
                  Reset Canvas
                </M.button>
              </div>

              {/* Toolbox Row */}
              <div className="flex gap-3 mb-4">
                <ArchitecturePresets />
                <LayerPalette />
              </div>

              {/* Input indicator */}
              <div className="mb-2 px-4 py-3 rounded-lg flex items-center justify-between bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold bg-primary/15 text-primary">&rarr;</span>
                  <span className="text-sm font-bold text-text-primary font-label uppercase tracking-wider">Input</span>
                </div>
                <span className="text-xs font-mono text-text-muted">[{inputShape.join(', ')}] — {game.name}</span>
              </div>

              {/* Layer Stack */}
              <DragDropContext onDragEnd={onLayerDragEnd}>
                <Droppable droppableId="model-layers">
                  {(dropProvided) => (
                    <div
                      ref={dropProvided.innerRef}
                      {...dropProvided.droppableProps}
                      className="space-y-2 min-h-[48px]"
                    >
                      {layers.map((layer, index) => {
                        const shape = shapes[index + 1]?.shape
                        const error = errors.find((e) => e.layerId === layer.id)
                        return (
                          <Draggable key={layer.id} draggableId={layer.id} index={index}>
                            {(dragProvided, snapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                style={dragProvided.draggableProps.style}
                              >
                                <LayerCard
                                  layer={layer}
                                  index={index}
                                  shape={shape}
                                  isSelected={selectedLayerId === layer.id}
                                  hasError={!!error}
                                  errorMessage={error?.message}
                                  dragHandleProps={dragProvided.dragHandleProps}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {dropProvided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Output indicator */}
              <div className="mt-2 px-4 py-3 rounded-lg flex items-center justify-between bg-error/5 border border-error/20">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-bold bg-error/15 text-error">&larr;</span>
                  <span className="text-sm font-bold text-text-primary font-label uppercase tracking-wider">Output (auto)</span>
                </div>
                <span className="text-xs font-mono text-text-muted">[{game.outputSize}] — {game.actionLabels.join(', ')}</span>
              </div>

              <div className="mt-4">
                <ShapePropagator />
              </div>
            </>
          )}

          {/* Complexity Counter Footer */}
          <div className="mt-auto pt-6 flex items-center justify-between border-t border-border">
            <div className="flex flex-col">
              <span className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted mb-1">Architecture Stats</span>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-primary font-bold">PARAMETERS: {paramCount > 0 ? (paramCount / 1e6).toFixed(2) + 'M' : '0.00M'}</span>
                <span className="w-px h-3 bg-border" />
                <span className="text-[10px] text-text-secondary font-medium">{complexityLabel}</span>
              </div>
            </div>
            {layers.length > 0 && (
              <ModelSaveLoad />
            )}
          </div>
        </section>
      </div>

      {/* Right Panel: Network Graph + Tip */}
      <aside className="w-80 flex flex-col gap-4 shrink-0">
        <div className="flex-1 glass-panel rounded-xl flex flex-col overflow-hidden">
          {/* Visualization Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-bg-hover">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary status-pulse" />
              <span className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-text-primary/80">Network Graph</span>
            </div>
            <span className="font-mono text-[9px] py-1 px-2 rounded bg-secondary/10 text-secondary border border-secondary/20 font-bold">INTERACTIVE</span>
          </div>

          {/* Graph Content */}
          <div className="flex-1 relative p-2">
            <NetworkGraph width={290} height={Math.max(350, (layers.length + 2) * 60 + 80)} />
          </div>

          {/* Zoom Controls */}
          <div className="p-3 bg-bg-primary/20 border-t border-border flex items-center justify-center gap-6">
            <button className="p-1.5 hover:bg-bg-hover rounded-full transition-colors text-text-muted hover:text-text-primary">
              <span className="material-symbols-outlined text-lg">zoom_in</span>
            </button>
            <button className="p-1.5 hover:bg-bg-hover rounded-full transition-colors text-text-muted hover:text-text-primary">
              <span className="material-symbols-outlined text-lg">zoom_out</span>
            </button>
            <div className="w-px h-5 bg-border" />
            <button className="p-1.5 hover:bg-bg-hover rounded-full transition-colors text-text-muted hover:text-text-primary">
              <span className="material-symbols-outlined text-lg">center_focus_strong</span>
            </button>
          </div>
        </div>

        {/* Efficiency Insight */}
        <div className="p-5 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 blur-[40px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
              <h4 className="font-label text-[10px] uppercase tracking-[0.2em] font-black text-primary">Efficiency Insight</h4>
            </div>
            <p className="text-[11px] text-text-primary/70 leading-relaxed font-medium">
              Lower parameter counts typically lead to <span className="text-primary">faster convergence</span> for 2D logic tasks. Start minimal and scale up layers as complexity evolves.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}
