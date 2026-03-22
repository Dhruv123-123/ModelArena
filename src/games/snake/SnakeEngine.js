import GameEngine from '../GameEngine.js'
import { SNAKE_CONFIG, ACTION_TO_DIRECTION, DIRECTIONS } from './snakeConfig.js'

export default class SnakeEngine extends GameEngine {
  constructor() {
    super(SNAKE_CONFIG)
    this.gridSize = SNAKE_CONFIG.gridSize
    this.reset()
  }

  reset() {
    const mid = Math.floor(this.gridSize / 2)
    this.snake = []
    for (let i = 0; i < SNAKE_CONFIG.initialLength; i++) {
      this.snake.push({ x: mid - i, y: mid })
    }
    this.direction = DIRECTIONS.RIGHT
    this.food = this._spawnFood()
    this.score = 0
    this.done = false
    this.steps = 0
    this.stepsWithoutFood = 0
    return this.getStateVector()
  }

  _spawnFood() {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`))
    let pos
    do {
      pos = { x: Math.floor(Math.random() * this.gridSize), y: Math.floor(Math.random() * this.gridSize) }
    } while (occupied.has(`${pos.x},${pos.y}`))
    return pos
  }

  step(action) {
    if (this.done) return { state: this.getStateVector(), reward: 0, done: true, score: this.score }

    const newDir = ACTION_TO_DIRECTION[action]
    if (newDir && !(newDir.x === -this.direction.x && newDir.y === -this.direction.y)) {
      this.direction = newDir
    }

    const head = this.snake[0]
    const newHead = { x: head.x + this.direction.x, y: head.y + this.direction.y }

    if (newHead.x < 0 || newHead.x >= this.gridSize || newHead.y < 0 || newHead.y >= this.gridSize) {
      this.done = true
      return { state: this.getStateVector(), reward: SNAKE_CONFIG.rewards.death, done: true, score: this.score }
    }

    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.done = true
      return { state: this.getStateVector(), reward: SNAKE_CONFIG.rewards.death, done: true, score: this.score }
    }

    this.snake.unshift(newHead)
    let reward = SNAKE_CONFIG.rewards.step
    this.steps++
    this.stepsWithoutFood++

    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      this.score += 1
      reward = SNAKE_CONFIG.rewards.food
      this.food = this._spawnFood()
      this.stepsWithoutFood = 0
    } else {
      this.snake.pop()
      const oldDist = Math.abs(head.x - this.food.x) + Math.abs(head.y - this.food.y)
      const newDist = Math.abs(newHead.x - this.food.x) + Math.abs(newHead.y - this.food.y)
      reward += newDist < oldDist ? SNAKE_CONFIG.rewards.closerToFood : SNAKE_CONFIG.rewards.furtherFromFood
    }

    if (this.stepsWithoutFood >= SNAKE_CONFIG.maxStepsWithoutFood) {
      this.done = true
      return { state: this.getStateVector(), reward: SNAKE_CONFIG.rewards.death, done: true, score: this.score }
    }

    return { state: this.getStateVector(), reward, done: false, score: this.score }
  }

  getState() {
    return {
      snake: this.snake.map(s => ({ ...s })), food: { ...this.food },
      direction: { ...this.direction }, score: this.score, done: this.done, steps: this.steps,
    }
  }

  getStateVector() {
    const head = this.snake[0]
    const gs = this.gridSize
    const clockwise = [DIRECTIONS.UP, DIRECTIONS.RIGHT, DIRECTIONS.DOWN, DIRECTIONS.LEFT]
    const cwIdx = clockwise.findIndex(d => d.x === this.direction.x && d.y === this.direction.y)
    const straight = clockwise[cwIdx]
    const right = clockwise[(cwIdx + 1) % 4]
    const left = clockwise[(cwIdx + 3) % 4]

    const danger = (dx, dy) => {
      const x = head.x + dx, y = head.y + dy
      if (x < 0 || x >= gs || y < 0 || y >= gs) return 1
      return this.snake.some(s => s.x === x && s.y === y) ? 1 : 0
    }

    return [
      danger(straight.x, straight.y), danger(right.x, right.y), danger(left.x, left.y),
      this.direction.y === -1 ? 1 : 0, this.direction.y === 1 ? 1 : 0,
      this.direction.x === -1 ? 1 : 0, this.direction.x === 1 ? 1 : 0,
      this.food.y < head.y ? 1 : 0, this.food.y > head.y ? 1 : 0,
      this.food.x < head.x ? 1 : 0, this.food.x > head.x ? 1 : 0,
      head.y / gs, (gs - 1 - head.y) / gs, head.x / gs, (gs - 1 - head.x) / gs,
      (this.food.x - head.x) / gs, (this.food.y - head.y) / gs,
      this.snake.length / (gs * gs),
      this.stepsWithoutFood / SNAKE_CONFIG.maxStepsWithoutFood,
      this.score / 50,
    ]
  }

  clone() {
    const c = new SnakeEngine()
    c.snake = this.snake.map(s => ({ ...s }))
    c.food = { ...this.food }
    c.direction = { ...this.direction }
    c.score = this.score
    c.done = this.done
    c.steps = this.steps
    c.stepsWithoutFood = this.stepsWithoutFood
    return c
  }
}
