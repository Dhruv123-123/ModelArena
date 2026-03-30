import { useMemo, useEffect, useRef } from 'react'
import * as tf from '@tensorflow/tfjs'
import { motion as M } from 'framer-motion'

/**
 * Visualizes the activations of intermediate layers of a model.
 * @param {tf.LayersModel} model - The model to extract activations from.
 * @param {number[]} state - The current game state to pass through the model.
 * @param {string[]} layerIds - Optional: specific layer IDs to visualize.
 */
export default function ActivationVisualizer({ model, state, layerIds = null }) {
  const containerRef = useRef(null)

  // Memoize the intermediate model to avoid rebuilding on every tick
  const intermediateModel = useMemo(() => {
    if (!model) return null
    try {
      // Create a model that outputs every layer's result
      const layers = layerIds 
        ? model.layers.filter(l => layerIds.includes(l.id))
        : model.layers.filter(l => !l.name.includes('input') && !l.name.includes('reshape') && !l.name.includes('flatten'))
      
      if (layers.length === 0) return null

      return tf.model({
        inputs: model.inputs,
        outputs: layers.map(l => l.output)
      })
    } catch (err) {
      console.error('Failed to create intermediate model:', err)
      return null
    }
  }, [model, layerIds])

  // Extract activations for the current state
  const activations = useMemo(() => {
    if (!intermediateModel || !state) return []
    return tf.tidy(() => {
      try {
        const inputTensor = tf.tensor2d([state])
        const preds = intermediateModel.predict(inputTensor)
        const predsArray = Array.isArray(preds) ? preds : [preds]
        
        return predsArray.map((tensor, i) => {
          const data = Array.from(tensor.dataSync())
          const layer = intermediateModel.outputs[i].name.split('/')[0]
          return {
            name: layer,
            values: data,
            shape: tensor.shape.slice(1) // exclude batch dim
          }
        })
      } catch (err) {
        console.error('Inference failed in ActivationVisualizer:', err)
        return []
      }
    })
  }, [intermediateModel, state])

  if (!model || !state || activations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-ghost text-xs">
        No activations to show
      </div>
    )
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {activations.map((layer, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-widest text-text-muted font-medium">
              {layer.name.replace(/_(\d+)$/, ' #$1')}
            </span>
            <span className="text-[10px] font-mono text-text-ghost">
              [{layer.shape.join(' × ')}]
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1 p-2 bg-bg-primary/40 rounded-lg border border-border/40">
            {layer.values.map((val, vIdx) => {
              // Normalize value for visualization (assuming typical activation ranges)
              const intensity = Math.min(Math.max(val, 0), 1)
              const heat = val > 0 ? `rgba(99, 102, 241, ${0.1 + intensity * 0.9})` : 'rgba(255, 255, 255, 0.05)'
              const border = val > 0.5 ? 'rgba(99, 102, 241, 0.4)' : 'transparent'
              
              return (
                <M.div
                  key={vIdx}
                  initial={false}
                  animate={{ backgroundColor: heat, borderColor: border }}
                  className="w-3 h-3 rounded-[2px] border transition-colors duration-100"
                  title={`Neuron ${vIdx}: ${val.toFixed(3)}`}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
