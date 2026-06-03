import { DQNAgent } from './DQNAgent.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class TrainingLoop {
  constructor(engine, layers, gameId, outputSize, hyperparams, callbacks) {
    this.engine = engine;
    this.agent = new DQNAgent(layers, gameId, outputSize, hyperparams);
    this.hp = hyperparams;
    this.callbacks = callbacks;
    this.running = false;
    this.paused = false;
  }

  async start() {
    this.running = true;
    const maxEpisodes = this.hp.maxEpisodes ?? 1000;
    const maxStepsPerEpisode = this.hp.maxStepsPerEpisode ?? 500;

    for (let ep = 0; ep < maxEpisodes && this.running; ep++) {
      let state = this.engine.reset();
      let episodeReward = 0;

      for (let step = 0; step < maxStepsPerEpisode; step++) {
        while (this.paused && this.running) {
          await sleep(100);
        }
        if (!this.running) break;

        const action = this.agent.selectAction(state);
        const result = this.engine.step(action);
        const nextState = result.state;
        this.agent.storeExperience(
          state,
          action,
          result.reward,
          nextState,
          result.done
        );
        const loss = await this.agent.train();
        episodeReward += result.reward;

        this.callbacks.onStep?.({
          step,
          episode: ep,
          loss,
          epsilon: this.agent.epsilon,
          score: result.score,
        });

        if (step % 4 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }

        state = nextState;
        if (result.done) break;
      }

      this.callbacks.onEpisodeEnd?.({
        episode: ep,
        reward: episodeReward,
        score: this.engine.getScore(),
      });
    }

    this.callbacks.onTrainingEnd?.({ agent: this.agent });
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  stop() {
    this.running = false;
    this.paused = false;
  }

  dispose() {
    this.agent?.dispose();
  }
}
