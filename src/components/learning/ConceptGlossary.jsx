import { useState } from 'react';

const TERMS = [
  {
    term: 'Reinforcement Learning',
    def: 'An agent learns by interacting with an environment and receiving rewards. It optimizes a policy to maximize cumulative reward over time.',
  },
  {
    term: 'Q-Value',
    def: 'The expected future reward for taking an action in a given state. Higher Q-values indicate better actions under the current policy.',
  },
  {
    term: 'Epsilon-Greedy',
    def: 'Exploration strategy: with probability ε choose a random action, otherwise choose the greedy (best Q) action. ε decays over training.',
  },
  {
    term: 'Replay Buffer',
    def: 'Stores past transitions (state, action, reward, next state). Random mini-batches break correlation and stabilize learning.',
  },
  {
    term: 'Double DQN',
    def: 'Reduces overestimation by using the online network to select actions and the target network to evaluate them when computing TD targets.',
  },
  {
    term: 'Discount Factor (γ)',
    def: 'Gamma weights future rewards vs immediate ones. Values near 1 favor long-term planning; lower values focus on short-term gains.',
  },
  {
    term: 'Dense Layer',
    def: 'Fully connected layer: every input neuron connects to every output neuron. Learns weighted combinations of all inputs.',
  },
  {
    term: 'Activation Function (ReLU, Sigmoid, Tanh)',
    def: 'Non-linear functions applied after layers. ReLU is common for hidden layers; tanh/sigmoid bound outputs for classification or evaluation.',
  },
  {
    term: 'Batch Normalization',
    def: 'Normalizes layer inputs across a batch, stabilizing training and allowing higher learning rates.',
  },
  {
    term: 'Dropout',
    def: 'Randomly zeros neurons during training to reduce overfitting. At inference, all neurons are active with scaled weights.',
  },
  {
    term: 'Policy',
    def: 'Mapping from states to actions. A greedy policy always picks argmax Q; ε-greedy mixes exploration.',
  },
  {
    term: 'Episode',
    def: 'One complete run from environment reset until termination. Training loops over many episodes to improve the policy.',
  },
  {
    term: 'State Vector',
    def: 'Numeric encoding of game state fed to the network. Each game defines its own features (positions, dangers, scores, etc.).',
  },
  {
    term: 'Reward Signal',
    def: 'Scalar feedback after each step. Shaping rewards (small penalties/bonuses) guides learning toward desired behavior.',
  },
];

export function ConceptGlossary({ open, onClose }) {
  const [expanded, setExpanded] = useState(null);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <aside className="glass-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-bold text-text-base">📚 ML Glossary</h2>
          <button type="button" onClick={onClose} className="text-text-muted">
            ×
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {TERMS.map(({ term, def }) => (
            <div key={term} className="mb-2 border-b border-border/50">
              <button
                type="button"
                onClick={() =>
                  setExpanded(expanded === term ? null : term)
                }
                className="flex w-full items-center justify-between py-3 text-left text-sm font-bold text-primary"
              >
                {term}
                <span>{expanded === term ? '−' : '+'}</span>
              </button>
              {expanded === term && (
                <p className="pb-3 text-sm leading-relaxed text-text-muted">
                  {def}{' '}
                  <a href="#" className="text-secondary hover:underline">
                    Learn More →
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
