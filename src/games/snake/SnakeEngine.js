import { GameEngine } from '../GameEngine.js';
import {
  GRID_SIZE,
  INITIAL_LENGTH,
  MAX_STEPS_WITHOUT_FOOD,
  REWARDS,
  ACTION_SPACE,
} from './snakeConfig.js';

const DIRECTION_VECTORS = [
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
];

const OPPOSITE = [1, 0, 3, 2];

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function relativeDirs(direction) {
  const straight = DIRECTION_VECTORS[direction];
  const rightIdx = direction === 0 ? 3 : direction === 3 ? 1 : direction === 1 ? 2 : 0;
  const leftIdx = direction === 0 ? 2 : direction === 3 ? 0 : direction === 1 ? 3 : 1;
  return {
    straight,
    right: DIRECTION_VECTORS[rightIdx],
    left: DIRECTION_VECTORS[leftIdx],
  };
}

export class SnakeEngine extends GameEngine {
  constructor() {
    super();
    this.snake = [];
    this.food = { x: 0, y: 0 };
    this.direction = 3;
    this.score = 0;
    this.steps = 0;
    this.stepsWithoutFood = 0;
    this.done = false;
  }

  reset() {
    const center = Math.floor(GRID_SIZE / 2);
    this.snake = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      this.snake.push({ x: center - i, y: center });
    }
    this.direction = 3;
    this.score = 0;
    this.steps = 0;
    this.stepsWithoutFood = 0;
    this.done = false;
    this.spawnFood();
    return this.getStateVector();
  }

  spawnFood() {
    const occupied = new Set(this.snake.map((s) => `${s.x},${s.y}`));
    const empty = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
      }
    }
    if (empty.length === 0) {
      this.food = { x: -1, y: -1 };
      return;
    }
    this.food = empty[Math.floor(Math.random() * empty.length)];
  }

  isOccupied(x, y, includeTail = true) {
    const limit = includeTail ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < limit; i++) {
      if (this.snake[i].x === x && this.snake[i].y === y) return true;
    }
    return false;
  }

  isDanger(dx, dy) {
    const head = this.snake[0];
    const nx = head.x + dx;
    const ny = head.y + dy;
    if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) return true;
    return this.isOccupied(nx, ny, false);
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

    let newDirection = this.direction;
    const validAction =
      action >= 0 && action < 4 && action !== OPPOSITE[this.direction];
    if (validAction) {
      newDirection = action;
    }
    this.direction = newDirection;

    const head = this.snake[0];
    const vec = DIRECTION_VECTORS[newDirection];
    const newHead = { x: head.x + vec.dx, y: head.y + vec.dy };
    const distBefore = manhattan(head, this.food);

    let reward = REWARDS.step;

    if (
      newHead.x < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y < 0 ||
      newHead.y >= GRID_SIZE
    ) {
      this.done = true;
      reward = REWARDS.death;
      this.steps++;
      return {
        state: this.getStateVector(),
        reward,
        done: true,
        score: this.score,
      };
    }

    if (this.isOccupied(newHead.x, newHead.y, false)) {
      this.done = true;
      reward = REWARDS.death;
      this.steps++;
      return {
        state: this.getStateVector(),
        reward,
        done: true,
        score: this.score,
      };
    }

    this.snake.unshift(newHead);

    if (newHead.x === this.food.x && newHead.y === this.food.y) {
      reward = REWARDS.food;
      this.score += 1;
      this.stepsWithoutFood = 0;
      this.spawnFood();
    } else {
      this.snake.pop();
      this.stepsWithoutFood++;
      const distAfter = manhattan(newHead, this.food);
      if (distAfter < distBefore) reward += REWARDS.distImprove;
      else if (distAfter > distBefore) reward += REWARDS.distWorsen;
    }

    if (this.stepsWithoutFood >= MAX_STEPS_WITHOUT_FOOD) {
      this.done = true;
      reward = REWARDS.death;
    }

    this.steps++;

    return {
      state: this.getStateVector(),
      reward,
      done: this.done,
      score: this.score,
    };
  }

  getStateVector() {
    const head = this.snake[0] ?? { x: 0, y: 0 };
    const { straight, right, left } = relativeDirs(this.direction);
    const vec = new Float32Array(20);

    vec[0] = this.isDanger(straight.dx, straight.dy) ? 1 : 0;
    vec[1] = this.isDanger(right.dx, right.dy) ? 1 : 0;
    vec[2] = this.isDanger(left.dx, left.dy) ? 1 : 0;

    vec[3] = this.direction === 0 ? 1 : 0;
    vec[4] = this.direction === 1 ? 1 : 0;
    vec[5] = this.direction === 2 ? 1 : 0;
    vec[6] = this.direction === 3 ? 1 : 0;

    vec[7] = this.food.y < head.y ? 1 : 0;
    vec[8] = this.food.y > head.y ? 1 : 0;
    vec[9] = this.food.x < head.x ? 1 : 0;
    vec[10] = this.food.x > head.x ? 1 : 0;

    vec[11] = head.y / GRID_SIZE;
    vec[12] = head.x / GRID_SIZE;
    vec[13] = (GRID_SIZE - head.x) / GRID_SIZE;
    vec[14] = (GRID_SIZE - head.y) / GRID_SIZE;
    vec[15] = (this.food.x - head.x) / GRID_SIZE;
    vec[16] = (this.food.y - head.y) / GRID_SIZE;
    vec[17] = this.snake.length / (GRID_SIZE * GRID_SIZE);
    vec[18] = this.stepsWithoutFood / MAX_STEPS_WITHOUT_FOOD;
    vec[19] = this.score / 50;

    return vec;
  }

  getState() {
    return {
      snake: this.snake.map((s) => ({ ...s })),
      food: { ...this.food },
      direction: this.direction,
      score: this.score,
      done: this.done,
      gridSize: GRID_SIZE,
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
