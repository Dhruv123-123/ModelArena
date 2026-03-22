import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useTrainingStore from '../../stores/useTrainingStore'
import useModelStore from '../../stores/useModelStore'
import { detectPlateau, detectOscillation } from '../../utils/rewardNormalizer'

export default function TrainingHints() {
  const { episodeRewards, losses, isTraining } = useTrainingStore()
  const layers = useModelStore((s) => s.layers)

  const hints = useMemo(() => {
    const h = []
    if (!isTraining || episodeRewards.length < 10) return h

    if (detectPlateau(episodeRewards)) {
      h.push({ type: 'warning', text: 'Reward has plateaued. Try adding more layers or increasing layer width.' })
    }
    if (detectOscillation(losses)) {
      h.push({ type: 'error', text: 'Loss is oscillating. Try reducing the learning rate.' })
    }
    if (episodeRewards.length > 50) {
      const avg = episodeRewards.slice(-20).reduce((a, b) => a + b, 0) / 20
      if (avg < 0 && layers.length < 3) {
        h.push({ type: 'info', text: 'Negative average reward with a small model. Try adding more dense layers.' })
      }
    }
    return h
  }, [episodeRewards, losses, isTraining, layers])

  if (hints.length === 0) return null

  const colors = { warning: 'text-warning border-warning/20 bg-warning/5', error: 'text-error border-error/20 bg-error/5', info: 'text-accent-cartpole border-accent-cartpole/20 bg-accent-cartpole/5' }

  return (
    <AnimatePresence>
      <div className="space-y-2">
        {hints.map((hint, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className={`px-3 py-2 rounded-lg border text-[11px] ${colors[hint.type]}`}>
            {hint.text}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  )
}
