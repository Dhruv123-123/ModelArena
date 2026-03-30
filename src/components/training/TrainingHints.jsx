import { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import { AnimatePresence, motion as M } from 'framer-motion'
import useTrainingStore from '../../stores/useTrainingStore'
import useModelStore from '../../stores/useModelStore'
import { detectPlateau, detectOscillation } from '../../utils/rewardNormalizer'

const TOAST_TTL_MS = 5000

const ICONS = {
  warning: 'warning',
  error: 'error',
  info: 'info',
}

export default function TrainingHints() {
  const { episodeRewards, losses, isTraining } = useTrainingStore()
  const layers = useModelStore((s) => s.layers)
  const [toasts, setToasts] = useState([])
  const seenRef = useRef(new Set())
  const idRef = useRef(0)

  const plateau = useMemo(
    () => isTraining && episodeRewards.length >= 10 && detectPlateau(episodeRewards),
    [isTraining, episodeRewards],
  )
  const oscillate = useMemo(
    () => isTraining && losses.length >= 8 && detectOscillation(losses),
    [isTraining, losses],
  )
  const negSmall = useMemo(() => {
    if (!isTraining || episodeRewards.length <= 50) return false
    const avg = episodeRewards.slice(-20).reduce((a, b) => a + b, 0) / 20
    return avg < 0 && layers.length < 3
  }, [isTraining, episodeRewards, layers.length])

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    if (!isTraining) {
      seenRef.current.clear()
      return
    }

    const batch = []
    if (plateau) {
      batch.push({ type: 'warning', text: 'Reward has plateaued. Try adding more layers or increasing layer width.' })
    }
    if (oscillate) {
      batch.push({ type: 'error', text: 'Loss is oscillating. Try reducing the learning rate.' })
    }
    if (negSmall) {
      batch.push({ type: 'info', text: 'Negative average reward with a small model. Try adding more dense layers.' })
    }

    for (const hint of batch) {
      if (seenRef.current.has(hint.text)) continue
      seenRef.current.add(hint.text)
      const id = ++idRef.current
      setToasts((t) => [...t, { id, ...hint }])
      window.setTimeout(() => dismiss(id), TOAST_TTL_MS)
    }
  }, [plateau, oscillate, negSmall, isTraining, dismiss])

  const borderStyles = {
    warning: 'border-warning/30 bg-warning/5',
    error: 'border-error/30 bg-error/5',
    info: 'border-primary/30 bg-primary/5',
  }

  const textStyles = {
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-text-secondary',
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-[min(100vw-2rem,22rem)] items-end">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <M.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 48, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 32, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className={`pointer-events-auto px-4 py-3 rounded-xl border text-xs shadow-xl backdrop-blur-md ${borderStyles[t.type]}`}
          >
            <div className="flex gap-2.5 items-start">
              <span className={`material-symbols-outlined text-base mt-0.5 ${textStyles[t.type]}`}>
                {ICONS[t.type]}
              </span>
              <p className={`flex-1 leading-relaxed font-label text-[11px] ${textStyles[t.type]}`}>
                {t.text}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          </M.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
