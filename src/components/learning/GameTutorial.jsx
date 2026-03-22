import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-text-muted">Tutorial — Step {stepIdx + 1}/{tutorial.steps.length}</p>
        <button onClick={() => setDismissed(d => ({ ...d, [activeGameId]: true }))}
          className="text-[10px] text-text-muted hover:text-text-primary">Dismiss</button>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={stepIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
          <h3 className="text-sm font-semibold text-text-primary mb-1">{step.title}</h3>
          <p className="text-xs text-text-secondary leading-relaxed">{step.text}</p>
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-2 mt-3">
        <button disabled={stepIdx === 0} onClick={() => setStepIdx(s => s - 1)}
          className="px-3 py-1 text-[10px] rounded border border-border text-text-muted disabled:opacity-30 hover:text-text-primary">← Prev</button>
        <button disabled={stepIdx === tutorial.steps.length - 1} onClick={() => setStepIdx(s => s + 1)}
          className="px-3 py-1 text-[10px] rounded border border-border text-text-muted disabled:opacity-30 hover:text-text-primary">Next →</button>
      </div>
    </motion.div>
  )
}
