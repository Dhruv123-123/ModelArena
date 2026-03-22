import GameEngine from '../GameEngine.js'
import { FLAPPY_CONFIG } from './flappyConfig.js'

export default class FlappyEngine extends GameEngine {
  constructor() {
    super(FLAPPY_CONFIG)
    this.reset()
  }

  reset() {
    this.bird = { x: 60, y: FLAPPY_CONFIG.height / 2, velocity: 0 }
    this.pipes = []
    this.score = 0
    this.done = false
    this.steps = 0
    this.framesSinceLastPipe = FLAPPY_CONFIG.pipeSpawnInterval
    return this.getStateVector()
  }

  _spawnPipe() {
    const minTop = 60
    const maxTop = FLAPPY_CONFIG.height - FLAPPY_CONFIG.pipeGap - 60
    const topHeight = minTop + Math.random() * (maxTop - minTop)
    this.pipes.push({
      x: FLAPPY_CONFIG.width,
      topHeight,
      bottomY: topHeight + FLAPPY_CONFIG.pipeGap,
      passed: false,
    })
  }

  step(action) {
    if (this.done) return { state: this.getStateVector(), reward: 0, done: true, score: this.score }

    // Flap
    if (action === 1) this.bird.velocity = FLAPPY_CONFIG.flapForce

    // Physics
    this.bird.velocity += FLAPPY_CONFIG.gravity
    this.bird.y += this.bird.velocity
    this.steps++

    // Spawn pipes
    this.framesSinceLastPipe++
    if (this.framesSinceLastPipe >= FLAPPY_CONFIG.pipeSpawnInterval) {
      this._spawnPipe()
      this.framesSinceLastPipe = 0
    }

    // Move pipes
    let reward = 0.01 // survival reward
    this.pipes.forEach(pipe => {
      pipe.x -= FLAPPY_CONFIG.pipeSpeed
      if (!pipe.passed && pipe.x + FLAPPY_CONFIG.pipeWidth < this.bird.x) {
        pipe.passed = true
        this.score++
        reward = 1
      }
    })

    // Remove off-screen pipes
    this.pipes = this.pipes.filter(p => p.x + FLAPPY_CONFIG.pipeWidth > -10)

    // Collision detection
    if (this.bird.y < 0 || this.bird.y + FLAPPY_CONFIG.birdSize > FLAPPY_CONFIG.height) {
      this.done = true
      return { state: this.getStateVector(), reward: -1, done: true, score: this.score }
    }

    for (const pipe of this.pipes) {
      if (this.bird.x + FLAPPY_CONFIG.birdSize > pipe.x && this.bird.x < pipe.x + FLAPPY_CONFIG.pipeWidth) {
        if (this.bird.y < pipe.topHeight || this.bird.y + FLAPPY_CONFIG.birdSize > pipe.bottomY) {
          this.done = true
          return { state: this.getStateVector(), reward: -1, done: true, score: this.score }
        }
      }
    }

    return { state: this.getStateVector(), reward, done: false, score: this.score }
  }

  getState() {
    return {
      bird: { ...this.bird },
      pipes: this.pipes.map(p => ({ ...p })),
      score: this.score,
      done: this.done,
    }
  }

  getStateVector() {
    const h = FLAPPY_CONFIG.height
    const w = FLAPPY_CONFIG.width
    const nextPipes = this.pipes.filter(p => p.x + FLAPPY_CONFIG.pipeWidth > this.bird.x).slice(0, 2)
    const p1 = nextPipes[0] || { x: w, topHeight: h / 2, bottomY: h / 2 + FLAPPY_CONFIG.pipeGap }
    const p2 = nextPipes[1] || { x: w * 1.5, topHeight: h / 2, bottomY: h / 2 + FLAPPY_CONFIG.pipeGap }

    return [
      this.bird.y / h,
      this.bird.velocity / 15,
      (p1.x - this.bird.x) / w,
      p1.topHeight / h,
      p1.bottomY / h,
      (p2.x - this.bird.x) / w,
    ]
  }

  clone() {
    const c = new FlappyEngine()
    c.bird = { ...this.bird }
    c.pipes = this.pipes.map(p => ({ ...p }))
    c.score = this.score
    c.done = this.done
    c.steps = this.steps
    c.framesSinceLastPipe = this.framesSinceLastPipe
    return c
  }
}
