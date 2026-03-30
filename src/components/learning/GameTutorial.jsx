import { useState } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'
import useGameStore, { GAMES } from '../../stores/useGameStore'

const TUTORIALS = {
  snake: {
    steps: [
      { title: 'The Game', text: 'Your snake moves on a 20×20 grid. Eat food to grow, avoid walls and your own tail.' },
      { title: 'State Input', text: 'Your model receives 20 numbers: danger sensors (3), direction (4), food direction (4), wall distances (4), food distance (2), snake length, hunger timer, and score.' },
      { title: 'Actions', text: 'The model outputs Q-values for 4 actions: Up, Down, Left, Right. The highest Q-value action is chosen.' },
      { title: 'Try This', text: 'Start with the "Starter (2-layer)" preset. Hit Train and watch for 30 seconds. You should see the score start climbing!' },
    ],
  },
  flappy: {
    steps: [
      { title: 'The Game', text: 'Guide a bird through pipes by deciding when to flap. Gravity pulls you down constantly.' },
      { title: 'State Input', text: '6 numbers: bird Y position, bird velocity, distance to next pipe, pipe top/bottom Y, distance to second pipe.' },
      { title: 'Key Insight', text: 'This game has temporal dependencies — the bird\'s velocity matters as much as position. Deeper networks can help capture this.' },
      { title: 'Try This', text: 'Start with Starter preset. If it struggles, try the Deep preset. Lower learning rate if loss oscillates.' },
    ],
  },
  cartpole: {
    steps: [
      { title: 'The Game', text: 'Balance a pole on a cart. Push left or right to keep the pole upright. The classic RL benchmark!' },
      { title: 'State Input', text: 'Just 4 numbers: cart position, cart velocity, pole angle, pole angular velocity.' },
      { title: 'Solved!', text: 'Score 195+ over 100 episodes means you\'ve "solved" CartPole. Most architectures can do it with enough training.' },
      { title: 'Try This', text: 'Even the Starter preset works. This is great for learning how hyperparameters affect training speed.' },
    ],
  },
  twentyfortyeight: {
    steps: [
      { title: 'The Game', text: 'Slide tiles to merge matching numbers. Random tiles spawn after each move. Reach 2048!' },
      { title: 'State Input', text: '20 numbers: log-scaled 4×4 grid values plus features for empty tiles, max tile, smoothness, and monotonicity.' },
      { title: 'The Challenge', text: 'This environment is stochastic — random tile spawns mean the same action can lead to different outcomes.' },
      { title: 'Try This', text: 'The Wide preset works well here. Input representation matters more than depth for this game.' },
    ],
  },
  chess: {
    steps: [
      { title: 'How It Works', text: 'Your ML model isn\'t playing chess directly — it\'s the evaluation function inside a minimax search engine.' },
      { title: 'State Input', text: '780 numbers: 8×8×12 one-hot piece encoding plus metadata (turn, material count, castling rights).' },
      { title: 'Training', text: 'Uses supervised learning on labeled positions (stockfish evals), not RL. You\'re teaching it what "good" positions look like.' },
      { title: 'Benchmarks', text: 'Beat the random player (easy), then the material-counting eval (medium), then the piece-square-table eval (hard).' },
    ],
  },
}

export default function GameTutorial() {
  const activeGameId = useGameStore((s) => s.activeGameId)
  const [stepIdx, setStepIdx] = useState(0)
  const [dismissed, setDismissed] = useState({})
  const tutorial = TUTORIALS[activeGameId]

  if (!tutorial || dismissed[activeGameId]) return null

  const step = tutorial.steps[stepIdx]

  return (
    <M.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-bg-hover border border-border rounded-xl p-5 mb-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 blur-[60px] pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">school</span>
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-text-muted font-black">Tutorial — Step {stepIdx + 1}/{tutorial.steps.length}</p>
          </div>
          <button onClick={() => setDismissed(d => ({ ...d, [activeGameId]: true }))}
            className="text-[10px] font-label uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-bg-active">Dismiss</button>
        </div>
        <AnimatePresence mode="wait">
          <M.div key={stepIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
            <h3 className="text-sm font-black text-text-primary mb-1.5 font-label tracking-tight">{step.title}</h3>
            <p className="text-[12px] text-text-secondary leading-relaxed">{step.text}</p>
          </M.div>
        </AnimatePresence>
        <div className="flex gap-2 mt-4">
          <button disabled={stepIdx === 0} onClick={() => setStepIdx(s => s - 1)}
            className="px-4 py-1.5 text-[10px] font-label uppercase tracking-wider rounded-lg border border-border text-text-muted disabled:opacity-30 hover:text-text-primary hover:border-primary/20 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
            Prev
          </button>
          <button disabled={stepIdx === tutorial.steps.length - 1} onClick={() => setStepIdx(s => s + 1)}
            className="px-4 py-1.5 text-[10px] font-label uppercase tracking-wider rounded-lg border border-border text-text-muted disabled:opacity-30 hover:text-text-primary hover:border-primary/20 transition-colors flex items-center gap-1">
            Next
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </M.div>
  )
}
