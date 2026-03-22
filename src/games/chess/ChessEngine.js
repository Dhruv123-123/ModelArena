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

export default class ChessEngine extends GameEngine {
  constructor() {
    super(CHESS_CONFIG)
    this.reset()
  }

  reset() {
    this.board = INITIAL_BOARD.map(r => [...r])
    this.whiteToMove = true
    this.castling = { wk: true, wq: true, bk: true, bq: true }
    this.score = 0
    this.done = false
    this.steps = 0
    this.moveHistory = []
    return this.getStateVector()
  }

  _generateMoves(board, white) {
    const moves = []
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c]
        if (!isAlly(p, white)) continue
        const type = white ? p : p - 6

        const addMove = (tr, tc) => {
          if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false
          if (isAlly(board[tr][tc], white)) return false
          moves.push({ from: [r, c], to: [tr, tc] })
          return board[tr][tc] === 0
        }

        if (type === 1) { // Pawn
          const dir = white ? -1 : 1
          const startRow = white ? 6 : 1
          if (r + dir >= 0 && r + dir <= 7 && board[r + dir][c] === 0) {
            moves.push({ from: [r, c], to: [r + dir, c] })
            if (r === startRow && board[r + 2 * dir][c] === 0) {
              moves.push({ from: [r, c], to: [r + 2 * dir, c] })
            }
          }
          for (const dc of [-1, 1]) {
            const tr = r + dir, tc = c + dc
            if (tr >= 0 && tr <= 7 && tc >= 0 && tc <= 7 && isEnemy(board[tr][tc], white)) {
              moves.push({ from: [r, c], to: [tr, tc] })
            }
          }
        } else if (type === 2) { // Knight
          for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) addMove(r+dr,c+dc)
        } else if (type === 3 || type === 5) { // Bishop or Queen diagonals
          for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
            for (let i = 1; i < 8; i++) if (!addMove(r+dr*i,c+dc*i)) break
          }
        }
        if (type === 4 || type === 5) { // Rook or Queen straights
          for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
            for (let i = 1; i < 8; i++) if (!addMove(r+dr*i,c+dc*i)) break
          }
        }
        if (type === 6) { // King
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr||dc) addMove(r+dr,c+dc)
        }
      }
    }
    return moves
  }

  _makeMove(board, move) {
    const b = board.map(r => [...r])
    b[move.to[0]][move.to[1]] = b[move.from[0]][move.from[1]]
    b[move.from[0]][move.from[1]] = 0
    // Pawn promotion
    const p = b[move.to[0]][move.to[1]]
    if ((p === PIECES.WP && move.to[0] === 0)) b[move.to[0]][move.to[1]] = PIECES.WQ
    if ((p === PIECES.BP && move.to[0] === 7)) b[move.to[0]][move.to[1]] = PIECES.BQ
    return b
  }

  materialEval(board) {
    let score = 0
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        score += PIECE_VALUES[board[r][c]] || 0
    return score
  }

  minimax(board, depth, alpha, beta, maximizing, evalFn) {
    const moves = this._generateMoves(board, maximizing)
    if (depth === 0 || moves.length === 0) return { score: evalFn(board), move: null }

    let bestMove = moves[0]
    if (maximizing) {
      let maxEval = -Infinity
      for (const move of moves) {
        const newBoard = this._makeMove(board, move)
        const { score } = this.minimax(newBoard, depth - 1, alpha, beta, false, evalFn)
        if (score > maxEval) { maxEval = score; bestMove = move }
        alpha = Math.max(alpha, score)
        if (beta <= alpha) break
      }
      return { score: maxEval, move: bestMove }
    } else {
      let minEval = Infinity
      for (const move of moves) {
        const newBoard = this._makeMove(board, move)
        const { score } = this.minimax(newBoard, depth - 1, alpha, beta, true, evalFn)
        if (score < minEval) { minEval = score; bestMove = move }
        beta = Math.min(beta, score)
        if (beta <= alpha) break
      }
      return { score: minEval, move: bestMove }
    }
  }

  step(action, evalFn = null) {
    if (this.done) return { state: this.getStateVector(), reward: 0, done: true, score: this.score }

    const fn = evalFn || ((b) => this.materialEval(b))
    const { move } = this.minimax(this.board, CHESS_CONFIG.searchDepth, -Infinity, Infinity, this.whiteToMove, fn)

    if (!move) {
      this.done = true
      return { state: this.getStateVector(), reward: 0, done: true, score: this.score }
    }

    const captured = this.board[move.to[0]][move.to[1]]
    this.board = this._makeMove(this.board, move)
    this.whiteToMove = !this.whiteToMove
    this.steps++
    this.moveHistory.push(move)

    if (captured) this.score += Math.abs(PIECE_VALUES[captured] || 0)
    if (this.steps > 100) this.done = true

    return { state: this.getStateVector(), reward: captured ? 1 : 0, done: this.done, score: this.score }
  }

  getState() {
    return {
      board: this.board.map(r => [...r]),
      whiteToMove: this.whiteToMove,
      score: this.score,
      done: this.done,
      moveHistory: [...this.moveHistory],
    }
  }

  getStateVector() {
    // 8x8x12 one-hot + metadata
    const vec = []
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++) {
        const oneHot = Array(12).fill(0)
        if (this.board[r][c] > 0) oneHot[this.board[r][c] - 1] = 1
        vec.push(...oneHot)
      }
    // Metadata
    vec.push(this.whiteToMove ? 1 : 0)
    vec.push(this.materialEval(this.board) / 40)
    vec.push(this.steps / 100)
    vec.push(this.castling.wk ? 1 : 0, this.castling.wq ? 1 : 0, this.castling.bk ? 1 : 0, this.castling.bq ? 1 : 0)
    // Pad to 780
    while (vec.length < 780) vec.push(0)
    return vec.slice(0, 780)
  }

  clone() {
    const c = new ChessEngine()
    c.board = this.board.map(r => [...r])
    c.whiteToMove = this.whiteToMove
    c.castling = { ...this.castling }
    c.score = this.score; c.done = this.done; c.steps = this.steps
    c.moveHistory = [...this.moveHistory]
    return c
  }
}
