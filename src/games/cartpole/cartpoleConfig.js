export const CARTPOLE_CONFIG = {
  gravity: 9.8,
  massCart: 1.0,
  massPole: 0.1,
  length: 0.5,
  forceMag: 10.0,
  tau: 0.02,
  xThreshold: 2.4,
  thetaThreshold: 12 * Math.PI / 180,
  inputSize: 4,
  outputSize: 2,
  actionLabels: ['Push Left', 'Push Right'],
}
