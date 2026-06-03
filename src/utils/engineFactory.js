import { SnakeEngine } from '../games/snake/SnakeEngine.js';
import { FlappyEngine } from '../games/flappy/FlappyEngine.js';
import { CartPoleEngine } from '../games/cartpole/CartPoleEngine.js';
import { TwentyFortyEightEngine } from '../games/twentyfortyeight/TwentyFortyEightEngine.js';
import { ChessEngine } from '../games/chess/ChessEngine.js';
import { SnakeRenderer } from '../games/snake/SnakeRenderer.jsx';
import { FlappyRenderer } from '../games/flappy/FlappyRenderer.jsx';
import { CartPoleRenderer } from '../games/cartpole/CartPoleRenderer.jsx';
import { TwentyFortyEightRenderer } from '../games/twentyfortyeight/TwentyFortyEightRenderer.jsx';
import { ChessRenderer } from '../games/chess/ChessRenderer.jsx';

const RENDERERS = {
  snake: SnakeRenderer,
  flappy: FlappyRenderer,
  cartpole: CartPoleRenderer,
  twentyfortyeight: TwentyFortyEightRenderer,
  chess: ChessRenderer,
};

export function createEngine(gameId) {
  switch (gameId) {
    case 'snake':
      return new SnakeEngine();
    case 'flappy':
      return new FlappyEngine();
    case 'cartpole':
      return new CartPoleEngine();
    case 'twentyfortyeight':
      return new TwentyFortyEightEngine();
    case 'chess':
      return new ChessEngine();
    default:
      throw new Error(`Unknown game: ${gameId}`);
  }
}

export function getRenderer(gameId) {
  const Renderer = RENDERERS[gameId];
  if (!Renderer) {
    throw new Error(`Unknown game renderer: ${gameId}`);
  }
  return Renderer;
}
