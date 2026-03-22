import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../stores/useGameStore'
import useModelStore from '../../stores/useModelStore'

const TOUR_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to ModelArena!',
    content: "Let's walk through building and training your first neural network. It takes about 2 minutes.",
    action: null,
    position: 'center',
  },
  {
    id: 'pick-game',
    target: 'sidebar-games',
    title: 'Step 1: Pick a Game',
    content: "We've selected Snake for you — it's the best starting point. Each game has different inputs and challenges.",
    action: null,
    position: 'right',
    highlight: 'sidebar',
  },
  {
    id: 'load-preset',
    target: 'presets',
    title: 'Step 2: Load an Architecture',
    content: 'Click "Starter (2-layer)" to load a simple neural network. You can customize it later!',
    action: 'loadPreset',
    position: 'right',
    highlight: 'presets',
  },
  {
    id: 'explore-layers',
    target: 'layer-stack',
    title: 'Explore Your Model',
    content: "See the layers? Each one transforms the input. Click a layer to configure it. The shape flow on the right shows data dimensions.",
    action: null,
    position: 'bottom',
    highlight: 'layers',
  },
  {
    id: 'network-viz',
    target: 'network-graph',
    title: 'Network Visualization',
    content: "This shows your network's topology. Wider layers have more neurons. The visualization updates as you add or modify layers.",
    action: null,
    position: 'left',
    highlight: 'network',
  },
  {
    id: 'go-train',
    target: 'view-train',
    title: 'Step 3: Train Your Model',
    content: 'Click "Train" in the sidebar to start training. Hit "Start Training" and watch the magic happen!',
    action: 'goToTrain',
    position: 'right',
    highlight: 'train-button',
  },
  {
    id: 'watch-train',
    target: 'training-view',
    title: 'Watch It Learn',
    content: "You'll see live charts showing the reward climbing over episodes. The snake game view shows your model playing in real-time.",
    action: null,
    position: 'bottom',
  },
  {
    id: 'go-play',
    target: 'view-play',
    title: 'Step 4: Watch It Play',
    content: 'After training, switch to "Watch Play" to see your model in action. You can also play the game yourself and compare!',
    action: 'goToPlay',
    position: 'right',
  },
  {
    id: 'done',
    target: null,
    title: "You're Ready!",
    content: "That's the core loop: Design → Train → Watch. Try different architectures, tweak hyperparameters, and see what scores you can achieve. Check the Leaderboard to track your progress!",
    action: null,
    position: 'center',
  },
]

export default function GuidedTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const { setView, setActiveGame } = useGameStore()
  const { loadPreset } = useModelStore()

  const step = TOUR_STEPS[currentStep]

  const handleNext = () => {
    // Perform actions for current step
    if (step.action === 'loadPreset') {
      setActiveGame('snake')
      loadPreset('starter')
    } else if (step.action === 'goToTrain') {
      setView('train')
    } else if (step.action === 'goToPlay') {
      setView('play')
    }

    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleDismiss()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1)
  }

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem('modelarena-tour-completed', 'true')
    onComplete?.()
  }

  if (!visible) return null

  const isCenter = step.position === 'center'

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Tour card */}
          <motion.div
            key={step.id}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`fixed z-50 max-w-sm ${
              isCenter
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                : step.position === 'right'
                ? 'top-1/3 left-64'
                : step.position === 'left'
                ? 'top-1/3 right-16'
                : 'top-1/2 left-1/2 -translate-x-1/2'
            }`}
          >
            <div className="bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Progress bar */}
              <div className="h-1 bg-bg-primary">
                <motion.div
                  className="h-full bg-accent-snake"
                  animate={{ width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-text-muted">
                    {currentStep + 1} / {TOUR_STEPS.length}
                  </span>
                  <button
                    onClick={handleDismiss}
                    className="text-[10px] text-text-muted hover:text-text-primary transition-colors"
                  >
                    Skip Tour
                  </button>
                </div>

                <h3 className="text-base font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">{step.content}</p>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-3 py-1.5 rounded-lg text-xs text-text-muted border border-border hover:text-text-primary transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNext}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-accent-snake text-bg-primary hover:opacity-90 transition-opacity"
                  >
                    {currentStep === TOUR_STEPS.length - 1
                      ? "Let's Go!"
                      : step.action
                      ? 'Do It & Continue →'
                      : 'Next →'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Arrow pointer */}
            {!isCenter && step.position === 'right' && (
              <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-transparent border-r-border" />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function shouldShowTour() {
  return !localStorage.getItem('modelarena-tour-completed')
}
