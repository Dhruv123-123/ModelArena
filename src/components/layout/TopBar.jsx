import useGameStore, { GAMES } from '../../stores/useGameStore'
import useTrainingStore from '../../stores/useTrainingStore'

export default function TopBar() {
  const { activeGameId } = useGameStore()
  const { isTraining, episode, bestScore, epsilon, stepsPerSecond } = useTrainingStore()
  const game = GAMES[activeGameId]

  return (
    <div className="h-12 bg-bg-secondary border-b border-border flex items-center px-4 justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-lg">{game.icon}</span>
        <div>
          <h2 className="text-sm font-semibold text-text-primary leading-none">{game.name}</h2>
          <p className="text-[10px] text-text-muted">{game.category} &middot; {game.difficulty}</p>
        </div>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono border bg-${game.accentColor}/10 text-${game.accentColor} border-${game.accentColor}/20`}>
          {game.inputSize} inputs → {game.outputSize} outputs
        </span>
      </div>

      {isTraining && (
        <div className="flex items-center gap-4 text-[11px] font-mono text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span>Episode {episode}</span>
          </div>
          <span>Best: {bestScore.toFixed(1)}</span>
          <span>ε: {epsilon.toFixed(3)}</span>
          <span>{stepsPerSecond.toFixed(0)} steps/s</span>
        </div>
      )}
    </div>
  )
}
