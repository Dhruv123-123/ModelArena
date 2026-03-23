import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { PIECES } from './chessConfig'

const PIECE_CHARS = {
  [PIECES.WK]: '\u2654', [PIECES.WQ]: '\u2655', [PIECES.WR]: '\u2656', [PIECES.WB]: '\u2657', [PIECES.WN]: '\u2658', [PIECES.WP]: '\u2659',
  [PIECES.BK]: '\u265A', [PIECES.BQ]: '\u265B', [PIECES.BR]: '\u265C', [PIECES.BB]: '\u265D', [PIECES.BN]: '\u265E', [PIECES.BP]: '\u265F',
}

export default function ChessRenderer({ gameState, width = 400, height = 400 }) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { board, whiteToMove, score, done, inCheck, result, lastMove } = gameState
    const cellSize = width / 8

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0
        ctx.fillStyle = isLight ? '#2A2520' : '#3D352A'

        // Highlight last move
        if (lastMove) {
          if ((lastMove.from[0] === r && lastMove.from[1] === c) ||
              (lastMove.to[0] === r && lastMove.to[1] === c)) {
            ctx.fillStyle = isLight ? '#4A4020' : '#5D5530'
          }
        }

        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)

        // Highlight king in check
        const piece = board[r][c]
        if (inCheck && piece) {
          const isKing = (whiteToMove && piece === PIECES.WK) || (!whiteToMove && piece === PIECES.BK)
          if (isKing) {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize)
          }
        }

        if (piece && PIECE_CHARS[piece]) {
          ctx.font = `${cellSize * 0.75}px serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          // Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.4)'
          ctx.fillText(PIECE_CHARS[piece], c * cellSize + cellSize / 2 + 1, r * cellSize + cellSize / 2 + 3)
          // Piece
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

    // Info bar
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(0, 0, width, 22)
    ctx.fillStyle = whiteToMove ? '#E8E8F0' : '#EAB308'
    ctx.font = '11px Outfit'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    let info = `${whiteToMove ? 'White' : 'Black'} to move  \u00B7  Score: ${score}`
    if (inCheck && !done) info += '  \u00B7  CHECK!'
    ctx.fillText(info, 6, 5)

    if (done) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, width, height)
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'

      if (result === 'white') {
        ctx.fillStyle = '#E8E8F0'; ctx.font = 'bold 22px Outfit'
        ctx.fillText('Checkmate!', width / 2, height / 2 - 14)
        ctx.font = '14px Outfit'; ctx.fillStyle = '#aaa'
        ctx.fillText('White wins', width / 2, height / 2 + 14)
      } else if (result === 'black') {
        ctx.fillStyle = '#EAB308'; ctx.font = 'bold 22px Outfit'
        ctx.fillText('Checkmate!', width / 2, height / 2 - 14)
        ctx.font = '14px Outfit'; ctx.fillStyle = '#aaa'
        ctx.fillText('Black wins', width / 2, height / 2 + 14)
      } else {
        ctx.fillStyle = '#aaa'; ctx.font = 'bold 22px Outfit'
        ctx.fillText('Draw', width / 2, height / 2 - 14)
        ctx.font = '14px Outfit'
        ctx.fillText('Stalemate / 50-move rule', width / 2, height / 2 + 14)
      }
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
