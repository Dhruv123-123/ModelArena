import { Link, useNavigate } from 'react-router-dom';
import { getGameById, useGameStore } from '../../stores/useGameStore';
import { useTrainingStore } from '../../stores/useTrainingStore';

const LIVE_URL = 'https://newarena.vercel.app';

const VIEW_LABELS = {
  builder: 'Model Builder',
  train: 'Training',
  play: 'Playback',
  leaderboard: 'Leaderboard',
};

function formatTierValue(value, gameId) {
  if (gameId === 'chess') return value.toFixed(1);
  return String(value);
}

export function TopBar() {
  const navigate = useNavigate();
  const activeGameId = useGameStore((s) => s.activeGameId);
  const view = useGameStore((s) => s.view);
  const isTraining = useTrainingStore((s) => s.isTraining);
  const currentEpisode = useTrainingStore((s) => s.currentEpisode);
  const bestScore = useTrainingStore((s) => s.bestScore);
  const game = getGameById(activeGameId);

  if (!game) return null;

  const { tiers } = game;

  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-border bg-bg-panel/80 px-4 backdrop-blur-sm md:pl-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="text-xl" aria-hidden>
          {game.emoji}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1
              className="truncate text-sm font-bold text-text-base"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {game.name}
            </h1>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: game.accentColor }}
              aria-hidden
            />
          </div>
          <p className="truncate text-xs text-text-muted">
            {VIEW_LABELS[view] ?? view}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isTraining && (
          <div className="hidden items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary md:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Ep {currentEpisode}
            <span className="text-text-muted">·</span>
            Best {Number.isFinite(bestScore) ? bestScore.toFixed(1) : '—'}
          </div>
        )}
        {(['bronze', 'silver', 'gold']).map((tier) => (
          <span
            key={tier}
            className="font-mono-nums hidden rounded-md border border-border bg-bg-elevated px-2 py-0.5 text-xs capitalize text-text-muted sm:inline"
            title={`${tier} threshold`}
          >
            <span className="text-text-base">{tier[0].toUpperCase()}</span>
            {' '}
            {formatTierValue(tiers[tier], game.id)}
          </span>
        ))}
        <button
          type="button"
          onClick={() => navigate('/demo')}
          className="hidden rounded-lg px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-primary sm:inline"
        >
          Demo
        </button>
        <a
          href={LIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-lg px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-primary sm:inline"
        >
          Live
        </a>
        <Link
          to="/"
          className="rounded-lg px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-base"
          title="Home"
        >
          Home
        </Link>
      </div>
    </header>
  );
}
