import { useCallback, useEffect, useRef, useState } from 'react';
import { createEngine, getRenderer } from '../../utils/engineFactory.js';
import { getGameById, useGameStore } from '../../stores/useGameStore';
import {
  predictGreedyAction,
  createChessEvalFn,
} from '../../utils/playbackPolicy.js';

export function HumanVsModel({
  humanEngine,
  aiModel,
  playbackSpeed,
  onHumanState,
  selectedSquare,
  onSquareClick,
}) {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const game = getGameById(activeGameId);
  const Renderer = getRenderer(activeGameId);

  const aiEngineRef = useRef(createEngine(activeGameId));
  const [aiState, setAiState] = useState(() => aiEngineRef.current.getState());
  const [humanScore, setHumanScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const intervalRef = useRef(null);

  const tickAi = useCallback(async () => {
    const engine = aiEngineRef.current;
    if (engine.isDone()) return;

    let action = 0;
    if (activeGameId === 'chess' && aiModel) {
      const evalFn = await createChessEvalFn(aiModel);
      engine.step(0, evalFn);
    } else if (aiModel) {
      const vec = engine.getStateVector();
      action = await predictGreedyAction(aiModel, vec, game.outputSize);
      engine.step(action);
    } else {
      engine.step(Math.floor(Math.random() * game.outputSize));
    }

    setAiState(engine.getState());
    setAiScore(engine.getScore());
  }, [activeGameId, aiModel, game?.outputSize]);

  useEffect(() => {
    aiEngineRef.current.reset();
    setAiState(aiEngineRef.current.getState());
    setAiScore(0);
  }, [activeGameId]);

  useEffect(() => {
    if (!aiModel && activeGameId !== 'chess') return;
    intervalRef.current = setInterval(() => {
      tickAi();
    }, playbackSpeed);
    return () => clearInterval(intervalRef.current);
  }, [tickAi, playbackSpeed, aiModel, activeGameId]);

  useEffect(() => {
    if (humanEngine) {
      setHumanScore(humanEngine.getScore());
      onHumanState?.(humanEngine.getState());
    }
  }, [humanEngine, onHumanState]);

  const leader =
    humanScore > aiScore ? 'human' : humanScore < aiScore ? 'ai' : 'tie';

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
      <div className="glass-panel p-4">
        <p className="mb-2 text-center text-xs font-bold text-primary">You</p>
        <Renderer
          gameState={humanEngine?.getState()}
          selectedSquare={selectedSquare}
          onSquareClick={onSquareClick}
        />
        <p className="mt-2 text-center font-mono-nums text-xl">{humanScore}</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-2 px-2">
        <span className="text-2xl text-text-muted">VS</span>
        {leader === 'human' && (
          <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
            You&apos;re winning
          </span>
        )}
        {leader === 'ai' && (
          <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-bold text-secondary">
            AI leads
          </span>
        )}
        {leader === 'tie' && (
          <span className="text-xs text-text-muted">Tied</span>
        )}
      </div>

      <div className="glass-panel p-4">
        <p className="mb-2 text-center text-xs font-bold text-secondary">AI</p>
        <Renderer gameState={aiState} />
        <p className="mt-2 text-center font-mono-nums text-xl">{aiScore}</p>
      </div>
    </div>
  );
}
