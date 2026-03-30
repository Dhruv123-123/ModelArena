import { useMemo } from 'react'
import useModelStore from '../../stores/useModelStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import { calculateShapes, getInputShape } from '../../utils/shapeCalculator'

export default function ShapePropagator() {
  const layers = useModelStore((s) => s.layers)
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  const { shapes, errors, outputShape } = useMemo(
    () => calculateShapes(layers, getInputShape(activeGameId)),
    [layers, activeGameId]
  )

  const outputMatch = outputShape.length === 1 && outputShape[0] === game.outputSize

  return (
    <div className="mt-4 p-4 rounded-xl bg-bg-hover border border-border">
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-secondary text-base">conversion_path</span>
        <p className="font-label text-[9px] uppercase tracking-[0.2em] text-text-muted font-black">Shape Flow</p>
      </div>
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between text-text-secondary">
          <span>Input</span>
          <span className="text-primary">[{getInputShape(activeGameId).join(', ')}]</span>
        </div>
        {layers.map((layer, i) => {
          const shape = shapes[i + 1]
          const hasError = errors.some(e => e.layerId === layer.id)
          return (
            <div key={layer.id} className={`flex justify-between ${hasError ? 'text-error' : 'text-text-muted'}`}>
              <span className="capitalize">{layer.type}</span>
              <span>{shape?.label || '?'}</span>
            </div>
          )
        })}
        <div className="border-t border-border pt-1.5 mt-1.5">
          <div className={`flex justify-between font-bold ${outputMatch ? 'text-primary' : 'text-warning'}`}>
            <span>Output</span>
            <span>[{game.outputSize}] {outputMatch ? '✓' : `(need [${game.outputSize}])`}</span>
          </div>
        </div>
      </div>
      {errors.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {errors.map((e, i) => (
            <p key={i} className="text-[10px] text-error font-mono">{e.message}</p>
          ))}
        </div>
      )}
    </div>
  )
}
