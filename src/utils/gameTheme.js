/** Hex accents matching @theme in index.css */
export const GAME_ACCENT_HEX = {
  snake: '#22C55E',
  flappy: '#F97316',
  cartpole: '#3B82F6',
  twentyfortyeight: '#A855F7',
  chess: '#EAB308',
}

export function getGameAccentHex(gameId) {
  return GAME_ACCENT_HEX[gameId] || GAME_ACCENT_HEX.snake
}
