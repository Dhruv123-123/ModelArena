import { CELL_SIZE, GRID_SIZE } from '../../games/snake/snakeConfig.js';

const DIRS = [
  { label: '↑', dx: 0, dy: -1, idx: 0 },
  { label: '↓', dx: 0, dy: 1, idx: 1 },
  { label: '←', dx: -1, dy: 0, idx: 2 },
  { label: '→', dx: 1, dy: 0, idx: 3 },
];

export function DecisionOverlay({ qValues, gameState, canvasSize = GRID_SIZE * CELL_SIZE }) {
  if (!qValues?.length || !gameState?.snake?.[0]) return null;

  const head = gameState.snake[0];
  const cell = canvasSize / (gameState.gridSize ?? GRID_SIZE);
  const hx = head.x * cell + cell / 2;
  const hy = head.y * cell + cell / 2;
  const maxQ = Math.max(...qValues, 0.001);
  const bestIdx = qValues.indexOf(maxQ);

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ width: canvasSize, height: canvasSize }}
    >
      {DIRS.map((dir) => {
        const q = qValues[dir.idx] ?? 0;
        const len = (q / maxQ) * cell * 0.7;
        const isBest = dir.idx === bestIdx;
        return (
          <div
            key={dir.idx}
            className="absolute flex flex-col items-center"
            style={{
              left: hx + dir.dx * (cell * 0.6) - 12,
              top: hy + dir.dy * (cell * 0.6) - 20,
            }}
          >
            <span
              className="text-lg font-bold"
              style={{
                color: isBest ? '#aaffdc' : 'rgba(107,107,130,0.9)',
                opacity: 0.4 + (q / maxQ) * 0.6,
                transform: `scale(${0.8 + (len / cell) * 0.4})`,
              }}
            >
              {dir.label}
            </span>
            <span
              className="font-mono-nums text-[10px]"
              style={{ color: isBest ? '#aaffdc' : '#6b6b82' }}
            >
              {q.toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
