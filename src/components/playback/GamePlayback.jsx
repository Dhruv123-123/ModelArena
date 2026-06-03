import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createEngine, getRenderer } from '../../utils/engineFactory.js';
import { getGameById, getGameAccentHex, useGameStore } from '../../stores/useGameStore';
import { useModelStore } from '../../stores/useModelStore';
import { loadModel } from '../../ml/modelSerializer.js';
import { loadPretrainedModel, PRETRAINED_MODELS } from '../../ml/pretrainedModels.js';
import { DQNAgent } from '../../ml/DQNAgent.js';
import { loadTf } from '../../utils/tfLoader.js';
import {
  predictGreedyAction,
  predictQValues,
  createChessEvalFn,
} from '../../utils/playbackPolicy.js';
import { DecisionOverlay } from './DecisionOverlay.jsx';
import { PretrainedModelSelector } from './PretrainedModelSelector.jsx';
import { HumanVsModel } from './HumanVsModel.jsx';
import { LoadingSkeleton } from '../ui/LoadingSkeleton.jsx';
import { GRID_SIZE, CELL_SIZE } from '../../games/snake/snakeConfig.js';

const MODES = ['ai', 'human', 'versus'];

export function GamePlayback() {
  const activeGameId = useGameStore((s) => s.activeGameId);
  const playbackSpeed = useGameStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useGameStore((s) => s.setPlaybackSpeed);
  const setIsPlaying = useGameStore((s) => s.setIsPlaying);

  const layers = useModelStore((s) => s.layers);
  const savedWeightsKey = useModelStore((s) => s.savedWeightsKey);

  const game = getGameById(activeGameId);
  const accent = getGameAccentHex(activeGameId);
  const Renderer = getRenderer(activeGameId);

  const engineRef = useRef(null);
  const modelRef = useRef(null);
  const intervalRef = useRef(null);
  const humanActionRef = useRef(
    activeGameId === 'flappy' ? 0 : activeGameId === 'cartpole' ? 0 : 3
  );

  const [tfReady, setTfReady] = useState(false);
  const [mode, setMode] = useState('ai');
  const [gameState, setGameState] = useState(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [qValues, setQValues] = useState(null);
  const [modelSource, setModelSource] = useState('untrained');
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [chessSelection, setChessSelection] = useState(null);

  useEffect(() => {
    loadTf().then(() => setTfReady(true));
  }, []);

  useEffect(() => {
    if (savedWeightsKey) setModelSource('trained');
  }, [savedWeightsKey]);

  const resetEngine = useCallback(() => {
    engineRef.current = createEngine(activeGameId);
    engineRef.current.reset();
    const state = engineRef.current.getState();
    setGameState(state);
    setScore(0);
    setGameOver(false);
    setQValues(null);
    setChessSelection(null);
    setSelectedSquare(null);
  }, [activeGameId]);

  useEffect(() => {
    resetEngine();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    };
  }, [activeGameId, resetEngine, setIsPlaying]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
    setIsPlaying(false);
  }, [setIsPlaying]);

  const applyStep = useCallback(
    async (action) => {
      const engine = engineRef.current;
      if (!engine || engine.isDone()) return;

      let result;
      if (activeGameId === 'chess') {
        if (typeof action === 'object' && action.from) {
          result = await engine.step(action, modelRef.current ? await createChessEvalFn(modelRef.current) : undefined);
        } else {
          const evalFn = modelRef.current
            ? await createChessEvalFn(modelRef.current)
            : undefined;
          result = engine.step(0, evalFn);
        }
      } else {
        result = engine.step(action);
      }

      setGameState(engine.getState());
      setScore(engine.getScore());

      if (modelRef.current && activeGameId === 'snake' && showQ) {
        const qs = await predictQValues(
          modelRef.current,
          engine.getStateVector()
        );
        setQValues(qs.slice(0, 4));
      }

      if (result.done) {
        stopInterval();
        setGameOver(true);
      }
    },
    [activeGameId, showQ, stopInterval]
  );

  const resolveModel = useCallback(async () => {
    if (savedWeightsKey) {
      try {
        const m = await loadModel(savedWeightsKey);
        modelRef.current = m;
        setModelSource('trained');
        return m;
      } catch {
        /* fall through */
      }
    }

    const pretrainedId = Object.keys(PRETRAINED_MODELS).find(
      (id) => PRETRAINED_MODELS[id].gameId === activeGameId
    );
    if (pretrainedId) {
      const m = await loadPretrainedModel(pretrainedId);
      if (m) {
        modelRef.current = m;
        setModelSource('pretrained');
        return m;
      }
    }

    if (layers.length > 0 && game?.trainingMode === 'rl') {
      const agent = new DQNAgent(
        layers,
        activeGameId,
        game.outputSize,
        { learningRate: 0.001, batchSize: 32, replayBufferSize: 1000 }
      );
      modelRef.current = agent.onlineModel;
      setModelSource('untrained');
      return agent.onlineModel;
    }

    modelRef.current = null;
    setModelSource('untrained');
    return null;
  }, [savedWeightsKey, activeGameId, layers, game]);

  const startAI = useCallback(async () => {
    resetEngine();
    const model = await resolveModel();
    const engine = engineRef.current;

    setRunning(true);
    setIsPlaying(true);
    setGameOver(false);

    intervalRef.current = setInterval(async () => {
      if (engine.isDone()) {
        stopInterval();
        setGameOver(true);
        return;
      }

      if (activeGameId === 'chess') {
        const evalFn = model
          ? await createChessEvalFn(model)
          : undefined;
        await applyStep(0);
        void evalFn;
      } else if (model) {
        const vec = engine.getStateVector();
        const action = await predictGreedyAction(
          model,
          vec,
          game.outputSize
        );
        await applyStep(action);
      } else if (layers.length > 0) {
        const agent = new DQNAgent(
          layers,
          activeGameId,
          game.outputSize,
          { learningRate: 0.001, batchSize: 32, replayBufferSize: 1000 }
        );
        const action = agent.selectAction(
          Array.from(engine.getStateVector()),
          true
        );
        agent.dispose();
        await applyStep(action);
      } else {
        await applyStep(Math.floor(Math.random() * game.outputSize));
      }
    }, playbackSpeed);
  }, [
    resetEngine,
    resolveModel,
    activeGameId,
    game,
    layers,
    playbackSpeed,
    applyStep,
    stopInterval,
    setIsPlaying,
  ]);

  const startHuman = useCallback(() => {
    resetEngine();
    setRunning(true);
    setIsPlaying(true);
    setGameOver(false);

    intervalRef.current = setInterval(() => {
      applyStep(humanActionRef.current);
    }, playbackSpeed);
  }, [resetEngine, playbackSpeed, applyStep, setIsPlaying]);

  const handleStart = async () => {
    if (mode === 'versus') {
      resetEngine();
      await resolveModel();
      setRunning(true);
      setIsPlaying(true);
      setGameOver(false);
      intervalRef.current = setInterval(() => {
        applyStep(humanActionRef.current);
      }, playbackSpeed);
      return;
    }
    if (mode === 'ai') startAI();
    else if (mode === 'human') startHuman();
  };

  const handleReset = () => {
    stopInterval();
    resetEngine();
  };

  useEffect(() => {
    if (mode !== 'human') return;

    const keyMap = {
      snake: {
        ArrowUp: 0,
        ArrowDown: 1,
        ArrowLeft: 2,
        ArrowRight: 3,
      },
      flappy: { Space: 1, ArrowUp: 1 },
      cartpole: { ArrowLeft: 0, ArrowRight: 1 },
      twentyfortyeight: {
        ArrowUp: 0,
        ArrowDown: 1,
        ArrowLeft: 2,
        ArrowRight: 3,
      },
    };

    const onKey = (e) => {
      const map = keyMap[activeGameId];
      if (!map) return;
      if (map[e.code] !== undefined) {
        e.preventDefault();
        humanActionRef.current = map[e.code];
        if (activeGameId === 'flappy') {
          humanActionRef.current = 1;
        }
      }
      if (activeGameId === 'flappy' && e.type === 'keyup') {
        humanActionRef.current = 0;
      }
    };

    window.addEventListener('keydown', onKey);
    if (activeGameId === 'flappy') {
      window.addEventListener('keyup', onKey);
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, [mode, activeGameId]);

  const handleChessClick = useCallback(
    (r, c) => {
      const engine = engineRef.current;
      if (!engine) return;
      const state = engine.getState();

      if (!chessSelection) {
        const piece = state.board[r][c];
        const isWhite = piece >= 1 && piece <= 6;
        if (
          (state.turn === 'white' && isWhite) ||
          (state.turn === 'black' && piece >= 7)
        ) {
          setChessSelection([r, c]);
          setSelectedSquare([r, c]);
        }
        return;
      }

      const [fr, fc] = chessSelection;
      const move = state.legalMoves.find(
        (m) => m.from[0] === fr && m.from[1] === fc && m.to[0] === r && m.to[1] === c
      );
      if (move) {
        applyStep(move);
      }
      setChessSelection(null);
      setSelectedSquare(null);
    },
    [chessSelection, applyStep]
  );

  const speedLabel = useMemo(() => {
    if (playbackSpeed <= 100) return 'Fast';
    if (playbackSpeed <= 300) return 'Normal';
    return 'Slow';
  }, [playbackSpeed]);

  if (!tfReady) {
    return <LoadingSkeleton label="Loading TensorFlow.js…" />;
  }

  const canvasSize =
    activeGameId === 'snake' ? GRID_SIZE * CELL_SIZE : undefined;

  return (
    <div className="flex h-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
      <div className="relative flex flex-1 flex-col items-center justify-center">
        {mode === 'versus' ? (
          <HumanVsModel
            humanEngine={engineRef.current}
            aiModel={modelRef.current}
            playbackSpeed={playbackSpeed}
            selectedSquare={selectedSquare}
            onSquareClick={handleChessClick}
          />
        ) : (
          <div className="relative">
            <Renderer
              gameState={gameState}
              qValues={showQ ? qValues : undefined}
              selectedSquare={selectedSquare}
              onSquareClick={mode === 'human' ? handleChessClick : undefined}
            />
            {activeGameId === 'snake' && showQ && qValues && (
              <DecisionOverlay
                qValues={qValues}
                gameState={gameState}
                canvasSize={canvasSize}
              />
            )}
          </div>
        )}

        {gameOver && mode !== 'versus' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="glass-panel p-8 text-center">
              <h3 className="text-xl font-bold text-text-base">Game Over</h3>
              <p
                className="mt-2 font-mono-nums text-3xl font-bold"
                style={{ color: accent }}
              >
                {score}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-4 rounded-lg bg-primary px-6 py-2 font-bold text-black"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="w-full shrink-0 space-y-4 lg:w-[300px]">
        <div className="glass-panel flex gap-1 p-1">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                stopInterval();
                setMode(m);
              }}
              className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize ${
                mode === m
                  ? 'bg-primary text-black'
                  : 'text-text-muted hover:bg-bg-elevated'
              }`}
            >
              {m === 'versus' ? 'AI vs Human' : m}
            </button>
          ))}
        </div>

        {mode === 'ai' || mode === 'versus' ? (
          <div className="glass-panel space-y-3 p-4">
            {savedWeightsKey && modelSource === 'trained' && (
              <p className="text-xs text-primary">✓ Using your trained model</p>
            )}
            {modelSource === 'untrained' && !savedWeightsKey && (
              <p className="rounded-lg border border-accent-flappy/40 bg-accent-flappy/10 px-3 py-2 text-xs text-accent-flappy">
                Untrained policy — random or weak play
              </p>
            )}
            <PretrainedModelSelector
              onModelLoaded={(m) => {
                modelRef.current = m;
                setModelSource('pretrained');
              }}
            />
          </div>
        ) : null}

        <div className="glass-panel p-4">
          <label className="text-xs text-text-muted">
            Speed: {speedLabel} ({playbackSpeed}ms)
          </label>
          <input
            type="range"
            min={50}
            max={1000}
            value={1050 - playbackSpeed}
            onChange={(e) =>
              setPlaybackSpeed(1050 - Number(e.target.value))
            }
            className="mt-2 w-full"
          />
          <div className="mt-1 flex justify-between text-[10px] text-text-muted">
            <span>Slow</span>
            <span>Normal</span>
            <span>Fast</span>
          </div>
        </div>

        <p
          className="text-center font-mono-nums text-4xl font-bold"
          style={{ color: accent }}
        >
          {score}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={running ? stopInterval : handleStart}
            className="flex-1 rounded-lg bg-primary py-2.5 font-bold text-black"
          >
            {running ? 'Stop' : 'Start'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-border px-4 py-2.5 text-sm"
          >
            Reset
          </button>
        </div>

        {activeGameId === 'snake' && mode === 'ai' && (
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={showQ}
              onChange={(e) => setShowQ(e.target.checked)}
            />
            Show Q-Values
          </label>
        )}
      </aside>
    </div>
  );
}
