import { GameEngine } from '../GameEngine.js';
import { boardToVector } from './chessBoardVector.js';

const ACTION_SPACE = 1;

const PIECE = {
  EMPTY: 0,
  WK: 1,
  WQ: 2,
  WR: 3,
  WB: 4,
  WN: 5,
  WP: 6,
  BK: 7,
  BQ: 8,
  BR: 9,
  BB: 10,
  BN: 11,
  BP: 12,
};

const WHITE_PIECES = new Set([1, 2, 3, 4, 5, 6]);
const BLACK_PIECES = new Set([7, 8, 9, 10, 11, 12]);

const PROMO_MAP = { q: PIECE.WQ, r: PIECE.WR, b: PIECE.WB, n: PIECE.WN };
const BLACK_PROMO_MAP = { q: PIECE.BQ, r: PIECE.BR, b: PIECE.BB, n: PIECE.BN };

function isWhite(piece) {
  return WHITE_PIECES.has(piece);
}

function isBlack(piece) {
  return BLACK_PIECES.has(piece);
}

function colorOf(piece) {
  if (isWhite(piece)) return 'white';
  if (isBlack(piece)) return 'black';
  return null;
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function startingBoard() {
  return [
    [9, 11, 10, 8, 7, 10, 11, 9],
    [12, 12, 12, 12, 12, 12, 12, 12],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [6, 6, 6, 6, 6, 6, 6, 6],
    [3, 5, 4, 2, 1, 4, 5, 3],
  ];
}

export class ChessEngine extends GameEngine {
  constructor() {
    super();
    this.board = startingBoard();
    this.turn = 'white';
    this.moveHistory = [];
    this.capturedPieces = { white: 0, black: 0 };
    this.castlingRights = {
      whiteKing: true,
      whiteQueen: true,
      blackKing: true,
      blackQueen: true,
    };
    this.enPassant = null;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.done = false;
    this.result = null;
    this.steps = 0;
    this.lastMove = null;
    this._cachedLegalMoves = null;
  }

  reset() {
    this.board = startingBoard();
    this.turn = 'white';
    this.moveHistory = [];
    this.capturedPieces = { white: 0, black: 0 };
    this.castlingRights = {
      whiteKing: true,
      whiteQueen: true,
      blackKing: true,
      blackQueen: true,
    };
    this.enPassant = null;
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.done = false;
    this.result = null;
    this.steps = 0;
    this.lastMove = null;
    this._cachedLegalMoves = null;
    return this.getStateVector();
  }

  getKingSquare(board, color) {
    const target = color === 'white' ? PIECE.WK : PIECE.BK;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === target) return [r, c];
      }
    }
    return null;
  }

  isSquareAttacked(board, row, col, byColor) {
    const pawn =
      byColor === 'white' ? PIECE.WP : PIECE.BP;
    const pawnDir = byColor === 'white' ? -1 : 1;
    for (const dc of [-1, 1]) {
      const pr = row + pawnDir;
      const pc = col + dc;
      if (pr >= 0 && pr < 8 && pc >= 0 && pc < 8 && board[pr][pc] === pawn) {
        return true;
      }
    }

    const knight =
      byColor === 'white' ? PIECE.WN : PIECE.BN;
    const knightOffsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    for (const [dr, dc] of knightOffsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === knight) {
        return true;
      }
    }

    const bishop =
      byColor === 'white' ? PIECE.WB : PIECE.BB;
    const rook = byColor === 'white' ? PIECE.WR : PIECE.BR;
    const queen = byColor === 'white' ? PIECE.WQ : PIECE.BQ;
    const king = byColor === 'white' ? PIECE.WK : PIECE.BK;

    const diagDirs = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    for (const [dr, dc] of diagDirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p !== PIECE.EMPTY) {
          if (p === bishop || p === queen) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    const orthDirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ];
    for (const [dr, dc] of orthDirs) {
      let nr = row + dr;
      let nc = col + dc;
      while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const p = board[nr][nc];
        if (p !== PIECE.EMPTY) {
          if (p === rook || p === queen) return true;
          break;
        }
        nr += dr;
        nc += dc;
      }
    }

    for (const [dr, dc] of [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === king) {
        return true;
      }
    }

    return false;
  }

  isInCheck(color, board = this.board) {
    const king = this.getKingSquare(board, color);
    if (!king) return false;
    const attacker = color === 'white' ? 'black' : 'white';
    return this.isSquareAttacked(board, king[0], king[1], attacker);
  }

  _generatePseudoLegal(board, turn, castlingRights, enPassant) {
    const moves = [];
    const isWhiteTurn = turn === 'white';

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece === PIECE.EMPTY) continue;
        if (isWhiteTurn && !isWhite(piece)) continue;
        if (!isWhiteTurn && !isBlack(piece)) continue;

        if (piece === PIECE.WP || piece === PIECE.BP) {
          const dir = isWhite(piece) ? -1 : 1;
          const startRow = isWhite(piece) ? 6 : 1;
          const promoRow = isWhite(piece) ? 0 : 7;
          const color = isWhite(piece) ? 'white' : 'black';

          const nr = r + dir;
          if (nr >= 0 && nr < 8 && board[nr][c] === PIECE.EMPTY) {
            if (nr === promoRow) {
              for (const promo of ['q', 'r', 'b', 'n']) {
                moves.push({ from: [r, c], to: [nr, c], promotion: promo });
              }
            } else {
              moves.push({ from: [r, c], to: [nr, c] });
            }
            if (r === startRow && board[nr + dir]?.[c] === PIECE.EMPTY) {
              moves.push({ from: [r, c], to: [nr + dir, c] });
            }
          }

          for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
            const target = board[nr][nc];
            if (
              enPassant &&
              enPassant[0] === nr &&
              enPassant[1] === nc
            ) {
              moves.push({ from: [r, c], to: [nr, nc], enPassant: true });
            } else if (target !== PIECE.EMPTY && colorOf(target) !== color) {
              if (nr === promoRow) {
                for (const promo of ['q', 'r', 'b', 'n']) {
                  moves.push({ from: [r, c], to: [nr, nc], promotion: promo });
                }
              } else {
                moves.push({ from: [r, c], to: [nr, nc] });
              }
            }
          }
          continue;
        }

        const sliders = [];
        if (piece === PIECE.WB || piece === PIECE.BB) {
          sliders.push(
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1]
          );
        }
        if (piece === PIECE.WR || piece === PIECE.BR) {
          sliders.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        }
        if (piece === PIECE.WQ || piece === PIECE.BQ) {
          sliders.push(
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1]
          );
        }

        for (const [dr, dc] of sliders) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            const target = board[nr][nc];
            if (target === PIECE.EMPTY) {
              moves.push({ from: [r, c], to: [nr, nc] });
            } else {
              if (colorOf(target) !== turn) {
                moves.push({ from: [r, c], to: [nr, nc] });
              }
              break;
            }
            nr += dr;
            nc += dc;
          }
        }

        if (piece === PIECE.WN || piece === PIECE.BN) {
          for (const [dr, dc] of [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1],
          ]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
            const target = board[nr][nc];
            if (target === PIECE.EMPTY || colorOf(target) !== turn) {
              moves.push({ from: [r, c], to: [nr, nc] });
            }
          }
        }

        if (piece === PIECE.WK || piece === PIECE.BK) {
          for (const [dr, dc] of [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue;
            const target = board[nr][nc];
            if (target === PIECE.EMPTY || colorOf(target) !== turn) {
              moves.push({ from: [r, c], to: [nr, nc] });
            }
          }

          if (turn === 'white' && piece === PIECE.WK && r === 7 && c === 4) {
            if (
              castlingRights.whiteKing &&
              board[7][5] === PIECE.EMPTY &&
              board[7][6] === PIECE.EMPTY &&
              board[7][7] === PIECE.WR
            ) {
              moves.push({ from: [7, 4], to: [7, 6], castle: 'K' });
            }
            if (
              castlingRights.whiteQueen &&
              board[7][1] === PIECE.EMPTY &&
              board[7][2] === PIECE.EMPTY &&
              board[7][3] === PIECE.EMPTY &&
              board[7][0] === PIECE.WR
            ) {
              moves.push({ from: [7, 4], to: [7, 2], castle: 'Q' });
            }
          }
          if (turn === 'black' && piece === PIECE.BK && r === 0 && c === 4) {
            if (
              castlingRights.blackKing &&
              board[0][5] === PIECE.EMPTY &&
              board[0][6] === PIECE.EMPTY &&
              board[0][7] === PIECE.BR
            ) {
              moves.push({ from: [0, 4], to: [0, 6], castle: 'K' });
            }
            if (
              castlingRights.blackQueen &&
              board[0][1] === PIECE.EMPTY &&
              board[0][2] === PIECE.EMPTY &&
              board[0][3] === PIECE.EMPTY &&
              board[0][0] === PIECE.BR
            ) {
              moves.push({ from: [0, 4], to: [0, 2], castle: 'Q' });
            }
          }
        }
      }
    }

    return moves;
  }

  _applyMoveOnBoard(board, move, state) {
    const newBoard = cloneBoard(board);
    const [fr, fc] = move.from;
    const [tr, tc] = move.to;
    const piece = newBoard[fr][fc];
    const captured = newBoard[tr][tc];

    let newCastling = { ...state.castlingRights };
    let newEnPassant = null;
    let halfMove = state.halfMoveClock + 1;

    if (piece === PIECE.WP || piece === PIECE.BP) {
      halfMove = 0;
    }
    if (captured !== PIECE.EMPTY) {
      halfMove = 0;
    }

    if (move.enPassant) {
      const capRow = state.turn === 'white' ? tr + 1 : tr - 1;
      newBoard[capRow][tc] = PIECE.EMPTY;
    }

    newBoard[tr][tc] = piece;
    newBoard[fr][fc] = PIECE.EMPTY;

    if (move.promotion) {
      const map = state.turn === 'white' ? PROMO_MAP : BLACK_PROMO_MAP;
      newBoard[tr][tc] = map[move.promotion] ?? newBoard[tr][tc];
    }

    if (move.castle === 'K') {
      if (state.turn === 'white') {
        newBoard[7][5] = PIECE.WR;
        newBoard[7][7] = PIECE.EMPTY;
      } else {
        newBoard[0][5] = PIECE.BR;
        newBoard[0][7] = PIECE.EMPTY;
      }
    }
    if (move.castle === 'Q') {
      if (state.turn === 'white') {
        newBoard[7][3] = PIECE.WR;
        newBoard[7][0] = PIECE.EMPTY;
      } else {
        newBoard[0][3] = PIECE.BR;
        newBoard[0][0] = PIECE.EMPTY;
      }
    }

    if (piece === PIECE.WK) {
      newCastling.whiteKing = false;
      newCastling.whiteQueen = false;
    }
    if (piece === PIECE.BK) {
      newCastling.blackKing = false;
      newCastling.blackQueen = false;
    }
    if (fr === 7 && fc === 0) newCastling.whiteQueen = false;
    if (fr === 7 && fc === 7) newCastling.whiteKing = false;
    if (fr === 0 && fc === 0) newCastling.blackQueen = false;
    if (fr === 0 && fc === 7) newCastling.blackKing = false;
    if (tr === 7 && tc === 0) newCastling.whiteQueen = false;
    if (tr === 7 && tc === 7) newCastling.whiteKing = false;
    if (tr === 0 && tc === 0) newCastling.blackQueen = false;
    if (tr === 0 && tc === 7) newCastling.blackKing = false;

    if (piece === PIECE.WP && fr === 6 && tr === 4) {
      newEnPassant = [5, fc];
    }
    if (piece === PIECE.BP && fr === 1 && tr === 3) {
      newEnPassant = [2, fc];
    }

    const nextTurn = state.turn === 'white' ? 'black' : 'white';
    let fullMove = state.fullMoveNumber;
    if (nextTurn === 'white') fullMove += 1;

    return {
      board: newBoard,
      turn: nextTurn,
      castlingRights: newCastling,
      enPassant: newEnPassant,
      halfMoveClock: halfMove,
      fullMoveNumber: fullMove,
      captured: captured !== PIECE.EMPTY ? captured : move.enPassant ? (state.turn === 'white' ? PIECE.BP : PIECE.WP) : null,
    };
  }

  _filterLegal(moves, board, turn, castlingRights, enPassant) {
    const legal = [];
    const state = {
      turn,
      castlingRights,
      enPassant,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
    };

    for (const move of moves) {
      const next = this._applyMoveOnBoard(board, move, state);
      if (!this.isInCheck(turn, next.board)) {
        if (move.castle) {
          const kingRow = turn === 'white' ? 7 : 0;
          const kingCol = 4;
          const step = move.castle === 'K' ? 1 : -1;
          const mid1 = kingCol + step;
          const mid2 = kingCol + 2 * step;
          const attacker = turn === 'white' ? 'black' : 'white';
          if (
            this.isSquareAttacked(board, kingRow, kingCol, attacker) ||
            this.isSquareAttacked(board, kingRow, mid1, attacker) ||
            this.isSquareAttacked(board, kingRow, mid2, attacker)
          ) {
            continue;
          }
        }
        legal.push(move);
      }
    }
    return legal;
  }

  getLegalMoves() {
    const pseudo = this._generatePseudoLegal(
      this.board,
      this.turn,
      this.castlingRights,
      this.enPassant
    );
    return this._filterLegal(
      pseudo,
      this.board,
      this.turn,
      this.castlingRights,
      this.enPassant
    );
  }

  isCheckmate(color) {
    if (!this.isInCheck(color)) return false;
    const savedTurn = this.turn;
    this.turn = color;
    const legal = this.getLegalMoves();
    this.turn = savedTurn;
    return legal.length === 0;
  }

  isStalemate(color) {
    if (this.isInCheck(color)) return false;
    const savedTurn = this.turn;
    this.turn = color;
    const legal = this.getLegalMoves();
    this.turn = savedTurn;
    return legal.length === 0;
  }

  _resolveGameEnd() {
    const inCheck = this.isInCheck(this.turn);
    const legal = this.getLegalMoves();
    if (legal.length > 0) return;

    this.done = true;
    if (inCheck) {
      this.result = this.turn === 'white' ? 'black' : 'white';
    } else {
      this.result = 'draw';
    }
  }

  _applyMove(move) {
    const state = {
      turn: this.turn,
      castlingRights: this.castlingRights,
      enPassant: this.enPassant,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
    };
    const next = this._applyMoveOnBoard(this.board, move, state);

    if (next.captured) {
      if (isWhite(next.captured)) this.capturedPieces.white++;
      else if (isBlack(next.captured)) this.capturedPieces.black++;
    }

    this.board = next.board;
    this.turn = next.turn;
    this.castlingRights = next.castlingRights;
    this.enPassant = next.enPassant;
    this.halfMoveClock = next.halfMoveClock;
    this.fullMoveNumber = next.fullMoveNumber;
    this.lastMove = move;
    this.moveHistory.push(move);
    this._cachedLegalMoves = null;
  }

  _moveKey(m) {
    return `${m.from[0]},${m.from[1]}-${m.to[0]},${m.to[1]}-${m.promotion ?? ''}`;
  }

  _findMove(action, legal) {
    if (typeof action === 'number') {
      return legal[action % legal.length];
    }
    if (typeof action === 'object' && action.from && action.to) {
      const key = this._moveKey(action);
      return (
        legal.find((m) => this._moveKey(m) === key) ?? action
      );
    }
    return legal[0];
  }

  _minimaxOpponentMove(evalFn, depth = 2) {
    const legal = this.getLegalMoves();
    if (legal.length === 0) return null;

    const maximizing = this.turn === 'white';

    const evaluate = (board, turn) => {
      const saved = {
        board: this.board,
        turn: this.turn,
        castlingRights: this.castlingRights,
        enPassant: this.enPassant,
        halfMoveClock: this.halfMoveClock,
        fullMoveNumber: this.fullMoveNumber,
      };
      this.board = board;
      this.turn = turn;
      const score = evalFn(this);
      this.board = saved.board;
      this.turn = saved.turn;
      this.castlingRights = saved.castlingRights;
      this.enPassant = saved.enPassant;
      this.halfMoveClock = saved.halfMoveClock;
      this.fullMoveNumber = saved.fullMoveNumber;
      return score;
    };

    const search = (board, turn, castlingRights, enPassant, halfMove, fullMove, d, alpha, beta) => {
      if (d === 0) {
        return evaluate(board, turn);
      }

      const pseudo = this._generatePseudoLegal(board, turn, castlingRights, enPassant);
      const moves = this._filterLegal(pseudo, board, turn, castlingRights, enPassant);
      if (moves.length === 0) {
        if (this.isInCheck(turn, board)) {
          return maximizing ? -1000 : 1000;
        }
        return 0;
      }

      if (maximizing) {
        let value = -Infinity;
        for (const move of moves) {
          const next = this._applyMoveOnBoard(board, move, {
            turn,
            castlingRights,
            enPassant,
            halfMoveClock: halfMove,
            fullMoveNumber: fullMove,
          });
          value = Math.max(
            value,
            search(
              next.board,
              next.turn,
              next.castlingRights,
              next.enPassant,
              next.halfMoveClock,
              next.fullMoveNumber,
              d - 1,
              alpha,
              beta
            )
          );
          alpha = Math.max(alpha, value);
          if (beta <= alpha) break;
        }
        return value;
      }

      let value = Infinity;
      for (const move of moves) {
        const next = this._applyMoveOnBoard(board, move, {
          turn,
          castlingRights,
          enPassant,
          halfMoveClock: halfMove,
          fullMoveNumber: fullMove,
        });
        value = Math.min(
          value,
          search(
            next.board,
            next.turn,
            next.castlingRights,
            next.enPassant,
            next.halfMoveClock,
            next.fullMoveNumber,
            d - 1,
            alpha,
            beta
          )
        );
        beta = Math.min(beta, value);
        if (beta <= alpha) break;
      }
      return value;
    };

    let bestMove = legal[0];
    let bestScore = maximizing ? -Infinity : Infinity;

    for (const move of legal) {
      const next = this._applyMoveOnBoard(this.board, move, {
        turn: this.turn,
        castlingRights: this.castlingRights,
        enPassant: this.enPassant,
        halfMoveClock: this.halfMoveClock,
        fullMoveNumber: this.fullMoveNumber,
      });

      const score = search(
        next.board,
        next.turn,
        next.castlingRights,
        next.enPassant,
        next.halfMoveClock,
        next.fullMoveNumber,
        depth - 1,
        -Infinity,
        Infinity
      );

      if (maximizing ? score > bestScore : score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  step(action, evalFn) {
    if (this.done) {
      return {
        state: this.getStateVector(),
        reward: 0,
        done: true,
        score: this.getScore(),
      };
    }

    const legal = this.getLegalMoves();
    if (legal.length === 0) {
      this._resolveGameEnd();
      return {
        state: this.getStateVector(),
        reward: 0,
        done: this.done,
        score: this.getScore(),
      };
    }

    const agentColor = 'white';
    const move = this._findMove(action, legal);
    const evalBefore = evalFn ? evalFn(this) : 0;

    this._applyMove(move);
    this.steps++;

    let reward = 0;
    this._resolveGameEnd();

    if (!this.done && evalFn && this.turn !== agentColor) {
      const oppMove = this._minimaxOpponentMove(evalFn, 2);
      if (oppMove) {
        this._applyMove(oppMove);
        this._resolveGameEnd();
      }
    }

    if (evalFn && !this.done) {
      const evalAfter = evalFn(this);
      reward = evalAfter - evalBefore;
    }

    if (this.done) {
      if (this.result === 'white') reward = agentColor === 'white' ? 1 : -1;
      else if (this.result === 'black') reward = agentColor === 'white' ? -1 : 1;
      else reward = 0;
    }

    return {
      state: this.getStateVector(),
      reward,
      done: this.done,
      score: this.getScore(),
    };
  }

  getStateVector() {
    const legal = this.getLegalMoves();
    return boardToVector(this.board, {
      turn: this.turn,
      castlingRights: this.castlingRights,
      enPassant: this.enPassant,
      halfMoveClock: this.halfMoveClock,
      fullMoveNumber: this.fullMoveNumber,
      isCheck: this.isInCheck(this.turn),
      legalMoveCount: legal.length,
      capturedWhite: Math.min(this.capturedPieces.white / 16, 1),
      capturedBlack: Math.min(this.capturedPieces.black / 16, 1),
    });
  }

  getState() {
    return {
      board: cloneBoard(this.board),
      turn: this.turn,
      legalMoves: this.getLegalMoves(),
      isCheck: this.isInCheck(this.turn),
      done: this.done,
      result: this.result,
      moveHistory: [...this.moveHistory],
      lastMove: this.lastMove,
    };
  }

  getScore() {
    if (this.result === 'white') return 1;
    if (this.result === 'black') return -1;
    return 0;
  }

  isDone() {
    return this.done;
  }

  getSteps() {
    return this.steps;
  }

  getActionSpace() {
    return ACTION_SPACE;
  }
}
