export function shouldShowTour() {
  return !localStorage.getItem('modelarena-tour-completed');
}

export function completeTour() {
  localStorage.setItem('modelarena-tour-completed', '1');
}
