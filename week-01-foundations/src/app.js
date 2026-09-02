import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.get('/', (_req, res) => res.json({ name: 'Backend Foundations API', version: '1.0' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', runtime: 'node' }));
  app.post('/echo', (req, res) => res.status(200).json({ received: req.body }));
  return app;
}
