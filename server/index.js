import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use(
  '/models',
  express.static(join(__dirname, 'models'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    },
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/models', (_req, res) => {
  res.json([
    {
      id: 'snake-snakebot-v1',
      url: '/models/snake-snakebot-v1/model.json',
      name: 'SnakeBot v1',
      gameId: 'snake',
      expectedScore: 15,
    },
    {
      id: 'cartpole-balancebot',
      url: '/models/cartpole-balancebot/model.json',
      name: 'BalanceBot',
      gameId: 'cartpole',
      expectedScore: 195,
    },
  ]);
});

const publicDir = join(__dirname, 'public');
if (existsSync(join(publicDir, 'index.html'))) {
  app.use(express.static(publicDir));
  app.get(/^(?!\/api|\/models).*/, (_req, res) => {
    res.sendFile(join(publicDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ModelArena running on :${PORT}`);
});
