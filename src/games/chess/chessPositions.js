// Bundled labeled positions for supervised training
// Each position has a board state (simplified) and a stockfish eval score
// In a real app these would be thousands of positions; this is a representative sample.

export const LABELED_POSITIONS = Array.from({ length: 200 }, (_, i) => {
  // Generate synthetic training data with known patterns
  const board = Array(8).fill(null).map(() => Array(8).fill(0))

  // Place kings
  board[0][4] = 12 // BK
  board[7][4] = 6  // WK

  // Add some pieces with varying material balance
  const materialBias = (i % 20 - 10) / 10 // -1 to 1

  // White pawns
  const wpCount = 4 + Math.floor(Math.random() * 3)
  for (let p = 0; p < wpCount; p++) {
    const r = 3 + Math.floor(Math.random() * 3)
    const c = Math.floor(Math.random() * 8)
    if (board[r][c] === 0) board[r][c] = 1
  }

  // Black pawns
  const bpCount = 4 + Math.floor(Math.random() * 3)
  for (let p = 0; p < bpCount; p++) {
    const r = 1 + Math.floor(Math.random() * 3)
    const c = Math.floor(Math.random() * 8)
    if (board[r][c] === 0) board[r][c] = 7
  }

  // Add some pieces
  if (i % 3 === 0) { board[7][0] = 4; board[0][0] = 10 } // Rooks
  if (i % 4 === 0) { board[7][2] = 3 } // Bishop
  if (i % 5 === 0) { board[0][5] = 9 } // Bishop
  if (materialBias > 0.5) board[7][3] = 5 // White queen
  if (materialBias < -0.5) board[0][3] = 11 // Black queen

  // Calculate material score as label
  let eval_score = 0
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      const values = { 1: 1, 2: 3, 3: 3, 4: 5, 5: 9, 7: -1, 8: -3, 9: -3, 10: -5, 11: -9 }
      eval_score += values[p] || 0
    }

  // Normalize to [-1, 1]
  eval_score = Math.tanh(eval_score / 10)

  return { board, eval: eval_score }
})
