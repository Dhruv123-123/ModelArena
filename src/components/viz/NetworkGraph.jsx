import { useRef, useEffect, useMemo } from 'react'
import useModelStore from '../../stores/useModelStore'
import useGameStore, { GAMES } from '../../stores/useGameStore'
import { getInputShape } from '../../utils/shapeCalculator'

const LAYER_COLORS = {
  input: '#6366F1', dense: '#3B82F6', conv2d: '#8B5CF6',
  dropout: '#F59E0B', batchnorm: '#10B981', flatten: '#EC4899',
  activation: '#06B6D4', output: '#EF4444',
}

export default function NetworkGraph({ width = 340, height = 500 }) {
  const canvasRef = useRef(null)
  const layers = useModelStore((s) => s.layers)
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  const nodes = useMemo(() => {
    const inputShape = getInputShape(activeGameId)
    const all = [
      { type: 'input', label: `Input [${inputShape.join(',')}]`, width: Math.min(inputShape[0], 20), color: LAYER_COLORS.input },
      ...layers.map(l => ({
        type: l.type, label: l.type === 'dense' ? `Dense(${l.units})` : l.type === 'conv2d' ? `Conv2D(${l.filters})` : l.type === 'dropout' ? `Dropout(${l.rate})` : l.type,
        width: l.type === 'dense' ? Math.min(l.units / 4, 30) : l.type === 'conv2d' ? Math.min(l.filters / 2, 30) : 10,
        color: LAYER_COLORS[l.type] || '#666',
      })),
      { type: 'output', label: `Output [${game.outputSize}]`, width: Math.min(game.outputSize * 2, 15), color: LAYER_COLORS.output },
    ]
    return all
  }, [layers, activeGameId, game])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)

    const padding = 40
    const nodeHeight = 28
    const gap = Math.min((height - padding * 2) / Math.max(nodes.length, 1), 55)

    nodes.forEach((node, i) => {
      const y = padding + i * gap
      const nodeWidth = Math.max(node.width * 6, 60)
      const x = (width - nodeWidth) / 2

      // Connection to next
      if (i < nodes.length - 1) {
        const nextWidth = Math.max(nodes[i + 1].width * 6, 60)
        const nextX = (width - nextWidth) / 2
        const nextY = padding + (i + 1) * gap

        ctx.strokeStyle = 'rgba(100, 100, 140, 0.3)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x + nodeWidth / 2, y + nodeHeight)
        ctx.lineTo(nextX + nextWidth / 2, nextY)
        ctx.stroke()

        // Animated particles
        const t = (Date.now() / 2000) % 1
        const px = x + nodeWidth / 2 + (nextX + nextWidth / 2 - x - nodeWidth / 2) * t
        const py = y + nodeHeight + (nextY - y - nodeHeight) * t
        ctx.fillStyle = node.color + '80'
        ctx.beginPath()
        ctx.arc(px, py, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Node background
      ctx.fillStyle = node.color + '15'
      ctx.strokeStyle = node.color + '40'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x, y, nodeWidth, nodeHeight, 6)
      ctx.fill()
      ctx.stroke()

      // Node glow
      ctx.shadowColor = node.color
      ctx.shadowBlur = 6
      ctx.beginPath()
      ctx.roundRect(x, y, nodeWidth, nodeHeight, 6)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Neuron dots
      const neuronCount = Math.min(Math.round(node.width), 12)
      const dotSpacing = nodeWidth / (neuronCount + 1)
      for (let d = 0; d < neuronCount; d++) {
        ctx.fillStyle = node.color + '60'
        ctx.beginPath()
        ctx.arc(x + dotSpacing * (d + 1), y + nodeHeight / 2, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Label
      ctx.fillStyle = '#E8E8F0'
      ctx.font = '10px JetBrains Mono'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(node.label, width / 2, y + nodeHeight + 3)
    })
  }, [nodes, width, height])

  // Animation loop for particles
  useEffect(() => {
    let frameId
    const animate = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const event = new Event('repaint')
        canvas.dispatchEvent(event)
      }
      frameId = requestAnimationFrame(animate)
    }
    // Re-render by triggering the main effect
    const interval = setInterval(() => {
      const canvas = canvasRef.current
      if (canvas) canvas.getContext('2d') // trigger re-render handled by dep change
    }, 50)
    return () => { cancelAnimationFrame(frameId); clearInterval(interval) }
  }, [])

  return (
    <div className="rounded-lg border border-border bg-bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Network Topology</p>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="block w-full" />
    </div>
  )
}
