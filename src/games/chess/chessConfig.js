export const CHESS_CONFIG = {
  inputSize: 780,
  outputSize: 1,
  actionLabels: ['Eval Score'],
  trainingMode: 'supervised',
  searchDepth: 3,
}

export const PIECES = {
  EMPTY: 0, WP: 1, WN: 2, WB: 3, WR: 4, WQ: 5, WK: 6,
  BP: 7, BN: 8, BB: 9, BR: 10, BQ: 11, BK: 12,
}

export const PIECE_VALUES = {
  [PIECES.WP]: 1, [PIECES.WN]: 3, [PIECES.WB]: 3, [PIECES.WR]: 5, [PIECES.WQ]: 9, [PIECES.WK]: 0,
  [PIECES.BP]: -1, [PIECES.BN]: -3, [PIECES.BB]: -3, [PIECES.BR]: -5, [PIECES.BQ]: -9, [PIECES.BK]: 0,
}

// Piece-square tables (simplified)
export const PST = {
  [PIECES.WP]: [
    0,0,0,0,0,0,0,0, 5,5,5,5,5,5,5,5, 1,1,2,3,3,2,1,1, 0.5,0.5,1,2.5,2.5,1,0.5,0.5,
    0,0,0,2,2,0,0,0, 0.5,-0.5,-1,0,0,-1,-0.5,0.5, 0.5,1,1,-2,-2,1,1,0.5, 0,0,0,0,0,0,0,0
  ],
}
