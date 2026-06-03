export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const ACTION_SPACE = 4;
export const INPUT_SIZE = 20;
export const INITIAL_LENGTH = 3;
export const MAX_STEPS_WITHOUT_FOOD = 100;
export const REWARDS = {
  food: 10,
  death: -10,
  step: -0.1,
  distImprove: 0.1,
  distWorsen: -0.15,
};
