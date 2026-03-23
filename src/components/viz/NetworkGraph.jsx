import { useRef, useEffect, useMemo, useCallback } from 'react'
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
  const frameRef = useRef(0)
  const animRef = useRef(null)
  const layers = useModelStore((s) => s.layers)
  const activeGameId = useGameStore((s) => s.activeGameId)
  const game = GAMES[activeGameId]

  const nodes = useMemo(() => {
    const inputShape = getInputShape(activeGameId)
    return [
      { type: 'input', label: `Input [${inputShape.join(',')}]`, width: Math.min(inputShape[0], 20), color: LAYER_COLORS.input },
      ...layers.map(l => ({
        type: l.type,
        label: l.type === 'dense' ? `Dense(${l.units})` : l.type === 'conv2d' ? `Conv2D(${l.filters})` : l.type === 'dropout' ? `Drop(${l.rate})` : l.type,
        width: l.type === 'dense' ? Math.min(l.units / 4, 30) : l.type === 'conv2d' ? Math.min(l.filters / 2, 30) : 10,
        color: LAYER_COLORS[l.type] || '#666',
      })),
      { type: 'output', label: `Output [${game.outputSize}]`, width: Math.min(game.outputSize * 2, 15), color: LAYER_COLORS.output },
    ]
  }, [layers, activeGameId, game])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    frameRef.current++
    const t = frameRef.current / 60

    const padding = 40
    const nodeHeight = 30
    const gap = Math.min((height - padding * 2) / Math.max(nodes.length, 1), 55)

    // Draw connections first (behind nodes)
    for (let i = 0; i < nodes.length - 1; i++) {
      const node = nodes[i]
      const next = nodes[i + 1]
      const y = padding + i * gap
      const nextY = padding + (i + 1) * gap
      const nodeWidth = Math.max(node.width * 6, 70)
      const nextWidth = Math.max(next.width * 6, 70)
      const x1 = width / 2
      const x2 = width / 2
      const y1 = y + nodeHeight
      const y2 = nextY

      // Connection line with gradient
      const grad = ctx.createLinearGradient(x1, y1, x2, y2)
      grad.addColorStop(0, node.color + '30')
      grad.addColorStop(1, next.color + '30')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      const cpY = (y1 + y2) / 2
      ctx.bezierCurveTo(x1, cpY, x2, cpY, x2, y2)
      ctx.stroke()

      // Multiple flowing particles
      for (let p = 0; p < 3; p++) {
        const pt = ((t * 0.4 + p * 0.33 + i * 0.2) % 1)
        const px = x1 + (x2 - x1) * pt
        const py = y1 + (y2 - y1) * pt
        const alpha = Math.sin(pt * Math.PI) * 0.8
        ctx.fillStyle = node.color
        ctx.globalAlpha = alpha
        ctx.beginPath()
        ctx.arc(px, py, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    // Draw nodes
    nodes.forEach((node, i) => {
      const y = padding + i * gap
      const nodeWidth = Math.max(node.width * 6, 70)
      const x = (width - nodeWidth) / 2
      const pulse = Math.sin(t * 1.5 + i * 0.5) * 0.5 + 0.5

      // Node glow
      ctx.shadowColor = node.color
      ctx.shadowBlur = 8 + pulse * 6

      // Node background
      ctx.fillStyle = node.color + '18'
      ctx.strokeStyle = node.color + '50'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.roundRect(x, y, nodeWidth, nodeHeight, 8)
      ctx.fill()
      ctx.stroke()
      ctx.shadowBlur = 0

      // Neuron dots
      const neuronCount = Math.min(Math.round(node.width), 14)
      const dotSpacing = nodeWidth / (neuronCount + 1)
      for (let d = 0; d < neuronCount; d++) {
        const dotPulse = Math.sin(t * 2 + d * 0.8 + i) * 0.5 + 0.5
        ctx.fillStyle = node.color
        ctx.globalAlpha = 0.3 + dotPulse * 0.5
        ctx.beginPath()
        ctx.arc(x + dotSpacing * (d + 1), y + nodeHeight / 2, 3, 0, Math.PI * 2)
        ctx.fill()
        // Bright center
        ctx.fillStyle = '#fff'
        ctx.globalAlpha = 0.2 + dotPulse * 0.3
        ctx.beginPath()
        ctx.arc(x + dotSpacing * (d + 1), y + nodeHeight / 2, 1.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      // Label
      ctx.fillStyle = '#EDEDF4'
      ctx.font = '10px "JetBrains Mono"'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(node.label, width / 2, y + nodeHeight + 4)
    })

    // Complexity meter at bottom
    const totalParams = layers.reduce((sum, l) => {
      if (l.type === 'dense') return sum + (l.units || 0)
      if (l.type === 'conv2d') return sum + (l.filters || 0) * 9
      return sum
    }, 0)
    const complexity = Math.min(totalParams / 500, 1)
    const meterY = height - 20
    const meterWidth = width - 40
    ctx.fillStyle = '#1E1E2E'
    ctx.beginPath()
    ctx.roundRect(20, meterY, meterWidth, 6, 3)
    ctx.fill()
    const meterGrad = ctx.createLinearGradient(20, 0, 20 + meterWidth * complexity, 0)
    meterGrad.addColorStop(0, '#22C55E')
    meterGrad.addColorStop(0.5, '#EAB308')
    meterGrad.addColorStop(1, '#EF4444')
    ctx.fillStyle = meterGrad
    ctx.beginPath()
    ctx.roundRect(20, meterY, meterWidth * complexity, 6, 3)
    ctx.fill()
    ctx.fillStyle = '#4A4A60'
    ctx.font = '9px "JetBrains Mono"'
    ctx.textAlign = 'left'
    ctx.fillText(`Complexity: ${totalParams} params`, 20, meterY - 10)

    animRef.current = requestAnimationFrame(draw)
  }, [nodes, width, height, layers])

  useEffect(() => {
    draw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [draw])

  return (
    <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Network Topology</p>
        <p className="text-[10px] font-mono text-text-muted">{nodes.length} layers</p>
      </div>
      <canvas ref={canvasRef} width={width} height={height} className="block w-full" />
    </div>
  )
}
