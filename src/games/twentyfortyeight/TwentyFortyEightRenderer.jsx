import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

const TILE_COLORS = {
  0: '#1A1A25', 2: '#2D2B55', 4: '#3B3575', 8: '#A855F7', 16: '#9333EA',
  32: '#7C3AED', 64: '#6D28D9', 128: '#5B21B6', 256: '#4C1D95',
  512: '#F59E0B', 1024: '#EAB308', 2048: '#F97316',
}

const TEXT_COLORS = {
  0: 'transparent', 2: '#C4B5FD', 4: '#C4B5FD', 8: '#FFF',
}

export default function TwentyFortyEightRenderer({ gameState, width = 300, height = 300 }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { grid, score, done, maxTile } = gameState
    const padding = 8
    const gap = 6
    const cellSize = (width - padding * 2 - gap * 3) / 4

    ctx.fillStyle = '#0A0A0F'
    ctx.fillRect(0, 0, width, height)

    // Board background
    ctx.fillStyle = '#12121A'
    ctx.beginPath()
    ctx.roundRect(padding - 3, padding - 3, width - (padding - 3) * 2, height - (padding - 3) * 2, 8)
    ctx.fill()

    // Tiles
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c]
        const x = padding + c * (cellSize + gap)
        const y = padding + r * (cellSize + gap)

        ctx.fillStyle = TILE_COLORS[val] || (val > 2048 ? '#DC2626' : '#1A1A25')
        ctx.beginPath()
        ctx.roundRect(x, y, cellSize, cellSize, 6)
        ctx.fill()

        if (val > 64) {
          ctx.shadowColor = TILE_COLORS[val] || '#A855F7'
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.roundRect(x, y, cellSize, cellSize, 6)
          ctx.fill()
          ctx.shadowBlur = 0
        }

        if (val !== 0) {
          ctx.fillStyle = TEXT_COLORS[val] || '#FFF'
          const fontSize = val >= 1000 ? 14 : val >= 100 ? 18 : 22
          ctx.font = `bold ${fontSize}px JetBrains Mono`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(val, x + cellSize / 2, y + cellSize / 2)
        }
      }
    }

    // Score
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '12px Outfit'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`Score: ${score}  Max: ${maxTile}`, padding, height - 4)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#A855F7'; ctx.font = 'bold 22px Outfit'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'; ctx.font = '14px Outfit'
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
