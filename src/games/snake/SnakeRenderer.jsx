import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

export default function SnakeRenderer({ gameState, width = 400, height = 400, qValues = null }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { snake, food, score, done } = gameState
    const gridSize = 20
    const cellW = width / gridSize
    const cellH = height / gridSize

    ctx.fillStyle = '#0A0A0F'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = '#1A1A25'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, height); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(width, i * cellH); ctx.stroke()
    }

    // Food glow
    const fx = food.x * cellW + cellW / 2, fy = food.y * cellH + cellH / 2
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, cellW * 2)
    grad.addColorStop(0, 'rgba(239,68,68,0.3)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(food.x * cellW - cellW * 2, food.y * cellH - cellH * 2, cellW * 5, cellH * 5)

    // Food
    ctx.fillStyle = '#EF4444'
    ctx.beginPath(); ctx.arc(fx, fy, cellW * 0.4, 0, Math.PI * 2); ctx.fill()

    // Snake
    snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? '#22C55E' : i < snake.length * 0.5 ? '#16A34A' : '#15803D'
      if (i === 0) { ctx.shadowColor = '#22C55E'; ctx.shadowBlur = 8 }
      ctx.beginPath()
      ctx.roundRect(seg.x * cellW + 1, seg.y * cellH + 1, cellW - 2, cellH - 2, 3)
      ctx.fill()
      ctx.shadowBlur = 0
    })

    // Q-value overlay
    if (qValues && qValues.length === 4) {
      const head = snake[0]
      const labels = ['↑', '↓', '←', '→']
      const offsets = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }]
      const maxQ = Math.max(...qValues), minQ = Math.min(...qValues), range = maxQ - minQ || 1
      qValues.forEach((q, i) => {
        const nx = head.x + offsets[i].dx, ny = head.y + offsets[i].dy
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) return
        const intensity = (q - minQ) / range
        ctx.fillStyle = `rgba(34,197,94,${0.1 + intensity * 0.4})`
        ctx.fillRect(nx * cellW, ny * cellH, cellW, cellH)
        ctx.fillStyle = `rgba(255,255,255,${0.5 + intensity * 0.5})`
        ctx.font = `${cellW * 0.6}px JetBrains Mono`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(labels[i], nx * cellW + cellW / 2, ny * cellH + cellH / 2)
      })
    }

    // Score
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '14px Outfit'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`Score: ${score}`, 8, 8)

    // Game over
    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#EF4444'; ctx.font = 'bold 24px Outfit'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'; ctx.font = '16px Outfit'
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 15)
    }
  }, [gameState, width, height, qValues])

  useEffect(() => { draw() }, [draw])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg overflow-hidden border border-border" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="block" />
    </motion.div>
  )
}
