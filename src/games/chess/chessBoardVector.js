const PIECE_TYPES = 12;

function pieceToIndex(piece) {
  if (piece === 0) return -1;
  return piece - 1;
}

export function boardToVector(board, meta = {}) {
  const vec = new Float32Array(780);
  let offset = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      const idx = pieceToIndex(piece);
      if (idx >= 0) {
        vec[offset + idx] = 1;
      }
      offset += PIECE_TYPES;
    }
  }

  const extras = offset;
  vec[extras + 0] = meta.turn === 'black' ? 1 : 0;

  const cr = meta.castlingRights ?? {};
  vec[extras + 1] = cr.whiteKing ? 1 : 0;
  vec[extras + 2] = cr.whiteQueen ? 1 : 0;
  vec[extras + 3] = cr.blackKing ? 1 : 0;
  vec[extras + 4] = cr.blackQueen ? 1 : 0;

  if (meta.enPassant) {
    vec[extras + 5] = (meta.enPassant[1] + 1) / 8;
  } else {
    vec[extras + 5] = 0;
  }

  vec[extras + 6] = Math.min((meta.halfMoveClock ?? 0) / 100, 1);
  vec[extras + 7] = Math.min((meta.fullMoveNumber ?? 1) / 200, 1);
  vec[extras + 8] = meta.isCheck ? 1 : 0;
  vec[extras + 9] = meta.legalMoveCount != null ? Math.min(meta.legalMoveCount / 50, 1) : 0;
  vec[extras + 10] = meta.capturedWhite ?? 0;
  vec[extras + 11] = meta.capturedBlack ?? 0;

  return vec;
}
