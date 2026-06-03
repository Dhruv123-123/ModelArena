import { GameEngine } from '../GameEngine.js';

const ACTION_SPACE = 4;
const INPUT_SIZE = 20;

function createEmptyGrid() {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function gridsEqual(a, b) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}

function rotateGridCW(grid) {
  const n = 4;
  const result = createEmptyGrid();
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = grid[r][c];
    }
  }
  return result;
}

function rotateGridCCW(grid) {
  return rotateGridCW(rotateGridCW(rotateGridCW(grid)));
}

function slideLeft(grid) {
  const newGrid = createEmptyGrid();
  let mergeReward = 0;

  for (let r = 0; r < 4; r++) {
    const row = grid[r].filter((v) => v !== 0);
    const merged = [];
    let i = 0;
    while (i < row.length) {
      if (i + 1 < row.length && row[i] === row[i + 1]) {
        const value = row[i] * 2;
        merged.push(value);
        mergeReward += value;
        i += 2;
      } else {
        merged.push(row[i]);
        i += 1;
      }
    }
    while (merged.length < 4) merged.push(0);
    newGrid[r] = merged;
  }

  return { newGrid, mergeReward };
}

export class TwentyFortyEightEngine extends GameEngine {
  constructor() {
    super();
    this.grid = createEmptyGrid();
    this.score = 0;
    this.done = false;
    this.steps = 0;
  }

  reset() {
    this.grid = createEmptyGrid();
    this.score = 0;
    this.done = false;
    this.steps = 0;
    this._spawnTile();
    this._spawnTile();
    return this.getStateVector();
  }

  _spawnTile() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (this.grid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  _hasValidMoves() {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = this.grid[r][c];
        if (v === 0) return true;
        if (c < 3 && this.grid[r][c + 1] === v) return true;
        if (r < 3 && this.grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  step(action) {
    if (this.done) {
      return {
        state: this.getStateVector(),
        reward: 0,
        done: true,
        score: this.score,
      };
    }

    let working = cloneGrid(this.grid);
    let rotations = 0;

    if (action === 0) {
      working = rotateGridCW(working);
      rotations = 1;
    } else if (action === 1) {
      working = rotateGridCCW(working);
      rotations = 3;
    } else if (action === 3) {
      working = rotateGridCW(rotateGridCW(working));
      rotations = 2;
    }

    const { newGrid, mergeReward } = slideLeft(working);

    let restored = newGrid;
    for (let i = 0; i < rotations; i++) {
      restored = rotateGridCCW(restored);
    }

    if (gridsEqual(restored, this.grid)) {
      this.steps++;
      const done = !this._hasValidMoves();
      this.done = done;
      return {
        state: this.getStateVector(),
        reward: -0.1,
        done,
        score: this.score,
      };
    }

    this.grid = restored;
    this.score += mergeReward;
    this._spawnTile();
    this.done = !this._hasValidMoves();
    this.steps++;

    return {
      state: this.getStateVector(),
      reward: mergeReward,
      done: this.done,
      score: this.score,
    };
  }

  getStateVector() {
    const vec = new Float32Array(INPUT_SIZE);
    let maxTile = 0;
    let emptyCount = 0;
    let adjacentPairs = 0;

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = this.grid[r][c];
        const idx = r * 4 + c;
        if (v === 0) {
          vec[idx] = 0;
          emptyCount++;
        } else {
          maxTile = Math.max(maxTile, v);
          vec[idx] = Math.log2(v + 1) / 11;
        }
      }
    }

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = this.grid[r][c];
        if (v === 0) continue;
        if (c < 3 && this.grid[r][c + 1] === v) adjacentPairs++;
        if (r < 3 && this.grid[r + 1][c] === v) adjacentPairs++;
      }
    }

    vec[16] = this.score / 10000;
    vec[17] = maxTile / 2048;
    vec[18] = emptyCount / 16;
    vec[19] = adjacentPairs / 24;

    return vec;
  }

  getState() {
    return {
      grid: cloneGrid(this.grid),
      score: this.score,
      done: this.done,
    };
  }

  getScore() {
    return this.score;
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
