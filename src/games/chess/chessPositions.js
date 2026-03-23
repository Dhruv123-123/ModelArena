import { PIECES, PIECE_VALUES } from './chessConfig.js'

// Generate diverse labeled positions for supervised training
// Positions include: opening structures, middlegame imbalances, endgame patterns
// Labels are material + positional evaluation normalized to [-1, 1]

const P = PIECES

// Piece-square bonus tables (simplified, from white's perspective, index = row*8+col)
const PAWN_TABLE = [
  0,0,0,0,0,0,0,0,
  0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,
  0.1,0.1,0.2,0.3,0.3,0.2,0.1,0.1,
  0.05,0.05,0.1,0.25,0.25,0.1,0.05,0.05,
  0,0,0,0.2,0.2,0,0,0,
  0.05,-0.05,-0.1,0,0,-0.1,-0.05,0.05,
  0.05,0.1,0.1,-0.2,-0.2,0.1,0.1,0.05,
  0,0,0,0,0,0,0,0
]

const KNIGHT_TABLE = [
  -0.5,-0.4,-0.3,-0.3,-0.3,-0.3,-0.4,-0.5,
  -0.4,-0.2,0,0,0,0,-0.2,-0.4,
  -0.3,0,0.1,0.15,0.15,0.1,0,-0.3,
  -0.3,0.05,0.15,0.2,0.2,0.15,0.05,-0.3,
  -0.3,0,0.15,0.2,0.2,0.15,0,-0.3,
  -0.3,0.05,0.1,0.15,0.15,0.1,0.05,-0.3,
  -0.4,-0.2,0,0.05,0.05,0,-0.2,-0.4,
  -0.5,-0.4,-0.3,-0.3,-0.3,-0.3,-0.4,-0.5
]

function evalPosition(board) {
  let score = 0
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p === 0) continue
      // Material
      score += PIECE_VALUES[p] || 0
      // Positional bonus
      const idx = r * 8 + c
      const mirrorIdx = (7 - r) * 8 + c
      const type = p <= 6 ? p : p - 6
      if (type === 1) { // Pawn
        score += (p <= 6 ? PAWN_TABLE[idx] : -PAWN_TABLE[mirrorIdx])
      } else if (type === 2) { // Knight
        score += (p <= 6 ? KNIGHT_TABLE[idx] : -KNIGHT_TABLE[mirrorIdx])
      }
    }
  }
  // Center control bonus
  for (const [r, c] of [[3,3],[3,4],[4,3],[4,4]]) {
    const p = board[r][c]
    if (p > 0 && p <= 6) score += 0.1
    else if (p >= 7) score -= 0.1
  }
  return Math.tanh(score / 10)
}

function randomPiece(white) {
  const pieces = white ? [P.WN, P.WB, P.WR, P.WQ] : [P.BN, P.BB, P.BR, P.BQ]
  return pieces[Math.floor(Math.random() * pieces.length)]
}

function placeRandom(board, piece, rows) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const r = rows[Math.floor(Math.random() * rows.length)]
    const c = Math.floor(Math.random() * 8)
    if (board[r][c] === 0) {
      board[r][c] = piece
      return true
    }
  }
  return false
}

