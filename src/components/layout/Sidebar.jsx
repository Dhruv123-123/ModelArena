import { Link } from 'react-router-dom';
import { GAMES, useGameStore } from '../../stores/useGameStore';

const VIEW_NAV = [
  {
    id: 'builder',
    label: 'Builder',
    short: 'Build',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: 'train',
    label: 'Training',
    short: 'Train',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    id: 'play',
    label: 'Playback',
    short: 'Play',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
        <path d="M8 5v14l11-7L8 5z" />
      </svg>
    ),
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    short: 'Ranks',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V22M14 14.66V22M12 6.5a4 4 0 0 0-4 4v4h8v-4a4 4 0 0 0-4-4z" />
      </svg>
    ),
  },
];

function NavButton({ item, isActive, onClick, showLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={item.label}
      className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-2 transition-colors lg:flex-row lg:gap-2 lg:px-2 lg:py-2.5 ${
        isActive
          ? 'bg-bg-elevated text-primary'
          : 'text-text-muted hover:bg-bg-elevated hover:text-text-base'
      }`}
    >
      <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
      {showLabel && (
        <span className="hidden text-sm font-medium lg:inline">{item.label}</span>
      )}
      <span className="text-[10px] font-medium lg:hidden">{item.short}</span>
    </button>
  );
}

export function Sidebar({ onOpenGlossary }) {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const view = useGameStore((s) => s.view);
  const setActiveGame = useGameStore((s) => s.setActiveGame);
  const setView = useGameStore((s) => s.setView);

  return (
    <>
      <aside
        className="glass-panel fixed left-0 top-0 z-30 hidden h-full w-[72px] flex-col border-r border-border md:flex lg:w-[220px]"
        aria-label="Main navigation"
      >
        <div className="flex h-12 shrink-0 items-center justify-center border-b border-border lg:justify-start lg:px-4">
          <span
            className="font-bold text-primary"
            style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}
          >
            M∆
          </span>
        </div>

        <nav className="hidden flex-1 overflow-y-auto py-3 lg:block">
          <ul className="flex flex-col gap-1 px-2">
            {GAMES.map((game) => {
              const isActive = game.id === activeGameId;
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => setActiveGame(game.id)}
                    title={game.name}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-bg-elevated"
                    style={
                      isActive
                        ? {
                            borderLeft: `3px solid ${game.accentColor}`,
                            backgroundColor: `${game.accentColor}14`,
                          }
                        : { borderLeft: '3px solid transparent' }
                    }
                  >
                    <span className="shrink-0 text-xl" aria-hidden>
                      {game.emoji}
                    </span>
                    <span className="truncate font-medium text-text-base">
                      {game.name}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-border p-2">
          <ul className="hidden flex-col gap-1 lg:flex">
            {VIEW_NAV.map((item) => (
              <li key={item.id}>
                <NavButton
                  item={item}
                  isActive={view === item.id}
                  onClick={() => setView(item.id)}
                  showLabel
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={onOpenGlossary}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-text-muted hover:bg-bg-elevated"
              >
                <span>📚</span>
                <span>Glossary</span>
              </button>
            </li>
            <li>
              <Link
                to="/demo"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-text-muted hover:bg-bg-elevated"
              >
                <span>▶️</span>
                <span>Demo</span>
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-sm text-text-muted hover:bg-bg-elevated"
              >
                <span>🏠</span>
                <span>Home</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      <nav
        className="glass-panel fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border px-1 py-1 md:hidden"
        aria-label="Mobile navigation"
      >
        {VIEW_NAV.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={view === item.id}
            onClick={() => setView(item.id)}
          />
        ))}
        <button
          type="button"
          onClick={onOpenGlossary}
          className="flex flex-col items-center rounded-lg px-2 py-2 text-text-muted"
          title="Glossary"
        >
          <span className="text-lg">📚</span>
          <span className="text-[10px]">Learn</span>
        </button>
      </nav>

      <aside className="glass-panel fixed left-0 top-12 z-20 hidden w-[72px] flex-col border-r border-border md:flex lg:hidden">
        <ul className="flex flex-col gap-1 p-2">
          {GAMES.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => setActiveGame(game.id)}
                title={game.name}
                className="flex w-full justify-center rounded-lg p-2 text-xl hover:bg-bg-elevated"
                style={
                  activeGameId === game.id
                    ? { backgroundColor: `${game.accentColor}22` }
                    : undefined
                }
              >
                {game.emoji}
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
