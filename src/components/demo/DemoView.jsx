import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as tf from '@tensorflow/tfjs';
import { PRETRAINED_MODELS, loadPretrainedModel } from '../../ml/pretrainedModels.js';
import { getGameById } from '../../stores/useGameStore.js';
import { createEngine, getRenderer } from '../../utils/engineFactory.js';
import { exportStandardTfjsModel } from '../../ml/modelSerializer.js';

const DEMO_MODELS = Object.entries(PRETRAINED_MODELS).map(([id, config]) => ({
  id,
  ...config,
}));

const LIVE_URL = 'https://newarena.vercel.app';

export function DemoView() {
  const [activeModelId, setActiveModelId] = useState(DEMO_MODELS[0]?.id ?? '');
  const [model, setModel] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const engineRef = useRef(null);
  const intervalRef = useRef(null);

  const config = PRETRAINED_MODELS[activeModelId];
  const game = config ? getGameById(config.gameId) : null;
  const Renderer = config ? getRenderer(config.gameId) : null;

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const loadAndStart = useCallback(
    async (modelId) => {
      stop();
      setIsLoading(true);
      setError(null);
      setActiveModelId(modelId);

      const pretrained = PRETRAINED_MODELS[modelId];
      if (!pretrained) {
        setIsLoading(false);
        return;
      }

      try {
        const loadedModel = await loadPretrainedModel(modelId);
        if (!loadedModel) {
          throw new Error(
            'Could not load weights. Open the main app and use Quick Train, or deploy with /models static files.'
          );
        }

        setModel(loadedModel);
        const engine = createEngine(pretrained.gameId);
        engineRef.current = engine;
        let state = engine.reset();
        setGameState(engine.getState());

        const tickMs = pretrained.gameId === 'twentyfortyeight' ? 150 : 80;
        intervalRef.current = setInterval(() => {
          if (engine.isDone()) {
            state = engine.reset();
          }

          const action = tf.tidy(() => {
            const q = loadedModel.predict(tf.tensor2d([state]));
            const vals = Array.from(q.dataSync());
            return vals.indexOf(Math.max(...vals));
          });

          const result = engine.step(action);
          state = result.state;
          setGameState(engine.getState());
        }, tickMs);
      } catch (err) {
        console.error(err);
        setError(err.message ?? 'Demo failed to load');
        setModel(null);
        setGameState(null);
      } finally {
        setIsLoading(false);
      }
    },
    [stop]
  );

  useEffect(() => {
    if (DEMO_MODELS[0]?.id) {
      loadAndStart(DEMO_MODELS[0].id);
    }
    return stop;
  }, [loadAndStart, stop]);

  return (
    <div className="min-h-dvh bg-bg-primary text-text-base">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg-panel/80 px-4 backdrop-blur-md sm:px-8">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-bold text-primary"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ModelArena
          </Link>
          <span className="hidden text-xs uppercase tracking-wider text-text-muted sm:inline">
            Pre-trained demo
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={LIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
          >
            Live deployment
          </a>
          <Link
            to="/app"
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-black transition-all hover:brightness-110"
          >
            Open app
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row">
        <section className="flex flex-1 flex-col gap-4">
          <nav className="flex flex-wrap gap-2">
            {DEMO_MODELS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isLoading}
                onClick={() => loadAndStart(item.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                  activeModelId === item.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-muted hover:border-primary/30 hover:text-text-base'
                }`}
              >
                {item.name}
              </button>
            ))}
          </nav>

          <div className="glass-panel relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-2xl p-4">
            {isLoading && (
              <p className="absolute inset-0 z-10 flex items-center justify-center bg-bg-primary/60 text-sm text-text-muted">
                Loading model…
              </p>
            )}
            {error && (
              <div className="max-w-md text-center">
                <p className="text-sm text-error">{error}</p>
                <Link to="/app" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
                  Train in the main app →
                </Link>
              </div>
            )}
            {!error && gameState && Renderer && game && (
              <motion.div
                key={activeModelId}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Renderer gameState={gameState} width={380} height={380} />
              </motion.div>
            )}
          </div>
        </section>

        <aside className="glass-panel w-full shrink-0 space-y-4 rounded-2xl p-5 lg:w-80">
          {config && game && (
            <>
              <div>
                <p className="text-xs uppercase tracking-wider text-text-muted">Agent</p>
                <h2 className="mt-1 text-lg font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {config.name}
                </h2>
                <p className="mt-2 text-sm text-text-muted">{config.description}</p>
              </div>
              <div className="flex items-center gap-2 text-2xl">
                <span aria-hidden>{game.emoji}</span>
                <span className="text-sm font-medium">{game.name}</span>
              </div>
              <p className="font-mono-nums text-xs text-text-muted">
                Expected score: {config.expectedScore} · Tier: {config.tier}
              </p>
              {model && (
                <button
                  type="button"
                  onClick={() => exportStandardTfjsModel(model, config.name)}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm font-medium transition-colors hover:border-primary/40"
                >
                  Download TF.js model
                </button>
              )}
            </>
          )}
        </aside>
      </main>
    </div>
  );
}
