import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PIECES } from './chessConfig'

const PIECE_CHARS = {
  [PIECES.WK]: '♔', [PIECES.WQ]: '♕', [PIECES.WR]: '♖', [PIECES.WB]: '♗', [PIECES.WN]: '♘', [PIECES.WP]: '♙',
  [PIECES.BK]: '♚', [PIECES.BQ]: '♛', [PIECES.BR]: '♜', [PIECES.BB]: '♝', [PIECES.BN]: '♞', [PIECES.BP]: '♟',
}

export default function ChessRenderer({ gameState, width = 400, height = 400 }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { board, whiteToMove, score, done } = gameState
    const cellSize = width / 8

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0
        ctx.fillStyle = isLight ? '#B58863' : '#F0D9B5'
        // Darken for our theme
        ctx.fillStyle = isLight ? '#2A2520' : '#3D352A'
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)

        const piece = board[r][c]
        if (piece && PIECE_CHARS[piece]) {
          ctx.font = `${cellSize * 0.75}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = piece <= 6 ? '#E8E8F0' : '#EAB308'
          ctx.fillText(PIECE_CHARS[piece], c * cellSize + cellSize / 2, r * cellSize + cellSize / 2 + 2)
        }
      }
    }

    // Coordinates
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '9px JetBrains Mono'
    for (let i = 0; i < 8; i++) {
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'
      ctx.fillText(String(8 - i), 2, i * cellSize + 2)
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'
      ctx.fillText(String.fromCharCode(97 + i), (i + 1) * cellSize - 2, height - 2)
    }

    // Info
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, width, 22)
    ctx.fillStyle = whiteToMove ? '#E8E8F0' : '#EAB308'
    ctx.font = '11px Outfit'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`${whiteToMove ? 'White' : 'Black'} to move  •  Score: ${score}`, 6, 5)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = '#EAB308'; ctx.font = 'bold 24px Outfit'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('Game Over', width / 2, height / 2)
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
