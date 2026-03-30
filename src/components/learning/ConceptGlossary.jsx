import { useState } from 'react'
import { motion as M, AnimatePresence } from 'framer-motion'

const CONCEPTS = [
  { term: 'Activation Function', def: 'A mathematical function applied after each layer that introduces non-linearity. Without it, stacking layers would be useless — the whole network would just be one big linear function. ReLU (Rectified Linear Unit) is the most common: it outputs the input if positive, 0 if negative.' },
  { term: 'Batch Size', def: 'How many experiences the model learns from at once. Larger batches = more stable but slower learning. Smaller batches = noisier but can escape local optima. 32 is a good default.' },
  { term: 'Dense Layer', def: 'A "fully connected" layer where every input connects to every output. The workhorse of neural networks. The "units" parameter controls how many neurons (outputs) the layer has.' },
  { term: 'Discount Factor (γ)', def: 'How much the agent values future rewards vs immediate ones. γ=0.99 means a reward 100 steps away is worth 0.99^100 ≈ 37% of an immediate reward. Higher γ = more long-term thinking.' },
  { term: 'Double DQN', def: 'An improvement over basic DQN that uses two networks to reduce overestimation of Q-values. The online network picks the best action, the target network evaluates it.' },
  { term: 'Dropout', def: 'Randomly "turns off" neurons during training (with probability = rate). Like studying with shuffled flashcards each time — prevents the network from relying too heavily on any single neuron. Helps prevent overfitting.' },
  { term: 'Epsilon (ε)', def: 'The exploration rate. With probability ε, the agent takes a random action instead of the "best" one. Starts high (explore everything) and decays over time (exploit what you\'ve learned). The explore/exploit tradeoff is fundamental to RL.' },
  { term: 'Epoch', def: 'One full pass through the entire training dataset. In RL, we usually talk about "episodes" instead — one complete game from start to finish.' },
  { term: 'Gradient', def: 'The direction and magnitude of change needed to reduce the loss. Think of loss as a hilly landscape — the gradient tells you which way is downhill. The optimizer uses gradients to update weights.' },
  { term: 'Huber Loss', def: 'A loss function that behaves like MSE for small errors but like MAE for large errors. More robust to outliers than MSE, which makes training more stable.' },
  { term: 'Learning Rate', def: 'How big of a step the optimizer takes when updating weights. Too high = overshooting (loss bounces around). Too low = painfully slow convergence. 0.001 is a common starting point.' },
  { term: 'Loss', def: 'A number measuring how wrong the model\'s predictions are. Training = minimizing loss. Lower is better. If loss stops decreasing, the model has converged (or gotten stuck).' },
  { term: 'Overfitting', def: 'When a model memorizes the training data instead of learning general patterns. It performs great on training data but poorly on new data. Dropout and smaller models help prevent this.' },
  { term: 'Q-Value', def: 'The expected total future reward for taking a specific action in a specific state. The "Q" stands for "quality." DQN learns to predict Q-values for each possible action.' },
  { term: 'Replay Buffer', def: 'A memory bank of past experiences (state, action, reward, next state). Training samples randomly from this buffer, which breaks correlations between consecutive experiences and makes learning more stable.' },
  { term: 'Target Network', def: 'A frozen copy of the main network used to compute target Q-values. Updated periodically. Without it, the target keeps shifting during training — like trying to hit a moving target.' },
]

export default function ConceptGlossary() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  const filtered = CONCEPTS.filter(c =>
    c.term.toLowerCase().includes(search.toLowerCase()) ||
    c.def.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-ghost text-lg">search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search concepts..."
            className="w-full pl-10 pr-3 py-2.5 bg-bg-primary border border-border rounded-lg text-sm font-mono text-text-primary placeholder:text-text-ghost focus:border-primary/30 focus:outline-none transition-colors" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {filtered.map(concept => (
          <div key={concept.term}>
            <button onClick={() => setExpanded(expanded === concept.term ? null : concept.term)}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-bg-hover transition-colors flex items-center justify-between group">
              <span className="text-sm font-bold text-text-primary font-label tracking-tight">{concept.term}</span>
              <span className="material-symbols-outlined text-text-muted text-sm group-hover:text-text-secondary transition-colors">
                {expanded === concept.term ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            <AnimatePresence>
              {expanded === concept.term && (
                <M.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-3">
                  <p className="text-[11px] text-text-secondary leading-relaxed">{concept.def}</p>
                </M.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
