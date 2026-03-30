import { useRef, useEffect, useCallback, useState } from 'react'
import { motion as M } from 'framer-motion'

export default function SnakeRenderer({ gameState, width = 400, height = 400, qValues = null }) {
  const canvasRef = useRef(null)
  const [animTick, setAnimTick] = useState(0)

  // Pulse only while playing; full gameState in deps would reset interval every frame
  useEffect(() => {
    if (!gameState || gameState.done) return
    const id = window.setInterval(() => setAnimTick((t) => t + 1), 48)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: tie to session end, not every state tick
  }, [gameState?.done])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { snake, food, score, done } = gameState
    const gridSize = 20
    const cellW = width / gridSize
    const cellH = height / gridSize
    const t = animTick * 0.12
    const foodPulse = 0.85 + Math.sin(t) * 0.15

    ctx.fillStyle = '#06060A'
    ctx.fillRect(0, 0, width, height)

    // Subtle grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellW + 0.5, 0)
      ctx.lineTo(i * cellW + 0.5, height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cellH + 0.5)
      ctx.lineTo(width, i * cellH + 0.5)
      ctx.stroke()
    }

    const fx = food.x * cellW + cellW / 2
    const fy = food.y * cellH + cellH / 2
    const pulseR = cellW * (1.6 + 0.35 * foodPulse)

    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, pulseR)
    grad.addColorStop(0, `rgba(239,68,68,${0.35 + foodPulse * 0.2})`)
    grad.addColorStop(0.45, 'rgba(239,68,68,0.12)')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(food.x * cellW - pulseR, food.y * cellH - pulseR, pulseR * 2, pulseR * 2)

    ctx.fillStyle = '#FCA5A5'
    ctx.shadowColor = '#EF4444'
    ctx.shadowBlur = 14 + foodPulse * 10
    ctx.beginPath()
    ctx.arc(fx, fy, cellW * 0.38 * foodPulse, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    snake.forEach((seg, i) => {
      const isHead = i === 0
      const green = i === 0 ? '#4ADE80' : i < snake.length * 0.5 ? '#22C55E' : '#16A34A'
      ctx.fillStyle = green
      if (isHead) {
        ctx.shadowColor = '#4ADE80'
        ctx.shadowBlur = 18
      } else {
        ctx.shadowColor = '#22C55E'
        ctx.shadowBlur = 6 + (1 - i / snake.length) * 8
      }
      ctx.beginPath()
      ctx.roundRect(seg.x * cellW + 1.5, seg.y * cellH + 1.5, cellW - 3, cellH - 3, 4)
      ctx.fill()
      ctx.shadowBlur = 0
      if (isHead) {
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    })

    if (qValues && qValues.length === 4) {
      const head = snake[0]
      const labels = ['↑', '↓', '←', '→']
      const offsets = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }]
      const maxQ = Math.max(...qValues)
      const minQ = Math.min(...qValues)
      const range = maxQ - minQ || 1
      qValues.forEach((q, i) => {
        const nx = head.x + offsets[i].dx
        const ny = head.y + offsets[i].dy
        if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) return
        const intensity = (q - minQ) / range
        ctx.fillStyle = `rgba(34,197,94,${0.1 + intensity * 0.4})`
        ctx.fillRect(nx * cellW, ny * cellH, cellW, cellH)
        ctx.fillStyle = `rgba(255,255,255,${0.5 + intensity * 0.5})`
        ctx.font = `${cellW * 0.6}px JetBrains Mono`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labels[i], nx * cellW + cellW / 2, ny * cellH + cellH / 2)
      })
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.font = '14px Outfit'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`Score: ${score}`, 8, 8)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 24px Outfit'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'
      ctx.font = '16px Outfit'
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 15)
    }
  }, [gameState, width, height, qValues, animTick])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <M.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-lg overflow-hidden border border-border shadow-[0_0_40px_rgba(34,197,94,0.06)]" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="block" />
    </M.div>
  )
}
