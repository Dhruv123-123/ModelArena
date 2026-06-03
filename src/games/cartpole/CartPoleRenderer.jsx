import { useEffect, useRef } from 'react';
import { X_THRESHOLD, THETA_THRESHOLD } from './cartpoleConfig.js';

const TRACK_WIDTH = 400;
const TRACK_Y = 250;
const CART_W = 50;
const CART_H = 30;
const POLE_LEN = 80;
const SCALE = 80;

export function CartPoleRenderer({ gameState, width = 500, height = 300, qValues: _qValues }) {
  const canvasRef = useRef(null);

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

    const { x, theta, steps, done } = gameState;
    const centerX = width / 2;

    ctx.fillStyle = '#0b0b0e';
    ctx.fillRect(0, 0, width, height);

    const xLimitPx = X_THRESHOLD * SCALE;
    ctx.fillStyle = 'rgba(239,68,68,0.12)';
    ctx.fillRect(centerX - TRACK_WIDTH / 2, 0, xLimitPx + TRACK_WIDTH / 2 - (centerX - TRACK_WIDTH / 2), height);
    ctx.fillRect(centerX + TRACK_WIDTH / 2 - xLimitPx, 0, centerX + TRACK_WIDTH / 2, height);

    const thetaRatio = Math.min(Math.abs(theta) / THETA_THRESHOLD, 1);
    if (thetaRatio > 0.5) {
      ctx.fillStyle = `rgba(239,68,68,${0.05 + thetaRatio * 0.1})`;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.strokeStyle = '#2a2a38';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - TRACK_WIDTH / 2, TRACK_Y);
    ctx.lineTo(centerX + TRACK_WIDTH / 2, TRACK_Y);
    ctx.stroke();

    const cartX = centerX + x * SCALE - CART_W / 2;
    const cartY = TRACK_Y - CART_H;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(cartX, cartY, CART_W, CART_H);
    ctx.fillStyle = '#6e9bff';
    ctx.fillRect(cartX + 4, cartY + 4, CART_W - 8, 8);

    const pivotX = cartX + CART_W / 2;
    const pivotY = cartY;
    const poleAngle = theta - Math.PI / 2;

    const severity = Math.min(Math.abs(theta) / THETA_THRESHOLD, 1);
    const r = Math.floor(34 + severity * 200);
    const g = Math.floor(197 * (1 - severity) + 234 * severity * 0.3);
    const b = Math.floor(94 * (1 - severity) + 68 * severity);

    ctx.strokeStyle = `rgb(${r},${g},${b})`;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(
      pivotX + Math.cos(poleAngle) * POLE_LEN,
      pivotY + Math.sin(poleAngle) * POLE_LEN
    );
    ctx.stroke();

    ctx.fillStyle = '#e8e8f0';
    ctx.font = '700 14px "JetBrains Mono", monospace';
    ctx.fillText(`Steps: ${steps}`, 12, 24);
    if (done) {
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Fallen', 12, 44);
    }
  }, [gameState, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl border border-border"
      style={{ width, height }}
      aria-label="CartPole simulation"
    />
  );
}
