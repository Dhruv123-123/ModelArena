export const SNAKE_CONFIG = {
  gridSize: 20,
  cellSize: 20,
  initialLength: 3,
  rewards: { food: 10, death: -10, step: -0.1, closerToFood: 0.1, furtherFromFood: -0.15 },
  maxStepsWithoutFood: 100,
  inputSize: 20,
  outputSize: 4,
  actionLabels: ['Up', 'Down', 'Left', 'Right'],
}

export const DIRECTIONS = {
  UP: { x: 0, y: -1 }, DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 }, RIGHT: { x: 1, y: 0 },
}

export const ACTION_TO_DIRECTION = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT]
