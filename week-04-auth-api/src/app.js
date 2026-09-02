import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createRequireAuth } from './auth-middleware.js';
import { openapi } from './openapi.js';

const validCredentials = (body) => typeof body?.email === 'string' && body.email.includes('@') && typeof body?.password === 'string' && body.password.length >= 6;
export function createApp(provider) {
  const app = express(); const requireAuth = createRequireAuth(provider);
  app.use(express.json()); app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.get('/', (_req, res) => res.json({ name: 'Authentication API', version: '1.0', provider: provider.mode || 'injected', docs: '/docs' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', provider: provider.mode || 'injected' }));
  app.post('/auth/signup', async (req, res) => {
    if (!validCredentials(req.body)) return res.status(400).json({ error: 'Valid email and password of at least 6 characters are required' });
    try { return res.status(201).json({ user: await provider.signup(req.body.email, req.body.password) }); }
    catch (err) { return res.status(400).json({ error: err.message }); }
  });
  app.post('/auth/login', async (req, res) => {
    if (!validCredentials(req.body)) return res.status(400).json({ error: 'Valid email and password of at least 6 characters are required' });
    try { return res.json(await provider.login(req.body.email, req.body.password)); }
    catch { return res.status(401).json({ error: 'Invalid login credentials' }); }
  });
  app.get('/public/info', (_req, res) => res.json({ message: 'Welcome stranger! This info is public.' }));
  app.get('/protected/profile', requireAuth, (req, res) => res.json({ id: req.auth.user.id, email: req.auth.user.email, created_at: req.auth.user.created_at }));
  app.get('/protected/dashboard', requireAuth, (req, res) => res.json({ message: `Welcome ${req.auth.user.email}`, authenticated: true }));
  app.post('/auth/logout', requireAuth, async (req, res) => { try { await provider.logout(req.auth.token); return res.status(204).end(); } catch { return res.status(500).json({ error: 'Logout failed' }); } });
  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  return app;
}
