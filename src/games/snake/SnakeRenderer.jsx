import { useEffect, useRef } from 'react';
import { CELL_SIZE, GRID_SIZE } from './snakeConfig.js';

const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const DIRECTION_ARROWS = [
  { dx: 0, dy: -1, label: '↑' },
  { dx: 0, dy: 1, label: '↓' },
  { dx: -1, dy: 0, label: '←' },
  { dx: 1, dy: 0, label: '→' },
];

export function SnakeRenderer({ gameState, width = CANVAS_SIZE, height = CANVAS_SIZE, qValues }) {
  const canvasRef = useRef(null);
  const deathFlashRef = useRef(null);
  const prevDoneRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const { snake, food, score, done, gridSize } = gameState;
    const gs = gridSize ?? GRID_SIZE;
    const cell = width / gs;

    if (done && !prevDoneRef.current) {
      deathFlashRef.current = Date.now();
    }
    prevDoneRef.current = done;

    const flashActive =
      deathFlashRef.current && Date.now() - deathFlashRef.current < 300;

    ctx.fillStyle = flashActive ? 'rgba(180,40,40,0.35)' : '#0b0b0e';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gs; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(width, i * cell);
      ctx.stroke();
    }

    if (food && food.x >= 0) {
      const fx = food.x * cell + cell / 2;
      const fy = food.y * cell + cell / 2;
      const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, cell * 0.45);
      grad.addColorStop(0, '#ff6b35');
      grad.addColorStop(1, '#c2410c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, cell * 0.38, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'rgba(255,107,53,0.6)';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    snake.forEach((seg, i) => {
      const x = seg.x * cell;
      const y = seg.y * cell;
      const pad = 2;
      const r = 4;
      ctx.fillStyle = i === 0 ? '#c8ffe8' : '#aaffdc';
      ctx.beginPath();
      ctx.roundRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2, r);
      ctx.fill();
    });

    if (qValues && qValues.length >= 4) {
      const head = snake[0];
      if (head) {
        const hx = head.x * cell + cell / 2;
        const hy = head.y * cell + cell / 2;
        const maxQ = Math.max(...qValues, 0.001);
        DIRECTION_ARROWS.forEach((dir, i) => {
          const q = qValues[i] ?? 0;
          const len = (q / maxQ) * cell * 0.8;
          const isMax = q === maxQ;
          ctx.strokeStyle = isMax ? '#aaffdc' : 'rgba(107,107,130,0.8)';
          ctx.lineWidth = isMax ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx + dir.dx * len, hy + dir.dy * len);
          ctx.stroke();
        });
      }
    }

    ctx.fillStyle = '#e8e8f0';
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillText(`Score: ${score}`, 10, 22);
  }, [gameState, width, height, qValues]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border border-border"
      style={{ width, height }}
      aria-label="Snake game board"
    />
  );
}
