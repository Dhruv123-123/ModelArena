# ModelArena

Build, train, and battle your own neural networks against classic games — entirely in the browser.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-FF6F00?logo=tensorflow&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss&logoColor=white)

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Optional API + pretrained weights (dev proxy to port 3001):

```bash
node server/generate-models.js
cd server && npm install && npm start
```

## Docker (production)

```bash
docker build -t modelarena .
docker run -p 3001:3001 modelarena
# → http://localhost:3001
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production frontend build |
| `npm run lint` | ESLint |
| `npm run test:engines` | Smoke-test all 5 game engines |
| `npm run generate-models` | Write placeholder TF.js weights to `server/models/` |

## Games

| Game | Mode | Inputs | Actions |
|------|------|--------|---------|
| Snake | RL (DQN) | 20 | 4 |
| Flappy Bird | RL | 6 | 2 |
| CartPole | RL | 4 | 2 |
| 2048 | RL | 20 | 4 |
| Chess | Supervised eval | 780 | 1 |

## Features

- Visual model builder with drag-and-drop layers
- Double DQN training with live charts
- Playback: AI, human, and versus modes
- Leaderboard with comparison charts and export
- IndexedDB model persistence + optional Express static server

## License

MIT
