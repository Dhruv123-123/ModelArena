import { useEffect, useState } from 'react';

const COLORS = ['#aaffdc', '#6e9bff', '#e966ff', '#22c55e', '#f97316', '#eab308'];

export function Confetti({ active, onDone }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) return;
    setPieces(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: COLORS[i % COLORS.length],
        rotation: Math.random() * 360,
      }))
    );
    const t = setTimeout(() => {
      setPieces([]);
      onDone?.();
    }, 2500);
    return () => clearTimeout(t);
  }, [active, onDone]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute top-0 size-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
