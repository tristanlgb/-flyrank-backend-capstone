import express from 'express';
import { inputSchema } from './schema.js';
import { enrichBook, isTimeout } from './llm.js';

export function createApp(options = {}) {
  const app = express();
  app.use(express.json({ limit: '20kb' }));
  app.get('/health', (_request, response) => response.json({ status: 'ok' }));
  app.post('/ai/enrich-book', async (request, response, next) => {
    const parsed = inputSchema.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: 'Invalid input', fields: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })) });
    try {
      const result = await (options.enrichBook || enrichBook)(parsed.data);
      return result ? response.json(result) : response.status(422).json({ error: 'Model output failed validation after one repair attempt' });
    } catch (error) { return next(error); }
  });
  app.use((error, _request, response, _next) => {
    if (isTimeout(error)) return response.status(504).json({ error: 'AI provider timed out', retryable: true });
    const retryable = error?.status === 429 || error?.status >= 500;
    return response.status(503).json({ error: 'AI provider unavailable', retryable });
  });
  return app;
}
