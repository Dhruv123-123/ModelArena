import GameEngine from '../GameEngine.js'
import { TWENTY48_CONFIG } from './twentyfortyeightConfig.js'

export default class TwentyFortyEightEngine extends GameEngine {
  constructor() {
    super(TWENTY48_CONFIG)
    this.size = 4
    this.reset()
  }

  reset() {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0))
    this.score = 0
    this.done = false
    this.steps = 0
    this._addRandomTile()
    this._addRandomTile()
    return this.getStateVector()
  }

  _addRandomTile() {
    const empty = []
    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++)
        if (this.grid[r][c] === 0) empty.push({ r, c })
    if (empty.length === 0) return
    const { r, c } = empty[Math.floor(Math.random() * empty.length)]
    this.grid[r][c] = Math.random() < 0.9 ? 2 : 4
  }

  _compress(row) {
    const filtered = row.filter(v => v !== 0)
    const result = []
    let mergeScore = 0
    let i = 0
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        result.push(filtered[i] * 2)
        mergeScore += filtered[i] * 2
        i += 2
      } else {
        result.push(filtered[i])
        i++
      }
    }
    while (result.length < this.size) result.push(0)
    return { row: result, score: mergeScore }
  }

  _rotateGrid(grid, times) {
    let g = grid.map(r => [...r])
    for (let t = 0; t < times; t++) {
      const newG = Array(this.size).fill(null).map(() => Array(this.size).fill(0))
      for (let r = 0; r < this.size; r++)
        for (let c = 0; c < this.size; c++)
          newG[c][this.size - 1 - r] = g[r][c]
      g = newG
    }
    return g
  }

  step(action) {
    if (this.done) return { state: this.getStateVector(), reward: 0, done: true, score: this.score }

    // Rotate so we always compress left
    const rotations = [0, 2, 3, 1] // Up, Down, Left, Right
    let g = this._rotateGrid(this.grid, rotations[action])
    let moveScore = 0
    let moved = false

    const newG = []
    for (let r = 0; r < this.size; r++) {
      const { row, score } = this._compress(g[r])
      if (row.some((v, i) => v !== g[r][i])) moved = true
      newG.push(row)
      moveScore += score
    }

    if (!moved) {
      // Invalid move
      if (this._hasValidMoves()) {
        return { state: this.getStateVector(), reward: -0.1, done: false, score: this.score }
      } else {
        this.done = true
        return { state: this.getStateVector(), reward: 0, done: true, score: this.score }
      }
    }

    // Rotate back
    this.grid = this._rotateGrid(newG, (4 - rotations[action]) % 4)
    this.score += moveScore
    this.steps++
    this._addRandomTile()

    if (!this._hasValidMoves()) this.done = true

    return { state: this.getStateVector(), reward: moveScore, done: this.done, score: this.score }
  }

  _hasValidMoves() {
    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return true
        if (c + 1 < this.size && this.grid[r][c] === this.grid[r][c + 1]) return true
        if (r + 1 < this.size && this.grid[r][c] === this.grid[r + 1][c]) return true
      }
    return false
  }

  getState() {
    return {
      grid: this.grid.map(r => [...r]),
      score: this.score,
      done: this.done,
      maxTile: Math.max(...this.grid.flat()),
    }
  }

  getStateVector() {
    const flat = this.grid.flat()
    const logGrid = flat.map(v => v === 0 ? 0 : Math.log2(v) / 11)

    // Features: monotonicity, smoothness, empty count, max tile
    let emptyCount = flat.filter(v => v === 0).length / 16
    let maxTile = Math.max(...flat) / 2048
    let smoothness = 0
    let monotonicity = 0

    for (let r = 0; r < this.size; r++)
      for (let c = 0; c < this.size; c++) {
        if (c + 1 < this.size) smoothness -= Math.abs(logGrid[r * 4 + c] - logGrid[r * 4 + c + 1])
        if (r + 1 < this.size) smoothness -= Math.abs(logGrid[r * 4 + c] - logGrid[(r + 1) * 4 + c])
        if (c + 1 < this.size) monotonicity += logGrid[r * 4 + c] >= logGrid[r * 4 + c + 1] ? 0.01 : -0.01
      }

    return [...logGrid, emptyCount, maxTile, smoothness / 10 + 0.5, monotonicity + 0.5]
  }

  clone() {
    const c = new TwentyFortyEightEngine()
    c.grid = this.grid.map(r => [...r])
    c.score = this.score; c.done = this.done; c.steps = this.steps
    return c
  }
}
