import { useRef, useEffect, useCallback } from 'react'
import { motion as M } from 'framer-motion'

const TILE_COLORS = {
  0: '#1A1A25', 2: '#2D2B55', 4: '#3B3575', 8: '#A855F7', 16: '#9333EA',
  32: '#7C3AED', 64: '#6D28D9', 128: '#5B21B6', 256: '#4C1D95',
  512: '#F59E0B', 1024: '#EAB308', 2048: '#F97316',
}

const TEXT_COLORS = {
  0: 'transparent', 2: '#C4B5FD', 4: '#C4B5FD', 8: '#FFF',
}

const MERGE_MS = 200

export default function TwentyFortyEightRenderer({ gameState, width = 300, height = 300 }) {
  const canvasRef = useRef(null)
  const bumpStartRef = useRef(new Map())
  const prevStepsRef = useRef(-1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { grid, score, done, maxTile, mergeFlash, steps = 0 } = gameState
    const padding = 8
    const gap = 6
    const cellSize = (width - padding * 2 - gap * 3) / 4
    const now = performance.now()

    if (steps !== prevStepsRef.current) {
      prevStepsRef.current = steps
      bumpStartRef.current.clear()
      ;(mergeFlash || []).forEach(([r, c]) => {
        bumpStartRef.current.set(`${r},${c}`, now)
      })
    }

    ctx.fillStyle = '#06060A'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#12121A'
    ctx.beginPath()
    ctx.roundRect(padding - 3, padding - 3, width - (padding - 3) * 2, height - (padding - 3) * 2, 8)
    ctx.fill()

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = grid[r][c]
        const x = padding + c * (cellSize + gap)
        const y = padding + r * (cellSize + gap)

        const key = `${r},${c}`
        const t0 = bumpStartRef.current.get(key)
        let bump = 1
        if (t0 !== undefined) {
          const elapsed = now - t0
          if (elapsed >= MERGE_MS) bumpStartRef.current.delete(key)
          else bump = 1 + 0.15 * Math.sin(Math.PI * (elapsed / MERGE_MS))
        }

        const cx = x + cellSize / 2
        const cy = y + cellSize / 2
        const half = (cellSize / 2) * bump

        ctx.fillStyle = TILE_COLORS[val] || (val > 2048 ? '#DC2626' : '#1A1A25')
        ctx.beginPath()
        ctx.roundRect(cx - half, cy - half, half * 2, half * 2, 6 * bump)
        ctx.fill()

        if (val > 64) {
          ctx.shadowColor = TILE_COLORS[val] || '#A855F7'
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.roundRect(cx - half, cy - half, half * 2, half * 2, 6 * bump)
          ctx.fill()
          ctx.shadowBlur = 0
        }

        if (val !== 0) {
          ctx.fillStyle = TEXT_COLORS[val] || '#FFF'
          const fontSize = (val >= 1000 ? 14 : val >= 100 ? 18 : 22) * Math.min(1.05, bump)
          ctx.font = `bold ${fontSize}px JetBrains Mono`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(val, cx, cy)
        }
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '12px Outfit'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`Score: ${score}  Max: ${maxTile}`, padding, height - 4)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#A855F7'
      ctx.font = 'bold 22px Outfit'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2 - 15)
      ctx.fillStyle = '#E8E8F0'
      ctx.font = '14px Outfit'
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 15)
    }
  }, [gameState, width, height])

  useEffect(() => {
    let id
    const tick = () => {
      draw()
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [draw])

  return (
    <M.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg overflow-hidden border border-border" style={{ width, height }}>
      <canvas ref={canvasRef} width={width} height={height} className="block" />
    </M.div>
  )
}