function generatePosition(seed) {
  const board = Array(8).fill(null).map(() => Array(8).fill(0))

  // Place kings in reasonable positions
  const wkCol = 2 + Math.floor((seed * 7) % 5)
  const bkCol = 2 + Math.floor((seed * 13) % 5)
  const wkRow = 6 + (seed % 2)
  const bkRow = seed % 3 === 0 ? 0 : (seed % 3 === 1 ? 1 : 0)
  board[wkRow][wkCol] = P.WK
  board[bkRow][bkCol] = P.BK

  const posType = seed % 10

  if (posType < 3) {
    // Opening-like: pawns + minor pieces
    const wpCount = 5 + (seed % 4)
    for (let i = 0; i < wpCount; i++) placeRandom(board, P.WP, [4, 5, 6])
    const bpCount = 5 + ((seed * 3) % 4)
    for (let i = 0; i < bpCount; i++) placeRandom(board, P.BP, [1, 2, 3])
    placeRandom(board, P.WN, [5, 6, 7])
    placeRandom(board, P.WB, [5, 6, 7])
    placeRandom(board, P.BN, [0, 1, 2])
    placeRandom(board, P.BB, [0, 1, 2])
    if (seed % 3 === 0) { placeRandom(board, P.WR, [7]); placeRandom(board, P.BR, [0]) }
  } else if (posType < 5) {
    // Middlegame: more pieces, imbalanced
    for (let i = 0; i < 3 + (seed % 3); i++) placeRandom(board, P.WP, [3, 4, 5, 6])
    for (let i = 0; i < 3 + ((seed * 7) % 3); i++) placeRandom(board, P.BP, [1, 2, 3, 4])
    const wPieces = 2 + (seed % 3)
    const bPieces = 2 + ((seed * 11) % 3)
    for (let i = 0; i < wPieces; i++) placeRandom(board, randomPiece(true), [3, 4, 5, 6, 7])
    for (let i = 0; i < bPieces; i++) placeRandom(board, randomPiece(false), [0, 1, 2, 3, 4])
  } else if (posType < 7) {
    // Material advantage for white
    for (let i = 0; i < 4; i++) placeRandom(board, P.WP, [3, 4, 5, 6])
    for (let i = 0; i < 2; i++) placeRandom(board, P.BP, [1, 2, 3])
    placeRandom(board, P.WQ, [3, 4, 5])
    placeRandom(board, P.WR, [6, 7])
    placeRandom(board, P.BN, [1, 2])
  } else if (posType < 9) {
    // Material advantage for black
    for (let i = 0; i < 2; i++) placeRandom(board, P.WP, [4, 5, 6])
    for (let i = 0; i < 4; i++) placeRandom(board, P.BP, [1, 2, 3, 4])
    placeRandom(board, P.BQ, [2, 3, 4])
    placeRandom(board, P.BR, [0, 1])
    placeRandom(board, P.WB, [5, 6])
  } else {
    // Endgame: few pieces
    const hasPawns = seed % 2 === 0
    if (hasPawns) {
      placeRandom(board, P.WP, [3, 4, 5])
      placeRandom(board, P.BP, [2, 3, 4])
    }
    if (seed % 3 === 0) placeRandom(board, P.WR, [4, 5, 6])
    else placeRandom(board, P.WB, [4, 5, 6])
    if (seed % 5 < 3) placeRandom(board, P.BR, [1, 2, 3])
  }

  return { board, eval: evalPosition(board) }
}

// Generate 500 positions with diverse seeds
export const LABELED_POSITIONS = []
for (let i = 0; i < 500; i++) {
  LABELED_POSITIONS.push(generatePosition(i * 17 + 3))
}

// Additional hand-crafted positions for key patterns
const HAND_CRAFTED = [
  // Equal position
  (() => {
    const b = Array(8).fill(null).map(() => Array(8).fill(0))
    b[7] = [P.WR,P.WN,P.WB,P.WQ,P.WK,P.WB,P.WN,P.WR]
    b[6] = [P.WP,P.WP,P.WP,P.WP,P.WP,P.WP,P.WP,P.WP]
    b[1] = [P.BP,P.BP,P.BP,P.BP,P.BP,P.BP,P.BP,P.BP]
    b[0] = [P.BR,P.BN,P.BB,P.BQ,P.BK,P.BB,P.BN,P.BR]
    return { board: b, eval: 0 }
  })(),
  // White queen vs nothing (winning)
  (() => {
    const b = Array(8).fill(null).map(() => Array(8).fill(0))
    b[7][4] = P.WK; b[0][4] = P.BK; b[3][3] = P.WQ
    return { board: b, eval: evalPosition(b) }
  })(),
  // Rook endgame
  (() => {
    const b = Array(8).fill(null).map(() => Array(8).fill(0))
    b[7][4] = P.WK; b[0][4] = P.BK
    b[7][0] = P.WR; b[0][7] = P.BR
    b[5][3] = P.WP; b[2][4] = P.BP
    return { board: b, eval: evalPosition(b) }
  })(),
]

LABELED_POSITIONS.push(...HAND_CRAFTED)
