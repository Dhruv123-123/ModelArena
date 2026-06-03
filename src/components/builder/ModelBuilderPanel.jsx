import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { LayerPalette } from './LayerPalette';
import { ArchitecturePresets } from './ArchitecturePresets';
import { LayerCard } from './LayerCard';
import { ShapePropagator } from './ShapePropagator';
import { NetworkGraph } from './NetworkGraph';
import { ModelSaveLoad } from './ModelSaveLoad';
import {
  calculateShapes,
  complexityLabel,
  estimateParams,
  getInputShape,
} from '../../utils/shapeCalculator';
import { getGameById, useGameStore } from '../../stores/useGameStore';
import { useModelStore } from '../../stores/useModelStore';
import { LayerExplainer } from '../learning/LayerExplainer';

export function ModelBuilderPanel() {
  const [saveOpen, setSaveOpen] = useState(false);
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [hoveredType, setHoveredType] = useState(null);
  const activeGameId = useGameStore((s) => s.activeGameId);
  const layers = useModelStore((s) => s.layers);
  const reorderLayers = useModelStore((s) => s.reorderLayers);
  const game = getGameById(activeGameId);
  const inputShape = getInputShape(activeGameId);
  const { shapes, errors } = calculateShapes(layers, inputShape);
  const paramCount = estimateParams(
    layers,
    inputShape,
    game?.outputSize ?? 4
  );

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = [...layers];
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    reorderLayers(items);
  };

  const layerHasError = (i) =>
    errors.some((e) => e.includes(`Layer ${i + 1}`));

  return (
    <div className="flex h-full min-h-0 flex-col p-4 lg:p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside className="w-full shrink-0 space-y-4 lg:w-[28%]">
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Layers
            </h3>
            <LayerPalette />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">
              Presets
            </h3>
            <ArchitecturePresets />
          </div>
          <LayerExplainer
            layerType={layers[layers.length - 1]?.type}
            hoveredType={hoveredType}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="layers">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="max-h-[40vh] space-y-2 overflow-y-auto lg:max-h-none lg:flex-1"
                >
                  {layers.length === 0 && (
                    <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-12 text-center">
                      <span className="text-4xl opacity-40">🧠</span>
                      <p className="mt-3 text-sm text-text-base">
                        No layers yet
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Add from the palette or pick a preset to start building
                      </p>
                    </div>
                  )}
                  {layers.map((layer, index) => (
                    <Draggable
                      key={layer.id}
                      draggableId={layer.id}
                      index={index}
                    >
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                        >
                          <div
                            onMouseEnter={() => setHoveredType(layer.type)}
                            onMouseLeave={() => setHoveredType(null)}
                          >
                            <LayerCard
                              layer={layer}
                              index={index}
                              shape={shapes[index]}
                              hasError={layerHasError(index)}
                              dragHandleProps={dragProvided.dragHandleProps}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="glass-panel rounded-lg p-2">
            <ShapePropagator />
          </div>
        </section>

        <aside
          className={`shrink-0 transition-all ${
            graphExpanded ? 'w-full lg:w-[300px]' : 'w-full lg:w-16'
          }`}
        >
          <button
            type="button"
            onClick={() => setGraphExpanded((v) => !v)}
            className="mb-2 w-full rounded-lg border border-border py-1 text-xs text-text-muted lg:hidden"
          >
            {graphExpanded ? 'Hide' : 'Show'} graph
          </button>
          <div className={`${graphExpanded ? 'block' : 'hidden lg:block'}`}>
            <NetworkGraph layers={layers} />
          </div>
        </aside>
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm text-text-muted">
          <span className="font-mono-nums text-text-base">
            {paramCount.toLocaleString()}
          </span>{' '}
          parameters ·{' '}
          <span className="text-primary">{complexityLabel(paramCount)}</span>
        </div>
        <button
          type="button"
          onClick={() => setSaveOpen(true)}
          className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20"
        >
          Save Architecture
        </button>
      </footer>

      <ModelSaveLoad open={saveOpen} onClose={() => setSaveOpen(false)} />
    </div>
  );
}
