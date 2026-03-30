import { useRef, useEffect, useCallback } from 'react'
import { motion as M } from 'framer-motion'
import { PIECES } from './chessConfig'

const PIECE_CHARS = {
  [PIECES.WK]: '\u2654', [PIECES.WQ]: '\u2655', [PIECES.WR]: '\u2656', [PIECES.WB]: '\u2657', [PIECES.WN]: '\u2658', [PIECES.WP]: '\u2659',
  [PIECES.BK]: '\u265A', [PIECES.BQ]: '\u265B', [PIECES.BR]: '\u265C', [PIECES.BB]: '\u265D', [PIECES.BN]: '\u265E', [PIECES.BP]: '\u265F',
}

export default function ChessRenderer({
  gameState,
  width = 400,
  height = 400,
  interactive = false,
  selectedCell = null,
  legalTargets = null,
  onSquareClick,
}) {
  const canvasRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !gameState) return
    const ctx = canvas.getContext('2d')
    const { board, whiteToMove, score, done, inCheck, result, lastMove } = gameState
    const cellSize = width / 8

    const isSelected = (r, c) => selectedCell && selectedCell[0] === r && selectedCell[1] === c
    const isLegal = (r, c) => legalTargets?.some(([lr, lc]) => lr === r && lc === c)

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isLight = (r + c) % 2 === 0
        const x0 = c * cellSize
        const y0 = r * cellSize
        const woodGrad = ctx.createLinearGradient(x0, y0, x0 + cellSize, y0 + cellSize)
        if (isLight) {
          woodGrad.addColorStop(0, '#E8D4B8')
          woodGrad.addColorStop(0.5, '#C4A574')
          woodGrad.addColorStop(1, '#9A7B4F')
        } else {
          woodGrad.addColorStop(0, '#6B4423')
          woodGrad.addColorStop(0.45, '#4A3020')
          woodGrad.addColorStop(1, '#2E1F14')
        }
        ctx.fillStyle = woodGrad
        ctx.fillRect(x0, y0, cellSize, cellSize)

        let overlay = null
        if (lastMove) {
          const from = lastMove.from[0] === r && lastMove.from[1] === c
          const to = lastMove.to[0] === r && lastMove.to[1] === c
          if (from || to) {
            overlay = from
              ? 'rgba(234, 179, 8, 0.28)'
              : 'rgba(34, 197, 94, 0.22)'
          }
        }
        if (isSelected(r, c)) {
          overlay = isLight ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.32)'
        } else if (isLegal(r, c)) {
          overlay = isLight ? 'rgba(34, 197, 94, 0.38)' : 'rgba(34, 197, 94, 0.3)'
        }
        if (overlay) {
          ctx.fillStyle = overlay
          ctx.fillRect(x0, y0, cellSize, cellSize)
        }

        if (isSelected(r, c)) {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.95)'
          ctx.lineWidth = 3
          ctx.strokeRect(x0 + 1.5, y0 + 1.5, cellSize - 3, cellSize - 3)
        }

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
  }, [gameState, width, height, selectedCell, legalTargets])

  useEffect(() => { draw() }, [draw])

  const handleClick = (e) => {
    if (!interactive || !onSquareClick || gameState?.done) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cell = width / 8
    const c = Math.floor(x / cell)
    const r = Math.floor(y / cell)
    if (r >= 0 && r < 8 && c >= 0 && c < 8) onSquareClick(r, c)
  }

  return (
    <M.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-lg overflow-hidden border border-border" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={`block ${interactive ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
      />
    </M.div>
  )
}
