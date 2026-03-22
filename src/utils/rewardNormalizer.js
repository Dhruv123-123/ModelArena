export function detectPlateau(rewards, windowSize = 50, threshold = 0.01) {
  if (rewards.length < windowSize * 2) return false
  const recent = rewards.slice(-windowSize)
  const previous = rewards.slice(-windowSize * 2, -windowSize)
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length
  return Math.abs(recentAvg - previousAvg) / (Math.abs(previousAvg) || 1) < threshold
}

export function detectOscillation(losses, windowSize = 20) {
  if (losses.length < windowSize) return false
  const recent = losses.slice(-windowSize)
  let changes = 0
  for (let i = 2; i < recent.length; i++) {
    const prev = recent[i - 1] - recent[i - 2]
    const curr = recent[i] - recent[i - 1]
    if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) changes++
  }
  return changes > windowSize * 0.6
}
