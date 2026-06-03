import { GameEngine } from '../GameEngine.js';
import {
  GRAVITY,
  CART_MASS,
  POLE_MASS,
  POLE_HALF_LENGTH,
  FORCE_MAG,
  TAU,
  X_THRESHOLD,
  THETA_THRESHOLD,
  ACTION_SPACE,
} from './cartpoleConfig.js';

export class CartPoleEngine extends GameEngine {
  constructor() {
    super();
    this.x = 0;
    this.xDot = 0;
    this.theta = 0;
    this.thetaDot = 0;
    this.steps = 0;
    this.done = false;
    this.totalMass = CART_MASS + POLE_MASS;
    this.poleMassLength = POLE_MASS * POLE_HALF_LENGTH;
  }

  reset() {
    const rand = () => (Math.random() - 0.5) * 0.1;
    this.x = rand();
    this.xDot = rand();
    this.theta = rand();
    this.thetaDot = rand();
    this.steps = 0;
    this.done = false;
    return this.getStateVector();
  }

  step(action) {
    if (this.done) {
      return {
        state: this.getStateVector(),
        reward: 0,
        done: true,
        score: this.steps,
      };
    }

    const force = action === 1 ? FORCE_MAG : -FORCE_MAG;
    const cosTheta = Math.cos(this.theta);
    const sinTheta = Math.sin(this.theta);

    const temp =
      (force + this.poleMassLength * this.thetaDot ** 2 * sinTheta) /
      this.totalMass;

    const thetaAcc =
      (GRAVITY * sinTheta - cosTheta * temp) /
      (POLE_HALF_LENGTH *
        (4 / 3 -
          (POLE_MASS * cosTheta ** 2) / this.totalMass));

    const xAcc =
      temp - (this.poleMassLength * thetaAcc * cosTheta) / this.totalMass;

    this.x += TAU * this.xDot;
    this.xDot += TAU * xAcc;
    this.theta += TAU * this.thetaDot;
    this.thetaDot += TAU * thetaAcc;

    this.done =
      Math.abs(this.x) > X_THRESHOLD ||
      Math.abs(this.theta) > THETA_THRESHOLD;

    const reward = this.done ? 0 : 1;
    this.steps++;

    return {
      state: this.getStateVector(),
      reward,
      done: this.done,
      score: this.steps,
    };
  }

  getStateVector() {
    return new Float32Array([
      this.x / X_THRESHOLD,
      this.xDot / 3,
      this.theta / THETA_THRESHOLD,
      this.thetaDot / 3,
    ]);
  }

  getState() {
    return {
      x: this.x,
      xDot: this.xDot,
      theta: this.theta,
      thetaDot: this.thetaDot,
      steps: this.steps,
      done: this.done,
    };
  }

  getScore() {
    return this.steps;
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
