import { useRef, useEffect, useCallback } from 'react'
import { motion as M } from 'framer-motion'
import { FLAPPY_CONFIG } from './flappyConfig'

function drawParallaxLayers(ctx, width, height, scroll) {
  const sFar = scroll * 0.04
  const sMid = scroll * 0.1
  const wrap = (x) => ((x % width) + width) % width

  // Far — silhouettes
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  for (let i = -1; i < 3; i++) {
    const base = wrap(i * width * 0.55 + sFar)
    ctx.beginPath()
    ctx.moveTo(base, height * 0.72)
    ctx.lineTo(base + width * 0.2, height * 0.52)
    ctx.lineTo(base + width * 0.38, height * 0.58)
    ctx.lineTo(base + width * 0.55, height * 0.48)
    ctx.lineTo(base + width * 0.75, height * 0.55)
    ctx.lineTo(base + width * 0.95, height * 0.5)
    ctx.lineTo(base + width * 1.1, height * 0.75)
    ctx.lineTo(base - 20, height * 0.75)
    ctx.closePath()
    ctx.fill()
  }

  // Mid — soft clouds
  ctx.fillStyle = 'rgba(99, 102, 241, 0.07)'
  ;[
    [0.1, 0.35, 0.12],
    [0.45, 0.42, 0.1],
    [0.72, 0.38, 0.14],
  ].forEach(([bx, by, br]) => {
    const cx = wrap(bx * width + sMid)
    const cy = by * height
    ctx.beginPath()
    ctx.ellipse(cx, cy, width * br, height * 0.04, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + width * 0.05, cy - 4, width * br * 0.7, height * 0.03, 0, 0, Math.PI * 2)
    ctx.fill()
  })

  // Near — ground band (before pipes)
  const groundGrad = ctx.createLinearGradient(0, height * 0.78, 0, height)
  groundGrad.addColorStop(0, 'rgba(30, 27, 75, 0.35)')
  groundGrad.addColorStop(1, 'rgba(15, 23, 42, 0.5)')
  ctx.fillStyle = groundGrad
  ctx.fillRect(0, height * 0.78, width, height * 0.22)
}

export default function FlappyRenderer({ gameState, width = 350, height = 500 }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { bird, pipes, score, done } = gameState

    const skyGrad = ctx.createLinearGradient(0, 0, 0, height)
    skyGrad.addColorStop(0, '#0c1445')
    skyGrad.addColorStop(0.55, '#15152e')
    skyGrad.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, width, height)

    const scroll = pipes.length ? pipes[0].x : 0
    drawParallaxLayers(ctx, width, height, scroll)

    pipes.forEach((pipe) => {
      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + FLAPPY_CONFIG.pipeWidth, 0)
      pipeGrad.addColorStop(0, '#F97316')
      pipeGrad.addColorStop(1, '#EA580C')

      ctx.fillStyle = pipeGrad
      ctx.fillRect(pipe.x, 0, FLAPPY_CONFIG.pipeWidth, pipe.topHeight)
      ctx.fillRect(pipe.x - 3, pipe.topHeight - 15, FLAPPY_CONFIG.pipeWidth + 6, 15)

      ctx.fillRect(pipe.x, pipe.bottomY, FLAPPY_CONFIG.pipeWidth, height - pipe.bottomY)
      ctx.fillRect(pipe.x - 3, pipe.bottomY, FLAPPY_CONFIG.pipeWidth + 6, 15)
    })

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

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(5, -3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'black'
    ctx.beginPath()
    ctx.arc(6, -3, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#F97316'
    ctx.beginPath()
    ctx.moveTo(FLAPPY_CONFIG.birdSize / 2, -2)
    ctx.lineTo(FLAPPY_CONFIG.birdSize / 2 + 8, 2)
    ctx.lineTo(FLAPPY_CONFIG.birdSize / 2, 5)
    ctx.fill()

    ctx.restore()

    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.font = 'bold 28px Outfit'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(score, width / 2, 20)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#F97316'
      ctx.font = 'bold 24px Outfit'
      ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'
      ctx.font = '16px Outfit'
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 15)
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
