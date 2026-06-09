# ModelArena

Build, train, and battle your own neural networks against classic games — entirely in the browser.

**Live app:** [https://newarena.vercel.app](https://newarena.vercel.app)  
**Repository:** [https://github.com/Dhruv123-123/ModelArena](https://github.com/Dhruv123-123/ModelArena)  
**Architecture:** [docs/STACK.md](./docs/STACK.md)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.x-FF6F00?logo=tensorflow&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss&logoColor=white)

## Quick start (local)

```bash
git clone https://github.com/Dhruv123-123/ModelArena.git
cd ModelArena
npm install
npm run dev          # http://localhost:5173
```

## Verify everything works

```bash
npm run lint
npm run test:engines   # all 5 game engines
npm run build
```

## Docker (full stack + API)

```bash
docker build -t modelarena .
docker run -p 3001:3001 modelarena
# → http://localhost:3001
```

## Deploy

| Platform | How |
|----------|-----|
| **Vercel** (current live) | `npx vercel --prod` or connect the GitHub repo in [Vercel Dashboard](https://vercel.com) |
| **GitHub Pages** | Push to `main` — `.github/workflows/deploy.yml` publishes `dist` |
| **Docker** | Any host that runs the image on port 3001 |

Pretrained model weights ship in `public/models/` and are served statically (no backend required for training or playback).

## Games

| Game | Mode | Inputs | Actions |
|------|------|--------|---------|
| Snake | RL (Double DQN) | 20 | 4 |
| Flappy Bird | RL | 6 | 2 |
| CartPole | RL | 4 | 2 |
| 2048 | RL | 20 | 4 |
| Chess | Supervised eval | 780 | 1 |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:engines` | Engine smoke tests |
| `npm run generate-models` | Regenerate placeholder TF.js weights |

## License

MIT
