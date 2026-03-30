import GameEngine from '../GameEngine.js'
import { CHESS_CONFIG, PIECES, PIECE_VALUES } from './chessConfig.js'

const INITIAL_BOARD = [
  [PIECES.BR, PIECES.BN, PIECES.BB, PIECES.BQ, PIECES.BK, PIECES.BB, PIECES.BN, PIECES.BR],
  [PIECES.BP, PIECES.BP, PIECES.BP, PIECES.BP, PIECES.BP, PIECES.BP, PIECES.BP, PIECES.BP],
  [0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],
  [PIECES.WP, PIECES.WP, PIECES.WP, PIECES.WP, PIECES.WP, PIECES.WP, PIECES.WP, PIECES.WP],
  [PIECES.WR, PIECES.WN, PIECES.WB, PIECES.WQ, PIECES.WK, PIECES.WB, PIECES.WN, PIECES.WR],
]

function isWhite(p) { return p >= 1 && p <= 6 }
function isBlack(p) { return p >= 7 && p <= 12 }
function isAlly(p, white) { return white ? isWhite(p) : isBlack(p) }
function isEnemy(p, white) { return white ? isBlack(p) : isWhite(p) }
function pieceType(p) { return p === 0 ? 0 : (isWhite(p) ? p : p - 6) }

function findKing(board, white) {
  const king = white ? PIECES.WK : PIECES.BK
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if (board[r][c] === king) return [r, c]
  return null
}

// Check if a square is attacked by the opposing side
function isSquareAttacked(board, row, col, byWhite) {
  // Knight attacks
  for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
    const r = row + dr, c = col + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c]
      if (isAlly(p, byWhite) && pieceType(p) === 2) return true
    }
  }
  // Pawn attacks
  const pDir = byWhite ? 1 : -1 // pawns of byWhite color attack in this direction
  for (const dc of [-1, 1]) {
    const r = row + pDir, c = col + dc
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c]
      if (isAlly(p, byWhite) && pieceType(p) === 1) return true
    }
  }
  // King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const r = row + dr, c = col + dc
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c]
        if (isAlly(p, byWhite) && pieceType(p) === 6) return true
      }
    }
  }
  // Sliding pieces: bishop/queen on diagonals
  for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
    for (let i = 1; i < 8; i++) {
      const r = row + dr * i, c = col + dc * i
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break
      const p = board[r][c]
      if (p !== 0) {
        if (isAlly(p, byWhite) && (pieceType(p) === 3 || pieceType(p) === 5)) return true
        break
      }
    }
  }
  // Sliding pieces: rook/queen on straights
  for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
    for (let i = 1; i < 8; i++) {
      const r = row + dr * i, c = col + dc * i
      if (r < 0 || r >= 8 || c < 0 || c >= 8) break
      const p = board[r][c]
      if (p !== 0) {
        if (isAlly(p, byWhite) && (pieceType(p) === 4 || pieceType(p) === 5)) return true
        break
      }
    }
  }
  return false
}

function isInCheck(board, white) {
  const kp = findKing(board, white)
  if (!kp) return true
  return isSquareAttacked(board, kp[0], kp[1], !white)
}

export default class ChessEngine extends GameEngine {
  constructor() {
    super(CHESS_CONFIG)
    this.reset()
  }

  reset() {
    this.board = INITIAL_BOARD.map(r => [...r])
    this.whiteToMove = true
    this.castling = { wk: true, wq: true, bk: true, bq: true }
    this.enPassant = null // [row, col] of en passant target square
    this.score = 0
    this.done = false
    this.steps = 0
    this.moveHistory = []
    this.halfMoveClock = 0 // for 50-move rule
    this.result = null // 'white', 'black', 'draw'
    this.inCheck = false
    return this.getStateVector()
  }

