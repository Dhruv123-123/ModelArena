import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TILE_COLORS = {
  0: { bg: '#13131a', text: 'transparent' },
  2: { bg: '#1a2a1a', text: '#aaffdc' },
  4: { bg: '#1a2620', text: '#aaffdc' },
  8: { bg: '#3b2060', text: '#e8e8f0' },
  16: { bg: '#4c2880', text: '#e8e8f0' },
  32: { bg: '#5c30a0', text: '#e8e8f0' },
  64: { bg: '#6d38c0', text: '#fff' },
  128: { bg: '#7e40e0', text: '#fff' },
  256: { bg: '#8f48f0', text: '#fff' },
  512: { bg: '#a050ff', text: '#fff' },
  1024: { bg: '#b858ff', text: '#fff' },
  2048: { bg: '#c960ff', text: '#fff' },
};

function getTileStyle(value) {
  if (TILE_COLORS[value]) return TILE_COLORS[value];
  return { bg: '#d070ff', text: '#fff' };
}

function fontSize(value) {
  if (value < 100) return '1.75rem';
  if (value < 1000) return '1.35rem';
  return '1rem';
}

export function TwentyFortyEightRenderer({
  gameState,
  width: _width,
  height: _height,
  qValues: _qValues,
  mergedCells = [],
}) {
  const { grid, score, done } = gameState ?? { grid: [], score: 0, done: false };
  const bestScore = useMemo(() => {
    try {
      const raw = localStorage.getItem('modelarena-2048-best');
      return raw ? Number(raw) : score;
    } catch {
      return score;
    }
  }, [score]);

  const mergedSet = useMemo(
    () => new Set(mergedCells.map(([r, c]) => `${r},${c}`)),
    [mergedCells]
  );

  if (!grid?.length) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="glass-panel px-4 py-2">
          <span className="text-xs text-text-muted">Score</span>
          <p className="font-mono-nums text-xl font-bold text-text-base">{score}</p>
        </div>
        <div className="glass-panel px-4 py-2">
          <span className="text-xs text-text-muted">Best</span>
          <p className="font-mono-nums text-xl font-bold text-primary">
            {Math.max(bestScore, score)}
          </p>
        </div>
        {done && (
          <span className="text-sm font-medium text-accent-2048">Game Over</span>
        )}
      </div>

      <div
        className="grid gap-2 rounded-xl bg-bg-panel p-3"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        <AnimatePresence mode="popLayout">
          {grid.map((row, r) =>
            row.map((value, c) => {
              const style = getTileStyle(value);
              const isMerged = mergedSet.has(`${r},${c}`);
              return (
                <motion.div
                  key={`${r}-${c}-${value}`}
                  layout
                  initial={isMerged ? { scale: 0.85 } : false}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  className="flex aspect-square items-center justify-center rounded-lg font-bold"
                  style={{
                    backgroundColor: style.bg,
                    color: style.text,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: value ? fontSize(value) : undefined,
                    boxShadow: isMerged ? '0 0 16px rgba(168,85,247,0.4)' : undefined,
                  }}
                >
                  {value > 0 ? value : ''}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
