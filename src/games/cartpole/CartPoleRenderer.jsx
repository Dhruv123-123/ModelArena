import { useRef, useEffect, useCallback } from 'react'
import { motion as M } from 'framer-motion'
import { CARTPOLE_CONFIG } from './cartpoleConfig'

export default function CartPoleRenderer({ gameState, width = 500, height = 300 }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { x, theta, score, done } = gameState

    ctx.fillStyle = '#06060A'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#14141c'
    ctx.fillRect(0, height * 0.75, width, height * 0.25)
    ctx.strokeStyle = '#2A2A3A'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height * 0.75)
    ctx.lineTo(width, height * 0.75)
    ctx.stroke()

    const scale = width / (CARTPOLE_CONFIG.xThreshold * 2.5)
    const cartX = width / 2 + x * scale
    const cartY = height * 0.75
    const cartW = 60
    const cartH = 30

    ctx.strokeStyle = '#2A2A3A'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(width / 2 - CARTPOLE_CONFIG.xThreshold * scale, cartY - 2)
    ctx.lineTo(width / 2 + CARTPOLE_CONFIG.xThreshold * scale, cartY - 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Drop shadow under cart
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.beginPath()
    ctx.ellipse(cartX, cartY + 4, cartW * 0.55, 10, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(cartX, cartY + 3, cartW * 0.4, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.fillStyle = '#3B82F6'
    ctx.shadowColor = '#3B82F6'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.roundRect(cartX - cartW / 2, cartY - cartH, cartW, cartH, 4)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#1E3A5F'
    ctx.beginPath()
    ctx.arc(cartX - 15, cartY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cartX + 15, cartY, 6, 0, Math.PI * 2)
    ctx.fill()

    const poleLength = 120
    const poleEndX = cartX + Math.sin(theta) * poleLength
    const poleEndY = cartY - cartH / 2 - Math.cos(theta) * poleLength

    ctx.strokeStyle = '#F59E0B'
    ctx.lineWidth = 6
    ctx.lineCap = 'round'
    ctx.shadowColor = '#F59E0B'
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.moveTo(cartX, cartY - cartH / 2)
    ctx.lineTo(poleEndX, poleEndY)
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#EAB308'
    ctx.beginPath()
    ctx.arc(cartX, cartY - cartH / 2, 5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '14px Outfit'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(`Steps: ${score}`, 8, 8)

    if (score >= 195) {
      ctx.fillStyle = '#22C55E'
      ctx.font = 'bold 12px Outfit'
      ctx.fillText('SOLVED!', 8, 28)
    }

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#EF4444'
      ctx.font = 'bold 24px Outfit'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Fell!', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'
      ctx.font = '16px Outfit'
      ctx.fillText(`Survived: ${score} steps`, width / 2, height / 2 + 15)
    }
  }, [gameState, width, height])

  useEffect(() => {
    draw()
  }, [draw])

  return (
    <M.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg overflow-hidden border border-border" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="block" />
    </M.div>
  )
}
