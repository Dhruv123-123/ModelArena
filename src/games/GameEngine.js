export default class GameEngine {
  constructor(config) {
    this.config = config
    this.score = 0
    this.done = false
    this.steps = 0
  }
  reset() { throw new Error('reset() must be implemented') }
  step(action) { throw new Error('step() must be implemented') }
  getState() { throw new Error('getState() must be implemented') }
  getStateVector() { throw new Error('getStateVector() must be implemented') }
  getScore() { return this.score }
  isDone() { return this.done }
  getSteps() { return this.steps }
  getActionSpace() { return this.config.outputSize }
}
