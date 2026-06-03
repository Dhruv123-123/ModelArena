import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ConceptGlossary } from '../learning/ConceptGlossary';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ToastStack } from '../ui/ToastStack';
import { Confetti } from '../ui/Confetti';

const ModelBuilder = lazy(() =>
  import('../builder/ModelBuilder').then((m) => ({ default: m.ModelBuilder }))
);
const TrainingPanel = lazy(() =>
  import('../training/TrainingPanel').then((m) => ({
    default: m.TrainingPanel,
  }))
);
const GamePlayback = lazy(() =>
  import('../playback/GamePlayback').then((m) => ({
    default: m.GamePlayback,
  }))
);
const Leaderboard = lazy(() =>
  import('../leaderboard/Leaderboard').then((m) => ({
    default: m.Leaderboard,
  }))
);

function ViewFallback({ label }) {
  return <LoadingSkeleton label={label} />;
}

export function MainLayout() {
  const view = useGameStore((s) => s.view);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const content = {
    builder: (
      <Suspense fallback={<ViewFallback label="Loading builder…" />}>
        <ModelBuilder />
      </Suspense>
    ),
    train: (
      <Suspense fallback={<ViewFallback label="Loading training…" />}>
        <TrainingPanel onCelebrate={() => setConfetti(true)} />
      </Suspense>
    ),
    play: (
      <Suspense fallback={<ViewFallback label="Loading TensorFlow.js…" />}>
        <GamePlayback />
      </Suspense>
    ),
    leaderboard: (
      <Suspense fallback={<ViewFallback label="Loading leaderboard…" />}>
        <Leaderboard />
      </Suspense>
    ),
  };

  return (
    <div className="relative min-h-dvh bg-bg-primary pb-16 lg:pb-0">
      <div className="pointer-events-none absolute inset-0 grid-bg" aria-hidden />

      <div
        className="pointer-events-none absolute -left-20 -top-20 size-[300px] rounded-full bg-primary/5 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 size-[400px] rounded-full bg-tertiary/3 blur-[120px]"
        aria-hidden
      />

      <Sidebar onOpenGlossary={() => setGlossaryOpen(true)} />
      <ConceptGlossary
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
      <ToastStack />
      <Confetti active={confetti} onDone={() => setConfetti(false)} />

      <div className="flex min-h-dvh flex-col pl-0 md:pl-[72px] lg:pl-[220px]">
        <TopBar />
        <main className="relative flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full min-h-[calc(100dvh-3rem)]"
            >
              {content[view] ?? content.builder}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
