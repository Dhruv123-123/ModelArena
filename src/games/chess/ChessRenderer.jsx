const PIECE_UNICODE = {
  0: '',
  1: '♔',
  2: '♕',
  3: '♖',
  4: '♗',
  5: '♘',
  6: '♙',
  7: '♚',
  8: '♛',
  9: '♜',
  10: '♝',
  11: '♞',
  12: '♟',
};

const WHITE_PIECES = new Set([1, 2, 3, 4, 5, 6]);

function isLightSquare(r, c) {
  return (r + c) % 2 === 1;
}

export function ChessRenderer({
  gameState,
  width: _width,
  height: _height,
  qValues: _qValues,
  onSquareClick,
}) {
  if (!gameState) return null;

  const {
    board,
    turn,
    legalMoves = [],
    isCheck,
    done,
    result,
    lastMove,
  } = gameState;

  const legalTargets = new Set(
    legalMoves.map((m) => `${m.to[0]},${m.to[1]}`)
  );

  const lastFrom = lastMove ? `${lastMove.from[0]},${lastMove.from[1]}` : null;
  const lastTo = lastMove ? `${lastMove.to[0]},${lastMove.to[1]}` : null;

  let kingInCheckSquare = null;
  if (isCheck) {
    const kingPiece = turn === 'white' ? 1 : 7;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === kingPiece) {
          kingInCheckSquare = `${r},${c}`;
          break;
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid aspect-square w-full max-w-[min(480px,90vw)] border border-border rounded-lg overflow-hidden"
        style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
        role="grid"
        aria-label="Chess board"
      >
        {board.map((row, r) =>
          row.map((piece, c) => {
            const key = `${r},${c}`;
            const light = isLightSquare(r, c);
            const isLast =
              key === lastFrom || key === lastTo;
            const isLegal = legalTargets.has(key);
            const isKingCheck = key === kingInCheckSquare;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSquareClick?.(r, c)}
                className="relative flex aspect-square items-center justify-center text-3xl sm:text-4xl transition-colors"
                style={{
                  backgroundColor: light ? '#2d3035' : '#1e2023',
                  boxShadow: isLast
                    ? 'inset 0 0 0 2px rgba(234,179,8,0.5)'
                    : isKingCheck
                      ? 'inset 0 0 12px rgba(239,68,68,0.6)'
                      : undefined,
                }}
              >
                {isLegal && (
                  <span
                    className="absolute size-3 rounded-full bg-primary/40"
                    aria-hidden
                  />
                )}
                <span
                  style={{
                    color: WHITE_PIECES.has(piece) ? '#f8fafc' : '#94a3b8',
                    textShadow: WHITE_PIECES.has(piece)
                      ? '0 1px 3px rgba(0,0,0,0.8)'
                      : '0 1px 3px rgba(0,0,0,0.6)',
                  }}
                >
                  {PIECE_UNICODE[piece]}
                </span>
              </button>
            );
          })
        )}
      </div>

      <p className="text-sm text-text-muted">
        {done
          ? `Game over — ${result === 'draw' ? 'Draw' : `${result} wins`}`
          : `${turn === 'white' ? 'White' : 'Black'} to move`}
        {isCheck && !done && ' · Check'}
      </p>
    </div>
  );
}
