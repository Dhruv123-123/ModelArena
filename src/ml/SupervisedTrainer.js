import * as tf from '@tensorflow/tfjs';
import { buildModel } from './ModelBuilder.js';
import { boardToVector } from '../games/chess/chessBoardVector.js';
import chessPositions from '../utils/chessPositions.js';
import { ChessEngine } from '../games/chess/ChessEngine.js';

export class SupervisedTrainer {
  constructor(layers, hyperparams, callbacks) {
    this.layers = layers;
    this.hp = hyperparams;
    this.callbacks = callbacks;
    this.running = false;
    this.model = buildModel(layers, 'chess', 1, hyperparams.learningRate ?? 0.001);
  }

  async start() {
    this.running = true;
    const positions = chessPositions;
    const vectors = positions.map((p) =>
      Array.from(
        boardToVector(p.board, {
          turn: 'white',
          castlingRights: {
            whiteKing: true,
            whiteQueen: true,
            blackKing: true,
            blackQueen: true,
          },
        })
      )
    );
    const labels = positions.map((p) => [p.eval]);

    const splitIdx = Math.floor(vectors.length * 0.8);
    const xTrain = tf.tensor2d(vectors.slice(0, splitIdx));
    const yTrain = tf.tensor2d(labels.slice(0, splitIdx));
    const xVal = tf.tensor2d(vectors.slice(splitIdx));
    const yVal = tf.tensor2d(labels.slice(splitIdx));

    const epochs = this.hp.maxEpisodes ?? 50;

    await this.model.fit(xTrain, yTrain, {
      epochs,
      batchSize: this.hp.batchSize ?? 32,
      validationData: [xVal, yVal],
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          if (!this.running) return;
          this.callbacks.onEpoch?.({
            epoch,
            loss: logs.loss,
            valLoss: logs.val_loss ?? logs.valLoss,
          });

          if (epoch > 0 && epoch % 5 === 0) {
            const evalScore = this._runChessEval();
            this.callbacks.onChessEval?.({ epoch, evalScore });
          }
        },
      },
    });

    xTrain.dispose();
    yTrain.dispose();
    xVal.dispose();
    yVal.dispose();

    if (this.running) {
      this.callbacks.onEnd?.({ model: this.model });
    }
  }

  _runChessEval() {
    const engine = new ChessEngine();
    engine.reset();
    const evalFn = (eng) => {
      const vec = eng.getStateVector();
      const pred = tf.tidy(() => {
        const t = tf.tensor2d([Array.from(vec)], [1, vec.length]);
        const out = this.model.predict(t);
        return out.dataSync()[0];
      });
      return pred;
    };
    const legal = engine.getLegalMoves();
    if (legal.length === 0) return 0;
    engine.step(0, evalFn);
    return evalFn(engine);
  }

  stop() {
    this.running = false;
  }

  getModel() {
    return this.model;
  }

  dispose() {
    this.model?.dispose();
  }
}
