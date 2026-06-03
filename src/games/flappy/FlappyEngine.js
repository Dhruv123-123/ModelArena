import { GameEngine } from '../GameEngine.js';
import {
  WIDTH,
  HEIGHT,
  GRAVITY,
  FLAP_FORCE,
  PIPE_SPEED,
  PIPE_SPAWN_INTERVAL,
  PIPE_GAP,
  BIRD_X,
  ACTION_SPACE,
} from './flappyConfig.js';

const PIPE_WIDTH = 52;
const BIRD_RADIUS = 12;

export class FlappyEngine extends GameEngine {
  constructor() {
    super();
    this.birdY = HEIGHT / 2;
    this.birdVel = 0;
    this.pipes = [];
    this.frame = 0;
    this.score = 0;
    this.done = false;
    this.steps = 0;
  }

  reset() {
    this.birdY = HEIGHT / 2;
    this.birdVel = 0;
    this.pipes = [];
    this.frame = 0;
    this.score = 0;
    this.done = false;
    this.steps = 0;
    return this.getStateVector();
  }

  spawnPipe() {
    const minTop = 80;
    const maxTop = HEIGHT - PIPE_GAP - 80;
    const topHeight = minTop + Math.random() * (maxTop - minTop);
    this.pipes.push({
      x: WIDTH,
      topHeight,
      passed: false,
    });
  }

  checkCollision() {
    if (this.birdY - BIRD_RADIUS <= 0) return true;
    if (this.birdY + BIRD_RADIUS >= HEIGHT - 40) return true;

    for (const pipe of this.pipes) {
      const inPipeX =
        BIRD_X + BIRD_RADIUS > pipe.x &&
        BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH;
      if (!inPipeX) continue;
      if (this.birdY - BIRD_RADIUS < pipe.topHeight) return true;
      if (this.birdY + BIRD_RADIUS > pipe.topHeight + PIPE_GAP) return true;
    }
    return false;
  }

  getNearestPipes() {
    const unpassed = this.pipes
      .filter((p) => !p.passed || p.x + PIPE_WIDTH >= BIRD_X - 20)
      .sort((a, b) => a.x - b.x);
    const nearest = unpassed.find((p) => p.x + PIPE_WIDTH >= BIRD_X - 30) ?? unpassed[0];
    const next = unpassed.find((p) => p !== nearest && p.x > (nearest?.x ?? -1));
    return { nearest, next };
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

    let reward = 0.01;

    if (action === 1) {
      this.birdVel = FLAP_FORCE;
    }

    this.birdVel += GRAVITY;
    this.birdY += this.birdVel;

    if (this.frame % PIPE_SPAWN_INTERVAL === 0) {
      this.spawnPipe();
    }

    for (const pipe of this.pipes) {
      pipe.x -= PIPE_SPEED;
    }
    this.pipes = this.pipes.filter((p) => p.x > -60);

    for (const pipe of this.pipes) {
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        this.score++;
        reward += 1;
      }
    }

    if (this.checkCollision()) {
      this.done = true;
      reward = -1;
    }

    this.frame++;
    this.steps++;

    return {
      state: this.getStateVector(),
      reward,
      done: this.done,
      score: this.score,
    };
  }

  getStateVector() {
    const vec = new Float32Array(6);
    const { nearest, next } = this.getNearestPipes();

    vec[0] = this.birdY / HEIGHT;
    vec[1] = this.birdVel / 15;

    if (nearest) {
      vec[2] = nearest.x / WIDTH;
      vec[3] = (nearest.topHeight + PIPE_GAP) / HEIGHT;
    } else {
      vec[2] = 1;
      vec[3] = 0.5;
    }

    if (next) {
      vec[4] = next.x / WIDTH;
      vec[5] = (next.topHeight + PIPE_GAP) / HEIGHT;
    } else {
      vec[4] = 0.5;
      vec[5] = 0.5;
    }

    return vec;
  }

  getState() {
    return {
      birdY: this.birdY,
      birdVel: this.birdVel,
      pipes: this.pipes.map((p) => ({ ...p })),
      score: this.score,
      done: this.done,
      width: WIDTH,
      height: HEIGHT,
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
