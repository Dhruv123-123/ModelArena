import { getGameById, useGameStore } from '../../stores/useGameStore';

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
  const activeGameId = useGameStore((s) => s.activeGameId);
  const view = useGameStore((s) => s.view);
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
      </div>
    </header>
  );
}
