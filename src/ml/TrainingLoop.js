import DQNAgent from './DQNAgent.js'

export default class TrainingLoop {
  constructor(engine, layers, gameId, outputSize, hyperparams, callbacks = {}) {
    this.engine = engine
    this.agent = new DQNAgent(layers, gameId, outputSize, hyperparams)
    this.hp = { maxEpisodes: 1000, maxStepsPerEpisode: 500, ...hyperparams }
    this.callbacks = callbacks
    this.running = false
    this.paused = false
  }

  async start() {
    this.running = true
    this.paused = false

    for (let ep = 0; ep < this.hp.maxEpisodes && this.running; ep++) {
      let state = this.engine.reset()
      let totalReward = 0, steps = 0

      for (let step = 0; step < this.hp.maxStepsPerEpisode; step++) {
        while (this.paused && this.running) await new Promise(r => setTimeout(r, 100))
        if (!this.running) break

        const action = this.agent.selectAction(state)
        const { state: nextState, reward, done, score } = this.engine.step(action)
        this.agent.storeExperience(state, action, reward, nextState, done)
        const loss = await this.agent.train()

        totalReward += reward
        steps++
        state = nextState

        this.callbacks.onStep?.({
          episode: ep, step: steps, action, reward, totalReward, score,
          epsilon: this.agent.epsilon, loss,
          gameState: this.engine.getState(),
          qValues: this.agent.getQValues(state),
        })

        if (done) break
        if (steps % 4 === 0) await new Promise(r => setTimeout(r, 0))
      }

      this.callbacks.onEpisodeEnd?.({
        episode: ep, totalReward, score: this.engine.getScore(), steps, epsilon: this.agent.epsilon,
      })
    }

    this.running = false
    this.callbacks.onTrainingEnd?.()
  }

  pause() { this.paused = true }
  resume() { this.paused = false }
  stop() { this.running = false; this.paused = false }
  getAgent() { return this.agent }
  dispose() { this.stop(); this.agent?.dispose() }
}
