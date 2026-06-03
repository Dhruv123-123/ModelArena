import { useEffect, useRef } from 'react';

const PIPE_WIDTH = 52;
const BIRD_RADIUS = 12;
const GROUND_HEIGHT = 40;

export function FlappyRenderer({ gameState, width = 350, height = 500, qValues: _qValues }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

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

    const { birdY, birdVel, pipes, score, width: w, height: h } = gameState;
    const gameW = w ?? width;
    const gameH = h ?? height;
    const birdX = 80;

    const grad = ctx.createLinearGradient(0, 0, 0, gameH);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.6, '#1e3a5f');
    grad.addColorStop(1, '#0c1929');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, gameW, gameH);

    ctx.fillStyle = '#1a1a26';
    ctx.fillRect(0, gameH - GROUND_HEIGHT, gameW, GROUND_HEIGHT);
    ctx.fillStyle = '#2a2a38';
    for (let i = 0; i < gameW; i += 24) {
      ctx.fillRect(i, gameH - GROUND_HEIGHT, 12, 4);
    }

    for (const pipe of pipes) {
      const topH = pipe.topHeight;
      const gapBottom = topH + 140;

      ctx.fillStyle = '#166534';
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topH);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(pipe.x - 4, topH - 24, PIPE_WIDTH + 8, 24);

      ctx.fillStyle = '#166534';
      ctx.fillRect(pipe.x, gapBottom, PIPE_WIDTH, gameH - gapBottom);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(pipe.x - 4, gapBottom, PIPE_WIDTH + 8, 24);
    }

    const angle = Math.min(Math.max(birdVel * 0.08, -0.5), 0.8);
    ctx.save();
    ctx.translate(birdX, birdY);
    ctx.rotate(angle);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a26';
    ctx.beginPath();
    ctx.arc(6, -3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(BIRD_RADIUS, 0);
    ctx.lineTo(BIRD_RADIUS + 8, 3);
    ctx.lineTo(BIRD_RADIUS, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    if (particlesRef.current.length > 0) {
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) return false;
        ctx.globalAlpha = p.life / 30;
        ctx.fillStyle = '#aaffdc';
        ctx.fillRect(p.x, p.y, 4, 4);
        return true;
      });
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#e8e8f0';
    ctx.font = '700 28px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(score), gameW / 2, 48);
    ctx.textAlign = 'left';
  }, [gameState, width, height]);

  useEffect(() => {
    if (!gameState?.pipes) return;
    const birdX = 80;
    for (const pipe of gameState.pipes) {
      if (pipe.passed && pipe.x + PIPE_WIDTH < birdX + 5 && pipe.x + PIPE_WIDTH > birdX - 10) {
        for (let i = 0; i < 8; i++) {
          particlesRef.current.push({
            x: birdX,
            y: gameState.birdY,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
          });
        }
      }
    }
  }, [gameState?.score, gameState?.birdY, gameState?.pipes]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border border-border"
      style={{ width, height }}
      aria-label="Flappy Bird game"
    />
  );
}
