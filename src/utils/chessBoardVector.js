/** Flatten 8×8 board to 780-dim vector (matches SupervisedTrainer / getStateVector piece grid). */
export function boardToVector(board) {
  const vec = []
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const oneHot = Array(12).fill(0)
      if (board[r][c] > 0) oneHot[board[r][c] - 1] = 1
      vec.push(...oneHot)
    }
  while (vec.length < 780) vec.push(0)
  return vec.slice(0, 780)
}
