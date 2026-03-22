import GameEngine from '../GameEngine.js'
import { CARTPOLE_CONFIG } from './cartpoleConfig.js'

export default class CartPoleEngine extends GameEngine {
  constructor() {
    super(CARTPOLE_CONFIG)
    this.reset()
  }

  reset() {
    this.x = (Math.random() - 0.5) * 0.1
    this.xDot = (Math.random() - 0.5) * 0.1
    this.theta = (Math.random() - 0.5) * 0.1
    this.thetaDot = (Math.random() - 0.5) * 0.1
    this.score = 0
    this.done = false
    this.steps = 0
    return this.getStateVector()
  }

  step(action) {
    if (this.done) return { state: this.getStateVector(), reward: 0, done: true, score: this.score }

    const { gravity, massCart, massPole, length, forceMag, tau, xThreshold, thetaThreshold } = CARTPOLE_CONFIG
    const totalMass = massCart + massPole
    const halfLength = length

    const force = action === 1 ? forceMag : -forceMag
    const cosTheta = Math.cos(this.theta)
    const sinTheta = Math.sin(this.theta)

    const temp = (force + massPole * halfLength * this.thetaDot * this.thetaDot * sinTheta) / totalMass
    const thetaAcc = (gravity * sinTheta - cosTheta * temp) /
      (halfLength * (4.0 / 3.0 - massPole * cosTheta * cosTheta / totalMass))
    const xAcc = temp - massPole * halfLength * thetaAcc * cosTheta / totalMass

    this.x += tau * this.xDot
    this.xDot += tau * xAcc
    this.theta += tau * this.thetaDot
    this.thetaDot += tau * thetaAcc

    this.steps++
    this.score++

    if (Math.abs(this.x) > xThreshold || Math.abs(this.theta) > thetaThreshold) {
      this.done = true
      return { state: this.getStateVector(), reward: 0, done: true, score: this.score }
    }

    return { state: this.getStateVector(), reward: 1, done: false, score: this.score }
  }

  getState() {
    return { x: this.x, xDot: this.xDot, theta: this.theta, thetaDot: this.thetaDot, score: this.score, done: this.done }
  }

  getStateVector() {
    return [
      this.x / CARTPOLE_CONFIG.xThreshold,
      this.xDot / 3,
      this.theta / CARTPOLE_CONFIG.thetaThreshold,
      this.thetaDot / 3,
    ]
  }

  clone() {
    const c = new CartPoleEngine()
    c.x = this.x; c.xDot = this.xDot; c.theta = this.theta; c.thetaDot = this.thetaDot
    c.score = this.score; c.done = this.done; c.steps = this.steps
    return c
  }
}
