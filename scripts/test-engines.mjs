import { SnakeEngine } from '../src/games/snake/SnakeEngine.js';
import { FlappyEngine } from '../src/games/flappy/FlappyEngine.js';
import { CartPoleEngine } from '../src/games/cartpole/CartPoleEngine.js';
import { TwentyFortyEightEngine } from '../src/games/twentyfortyeight/TwentyFortyEightEngine.js';
import { ChessEngine } from '../src/games/chess/ChessEngine.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const tests = [
  {
    name: 'snake',
    engine: new SnakeEngine(),
    inputSize: 20,
    actionSpace: 4,
  },
  {
    name: 'flappy',
    engine: new FlappyEngine(),
    inputSize: 6,
    actionSpace: 2,
  },
  {
    name: 'cartpole',
    engine: new CartPoleEngine(),
    inputSize: 4,
    actionSpace: 2,
  },
  {
    name: 'twentyfortyeight',
    engine: new TwentyFortyEightEngine(),
    inputSize: 20,
    actionSpace: 4,
  },
  {
    name: 'chess',
    engine: new ChessEngine(),
    inputSize: 780,
    actionSpace: 1,
    extra: (e) => {
      const legal = e.getLegalMoves();
      assert(legal.length === 20, `chess legal moves expected 20, got ${legal.length}`);
    },
  },
];

let passed = 0;
for (const t of tests) {
  const state = t.engine.reset();
  assert(
    state.length === t.inputSize,
    `${t.name} reset vector length ${state.length} !== ${t.inputSize}`
  );
  assert(
    t.engine.getActionSpace() === t.actionSpace,
    `${t.name} action space`
  );

  const result = t.engine.step(0);
  assert(result.state != null, `${t.name} step missing state`);
  assert(result.state.length === t.inputSize, `${t.name} step state length`);
  assert(typeof result.reward === 'number', `${t.name} reward type`);
  assert(typeof result.done === 'boolean', `${t.name} done type`);
  assert(typeof result.score === 'number', `${t.name} score type`);

  if (t.extra) t.extra(t.engine);
  console.log(`✓ ${t.name}`);
  passed++;
}

console.log(`\n${passed}/${tests.length} engines passed`);
