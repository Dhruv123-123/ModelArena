export function shouldShowTour() {
  return !localStorage.getItem('modelarena-tour-completed')
}
