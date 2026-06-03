const E = 0;
const WK = 1;
const WQ = 2;
const WR = 3;
const WB = 4;
const WN = 5;
const WP = 6;
const BK = 7;
const BQ = 8;
const BR = 9;
const BB = 10;
const BN = 11;
const BP = 12;

function board(rows) {
  return rows.map((r) => [...r]);
}

const chessPositions = [
  {
    name: 'Starting position',
    board: board([
      [BR, BN, BB, BQ, BK, BB, BN, BR],
      [BP, BP, BP, BP, BP, BP, BP, BP],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [WP, WP, WP, WP, WP, WP, WP, WP],
      [WR, WN, WB, WQ, WK, WB, WN, WR],
    ]),
    eval: 0,
  },
  {
    name: 'Italian opening',
    board: board([
      [BR, BN, BB, BQ, BK, BB, BN, BR],
      [BP, BP, BP, BP, BP, BP, BP, BP],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, WB, E, E],
      [E, E, E, E, WP, E, E, E],
      [E, E, WB, E, E, E, E, E],
      [WP, WP, WP, WP, E, WP, WP, WP],
      [WR, WN, E, WQ, WK, E, WN, WR],
    ]),
    eval: 0.15,
  },
  {
    name: 'Sicilian structure',
    board: board([
      [BR, BN, BB, BQ, BK, BB, BN, BR],
      [BP, BP, E, BP, BP, BP, BP, BP],
      [E, E, BP, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, WP, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [WP, WP, WP, E, WP, WP, WP, WP],
      [WR, WN, WB, WQ, WK, WB, WN, WR],
    ]),
    eval: -0.1,
  },
  {
    name: 'White space advantage',
    board: board([
      [BR, BN, BB, BQ, BK, BB, E, BR],
      [BP, BP, BP, E, BP, BP, BP, BP],
      [E, E, E, BP, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, WP, E, E, E, E, E],
      [E, E, E, E, E, WN, E, E],
      [WP, WP, E, WP, WP, WP, WP, WP],
      [WR, E, WB, WQ, WK, WB, WN, WR],
    ]),
    eval: 0.35,
  },
  {
    name: 'Black cramped',
    board: board([
      [E, BN, BB, BQ, BK, BB, BN, BR],
      [BP, BP, BP, BP, BP, BP, BP, E],
      [E, E, E, E, E, E, E, BP],
      [E, E, E, E, E, E, E, E],
      [E, E, WP, E, E, E, E, E],
      [E, E, E, E, E, WN, E, E],
      [WP, WP, WP, WP, WP, WP, WP, WP],
      [WR, WN, WB, WQ, WK, WB, E, WR],
    ]),
    eval: 0.55,
  },
  {
    name: 'Equal endgame',
    board: board([
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [WP, E, E, E, E, E, E, BP],
      [E, E, E, WK, E, BK, E, E],
    ]),
    eval: 0,
  },
  {
    name: 'White winning endgame',
    board: board([
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [WP, E, E, E, E, E, BP, BP],
      [E, E, WQ, WK, E, BK, E, E],
    ]),
    eval: 0.75,
  },
  {
    name: 'Black winning endgame',
    board: board([
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [BP, BP, E, E, E, E, WP, E],
      [E, E, BK, E, WK, BQ, E, E],
    ]),
    eval: -0.7,
  },
  {
    name: 'White checkmate pattern',
    board: board([
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, WQ, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, WK, E, BK, E, E],
    ]),
    eval: 0.95,
  },
  {
    name: 'Black checkmate pattern',
    board: board([
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, BQ, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, E, E, E, E, E, E],
      [E, E, WK, E, BK, E, E, E],
    ]),
    eval: -0.95,
  },
];

function mirrorEval(b, evalScore) {
  return { board: b, eval: evalScore };
}

const generated = [];
for (let i = 0; i < 45; i++) {
  const base = chessPositions[i % chessPositions.length];
  const jitter = ((i % 7) - 3) * 0.02;
  const evalClamped = Math.max(-1, Math.min(1, base.eval + jitter));
  generated.push(mirrorEval(base.board.map((r) => [...r]), evalClamped));
}

export default [...chessPositions.map((p) => ({ board: p.board, eval: p.eval })), ...generated.map((p) => ({ board: p.board, eval: p.eval }))];
