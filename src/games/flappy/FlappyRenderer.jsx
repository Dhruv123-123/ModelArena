import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FLAPPY_CONFIG } from './flappyConfig'

export default function FlappyRenderer({ gameState, width = 350, height = 500 }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { bird, pipes, score, done } = gameState

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height)
    skyGrad.addColorStop(0, '#0c1445')
    skyGrad.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height)

    // Pipes
    pipes.forEach(pipe => {
      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + FLAPPY_CONFIG.pipeWidth, 0)
      pipeGrad.addColorStop(0, '#F97316')
      pipeGrad.addColorStop(1, '#EA580C')

      // Top pipe
      ctx.fillStyle = pipeGrad
      ctx.fillRect(pipe.x, 0, FLAPPY_CONFIG.pipeWidth, pipe.topHeight)
      ctx.fillRect(pipe.x - 3, pipe.topHeight - 15, FLAPPY_CONFIG.pipeWidth + 6, 15)

      // Bottom pipe
      ctx.fillRect(pipe.x, pipe.bottomY, FLAPPY_CONFIG.pipeWidth, height - pipe.bottomY)
      ctx.fillRect(pipe.x - 3, pipe.bottomY, FLAPPY_CONFIG.pipeWidth + 6, 15)
    })

    // Bird
    ctx.save()
    ctx.translate(bird.x + FLAPPY_CONFIG.birdSize / 2, bird.y + FLAPPY_CONFIG.birdSize / 2)
    const rotation = Math.min(Math.max(bird.velocity * 3, -30), 60) * Math.PI / 180
    ctx.rotate(rotation)

    ctx.fillStyle = '#FBBF24'
    ctx.shadowColor = '#FBBF24'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.ellipse(0, 0, FLAPPY_CONFIG.birdSize / 2, FLAPPY_CONFIG.birdSize / 2.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Eye
    ctx.fillStyle = 'white'
    ctx.beginPath(); ctx.arc(5, -3, 4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = 'black'
    ctx.beginPath(); ctx.arc(6, -3, 2, 0, Math.PI * 2); ctx.fill()

    // Beak
    ctx.fillStyle = '#F97316'
    ctx.beginPath()
    ctx.moveTo(FLAPPY_CONFIG.birdSize / 2, -2)
    ctx.lineTo(FLAPPY_CONFIG.birdSize / 2 + 8, 2)
    ctx.lineTo(FLAPPY_CONFIG.birdSize / 2, 5)
    ctx.fill()

    ctx.restore()

    // Score
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 28px Outfit'
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillText(score, width / 2, 20)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#F97316'; ctx.font = 'bold 24px Outfit'
      ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'; ctx.font = '16px Outfit'
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 15)
    }
  }, [gameState, width, height])

  useEffect(() => { draw() }, [draw])

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg overflow-hidden border border-border" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="block" />
    </motion.div>
  )
}
