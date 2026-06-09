import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GAMES, useGameStore } from '../../stores/useGameStore';

const FEATURES = [
  {
    title: 'Zero Setup',
    description: 'Runs entirely in your browser with WebGL-accelerated training.',
  },
  {
    title: 'Real DQN',
    description: 'Double DQN with experience replay — real reinforcement learning.',
  },
  {
    title: '5 Games',
    description: 'Snake, Flappy Bird, CartPole, 2048, and Chess evaluation.',
  },
];

function formatTier(value, gameId) {
  if (gameId === 'chess') return value.toFixed(1);
  return value;
}

export function WelcomeScreen() {
  const navigate = useNavigate();
  const setActiveGame = useGameStore((s) => s.setActiveGame);

  const handleGameClick = (gameId) => {
    setActiveGame(gameId);
    navigate('/app');
  };

  const liveUrl = 'https://newarena.vercel.app';

  return (
    <div className="min-h-dvh bg-bg-primary text-text-base">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-bg-primary/80 px-6 backdrop-blur-md sm:px-10 lg:px-16">
        <span
          className="font-bold text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          ModelArena
        </span>
        <div className="flex items-center gap-4">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-text-muted transition-colors hover:text-primary"
          >
            Live site
          </a>
          <Link
            to="/app"
            className="rounded-lg bg-primary/15 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/25"
          >
            Launch app
          </Link>
        </div>
      </header>
      <section className="relative overflow-hidden px-6 pb-16 pt-12 sm:px-10 lg:px-16">
        <div className="gradient-mesh absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-5xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-bold leading-tight tracking-tight text-text-base sm:text-6xl lg:text-7xl xl:text-8xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Train AI. In Your Browser.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-text-muted sm:text-xl"
          >
            Build neural networks. Pick a game. Watch your model learn — no Python,
            no GPU, no cloud.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-bold text-black transition-all hover:glow-primary hover:brightness-110"
            >
              Start Building →
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center rounded-xl border border-border px-8 py-3.5 font-medium text-text-base transition-colors hover:border-primary/40 hover:bg-bg-elevated"
            >
              See Demo
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <h2
            className="mb-6 text-center text-sm font-medium uppercase tracking-wider text-text-muted"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Choose your arena
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {GAMES.map((game) => (
              <motion.button
                key={game.id}
                type="button"
                onClick={() => handleGameClick(game.id)}
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="glass-panel flex min-w-[200px] shrink-0 snap-start flex-col gap-3 p-5 text-left transition-colors hover:border-[var(--game-accent)]"
                style={{ '--game-accent': game.accentColor }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = game.accentColor;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                }}
              >
                <span className="text-5xl" aria-hidden>
                  {game.emoji}
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {game.name}
                </span>
                <p className="text-sm text-text-muted">{game.description}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {(['bronze', 'silver', 'gold']).map((tier) => (
                    <span
                      key={tier}
                      className="font-mono-nums rounded border border-border bg-bg-elevated px-2 py-0.5 text-xs capitalize text-text-muted"
                    >
                      {tier}: {formatTier(game.tiers[tier], game.id)}
                    </span>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-bg-panel/50 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center sm:text-left"
            >
              <h3
                className="text-xl font-bold text-primary"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-sm text-text-muted">
        <p>Built with TensorFlow.js + React</p>
        <p className="mt-2">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            newarena.vercel.app
          </a>
          {' · '}
          <Link to="/demo" className="hover:text-primary">
            Watch pre-trained demo
          </Link>
        </p>
      </footer>
    </div>
  );
}