  _generatePseudoMoves(board, white, castling, enPassant) {
    const moves = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (!isAlly(p, white)) continue
        const type = pieceType(p)

        const addMove = (tr, tc, special = null) => {
          if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false
          if (isAlly(board[tr][tc], white)) return false
          moves.push({ from: [r, c], to: [tr, tc], special })
          return board[tr][tc] === 0
        }

        if (type === 1) { // Pawn
          const dir = white ? -1 : 1
          const startRow = white ? 6 : 1
          const promoRow = white ? 0 : 7
          // Forward
          if (r + dir >= 0 && r + dir <= 7 && board[r + dir][c] === 0) {
            if (r + dir === promoRow) {
              moves.push({ from: [r, c], to: [r + dir, c], special: 'promote' })
            } else {
              moves.push({ from: [r, c], to: [r + dir, c] })
            }
            // Double push
            if (r === startRow && board[r + 2 * dir][c] === 0) {
              moves.push({ from: [r, c], to: [r + 2 * dir, c], special: 'doublePush' })
            }
          }
          // Captures
          for (const dc of [-1, 1]) {
            const tr = r + dir, tc = c + dc
            if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7) {
              if (isEnemy(board[tr][tc], white)) {
                if (tr === promoRow) {
                  moves.push({ from: [r, c], to: [tr, tc], special: 'promote' })
                } else {
                  moves.push({ from: [r, c], to: [tr, tc] })
                }
              }
              // En passant
              if (enPassant && enPassant[0] === tr && enPassant[1] === tc) {
                moves.push({ from: [r, c], to: [tr, tc], special: 'enPassant' })
              }
            }
          }
        } else if (type === 2) { // Knight
          for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) addMove(r+dr,c+dc)
        } else if (type === 3 || type === 5) { // Bishop or Queen diagonals
          for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]])
            for (let i = 1; i < 8; i++) if (!addMove(r+dr*i,c+dc*i)) break
        }
        if (type === 4 || type === 5) { // Rook or Queen straights
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]])
            for (let i = 1; i < 8; i++) if (!addMove(r+dr*i,c+dc*i)) break
        }
        if (type === 6) { // King
          for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++)
              if (dr || dc) addMove(r + dr, c + dc)

          // Castling
          const row = white ? 7 : 0
          if (r === row && c === 4) {
            // Kingside
            if ((white ? castling.wk : castling.bk) &&
                board[row][5] === 0 && board[row][6] === 0 &&
                !isSquareAttacked(board, row, 4, !white) &&
                !isSquareAttacked(board, row, 5, !white) &&
                !isSquareAttacked(board, row, 6, !white)) {
              const rookPiece = board[row][7]
              if (rookPiece === (white ? PIECES.WR : PIECES.BR)) {
                moves.push({ from: [row, 4], to: [row, 6], special: 'castleK' })
              }
            }
            // Queenside
            if ((white ? castling.wq : castling.bq) &&
                board[row][3] === 0 && board[row][2] === 0 && board[row][1] === 0 &&
                !isSquareAttacked(board, row, 4, !white) &&
                !isSquareAttacked(board, row, 3, !white) &&
                !isSquareAttacked(board, row, 2, !white)) {
              const rookPiece = board[row][0]
              if (rookPiece === (white ? PIECES.WR : PIECES.BR)) {
                moves.push({ from: [row, 4], to: [row, 2], special: 'castleQ' })
              }
            }
          }
        }
      }
    }
    return moves
  }

  _makeMove(board, move) {
    const b = board.map(r => [...r])
    const piece = b[move.from[0]][move.from[1]]
    b[move.to[0]][move.to[1]] = piece
    b[move.from[0]][move.from[1]] = 0

    if (move.special === 'enPassant') {
      // Remove the captured pawn
      const capturedRow = move.from[0]
      b[capturedRow][move.to[1]] = 0
    } else if (move.special === 'promote') {
      // Promote to queen
      b[move.to[0]][move.to[1]] = isWhite(piece) ? PIECES.WQ : PIECES.BQ
    } else if (move.special === 'castleK') {
      const row = move.from[0]
      b[row][5] = b[row][7]
      b[row][7] = 0
    } else if (move.special === 'castleQ') {
      const row = move.from[0]
      b[row][3] = b[row][0]
      b[row][0] = 0
    }

    return b
  }

  // Generate legal moves (filter out moves that leave king in check)
  getLegalMoves() {
    const pseudo = this._generatePseudoMoves(this.board, this.whiteToMove, this.castling, this.enPassant)
    return pseudo.filter(move => {
      const newBoard = this._makeMove(this.board, move)
      return !isInCheck(newBoard, this.whiteToMove)
    })
  }

  materialEval(board) {
    let score = 0
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        score += PIECE_VALUES[board[r][c]] || 0
    return score
  }

  minimax(board, depth, alpha, beta, maximizing, evalFn, castling, enPassant) {
    if (depth === 0) return { score: evalFn(board), move: null }

    const moves = this._generatePseudoMoves(board, maximizing, castling, enPassant)
    // Filter to legal moves
    const legal = moves.filter(m => {
      const nb = this._makeMove(board, m)
      return !isInCheck(nb, maximizing)
    })

    if (legal.length === 0) {
      if (isInCheck(board, maximizing)) {
        return { score: maximizing ? -10000 : 10000, move: null } // checkmate
      }
      return { score: 0, move: null } // stalemate
    }

    let bestMove = legal[0]
    if (maximizing) {
      let maxEval = -Infinity
      for (const move of legal) {
        const newBoard = this._makeMove(board, move)
        const newEp = move.special === 'doublePush' ? [(move.from[0] + move.to[0]) / 2, move.to[1]] : null
        const { score } = this.minimax(newBoard, depth - 1, alpha, beta, false, evalFn, castling, newEp)
        if (score > maxEval) { maxEval = score; bestMove = move }
        alpha = Math.max(alpha, score)
        if (beta <= alpha) break
      }
      return { score: maxEval, move: bestMove }
    } else {
      let minEval = Infinity
      for (const move of legal) {
        const newBoard = this._makeMove(board, move)
        const newEp = move.special === 'doublePush' ? [(move.from[0] + move.to[0]) / 2, move.to[1]] : null
        const { score } = this.minimax(newBoard, depth - 1, alpha, beta, true, evalFn, castling, newEp)
        if (score < minEval) { minEval = score; bestMove = move }
        beta = Math.min(beta, score)
        if (beta <= alpha) break
      }
      return { score: minEval, move: bestMove }
    }
  }

  /** Apply a move already validated as legal for the side to move. */
  _applyChosenMove(move) {
    const captured = this.board[move.to[0]][move.to[1]]
    const movedPiece = this.board[move.from[0]][move.from[1]]
    const wasPawn = pieceType(movedPiece) === 1

    const epCapture = move.special === 'enPassant'

    this.board = this._makeMove(this.board, move)

    if (move.special === 'doublePush') {
      this.enPassant = [(move.from[0] + move.to[0]) / 2, move.to[1]]
    } else {
      this.enPassant = null
    }

    if (pieceType(movedPiece) === 6) {
      if (this.whiteToMove) { this.castling.wk = false; this.castling.wq = false }
      else { this.castling.bk = false; this.castling.bq = false }
    }
    if (pieceType(movedPiece) === 4) {
      if (move.from[0] === 7 && move.from[1] === 0) this.castling.wq = false
      if (move.from[0] === 7 && move.from[1] === 7) this.castling.wk = false
      if (move.from[0] === 0 && move.from[1] === 0) this.castling.bq = false
      if (move.from[0] === 0 && move.from[1] === 7) this.castling.bk = false
    }
    if (move.to[0] === 0 && move.to[1] === 0) this.castling.bq = false
    if (move.to[0] === 0 && move.to[1] === 7) this.castling.bk = false
    if (move.to[0] === 7 && move.to[1] === 0) this.castling.wq = false
    if (move.to[0] === 7 && move.to[1] === 7) this.castling.wk = false

    this.whiteToMove = !this.whiteToMove
    this.steps++
    this.moveHistory.push(move)

    if (captured || wasPawn || epCapture) {
      this.halfMoveClock = 0
    } else {
      this.halfMoveClock++
    }

    if (captured) this.score += Math.abs(PIECE_VALUES[captured] || 0)
    if (epCapture) this.score += 1

    this.inCheck = isInCheck(this.board, this.whiteToMove)
    const legal = this.getLegalMoves()

    if (legal.length === 0) {
      this.done = true
      if (this.inCheck) {
        this.result = this.whiteToMove ? 'black' : 'white'
      } else {
        this.result = 'draw'
      }
    } else if (this.halfMoveClock >= 100) {
      this.done = true
      this.result = 'draw'
    } else if (this.steps > 200) {
      this.done = true
      this.result = 'draw'
    }

    const reward = captured ? 1 : (epCapture ? 0.5 : 0)
    return { state: this.getStateVector(), reward, done: this.done, score: this.score }
  }

  /** Human / UI: apply one legal move matching from→to (promotion defaults to queen in _makeMove). */
  applyMoveBySquares(fromRow, fromCol, toRow, toCol) {
    if (this.done) return false
    const legal = this.getLegalMoves()
    const found = legal.find(
      (m) => m.from[0] === fromRow && m.from[1] === fromCol && m.to[0] === toRow && m.to[1] === toCol,
    )
    if (!found) return false
    this._applyChosenMove(found)
    return true
  }

  step(action, evalFn = null) {
    if (this.done) return { state: this.getStateVector(), reward: 0, done: true, score: this.score }

    const fn = evalFn || ((b) => this.materialEval(b))
    const { move } = this.minimax(this.board, CHESS_CONFIG.searchDepth, -Infinity, Infinity, this.whiteToMove, fn, this.castling, this.enPassant)

    if (!move) {
      this.done = true
      if (isInCheck(this.board, this.whiteToMove)) {
        this.result = this.whiteToMove ? 'black' : 'white'
      } else {
        this.result = 'draw'
      }
      return { state: this.getStateVector(), reward: 0, done: true, score: this.score }
    }

    return this._applyChosenMove(move)
  }

  getState() {
    return {
      board: this.board.map(r => [...r]),
      whiteToMove: this.whiteToMove,
      score: this.score,
      done: this.done,
      inCheck: this.inCheck,
      result: this.result,
      moveHistory: [...this.moveHistory],
      lastMove: this.moveHistory[this.moveHistory.length - 1] || null,
    }
  }

  getStateVector() {
    const vec = []
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const oneHot = Array(12).fill(0)
        if (this.board[r][c] > 0) oneHot[this.board[r][c] - 1] = 1
        vec.push(...oneHot)
      }
    vec.push(this.whiteToMove ? 1 : 0)
    vec.push(this.materialEval(this.board) / 40)
    vec.push(this.steps / 200)
    vec.push(this.castling.wk ? 1 : 0, this.castling.wq ? 1 : 0, this.castling.bk ? 1 : 0, this.castling.bq ? 1 : 0)
    while (vec.length < 780) vec.push(0)
    return vec.slice(0, 780)
  }

  getScore() { return this.score }
  isDone() { return this.done }
  getSteps() { return this.steps }
  getActionSpace() { return 1 }

  clone() {
    const c = new ChessEngine()
    c.board = this.board.map(r => [...r])
    c.whiteToMove = this.whiteToMove
    c.castling = { ...this.castling }
    c.enPassant = this.enPassant ? [...this.enPassant] : null
    c.score = this.score; c.done = this.done; c.steps = this.steps
    c.moveHistory = [...this.moveHistory]
    c.halfMoveClock = this.halfMoveClock
    c.result = this.result
    c.inCheck = this.inCheck
    return c
  }
}
