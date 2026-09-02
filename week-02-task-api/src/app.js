import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { MemoryTaskStore } from './store.js';
import { openapi } from './openapi.js';

const parseId = (value) => Number.parseInt(value, 10);
const error = (res, status, message) => res.status(status).json({ error: message });
const validTitle = (value) => typeof value === 'string' && value.trim().length > 0;

export function createApp(store = new MemoryTaskStore()) {
  const app = express();
  app.use(express.json());
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  app.get('/', (_req, res) => res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks', '/docs'] }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/tasks', (req, res) => {
    const done = req.query.done === undefined ? undefined : req.query.done === 'true';
    res.json(store.all({ done, search: req.query.search }));
  });
  app.get('/tasks/:id', (req, res) => {
    const task = store.find(parseId(req.params.id));
    return task ? res.json(task) : error(res, 404, `Task ${req.params.id} not found`);
  });
  app.post('/tasks', (req, res) => {
    if (!validTitle(req.body?.title)) return error(res, 400, 'title is required and must not be empty');
    return res.status(201).json(store.create(req.body.title.trim()));
  });
  app.put('/tasks/:id', (req, res) => {
    const body = req.body ?? {};
    const hasTitle = Object.hasOwn(body, 'title'); const hasDone = Object.hasOwn(body, 'done');
    if ((!hasTitle && !hasDone) || (hasTitle && !validTitle(body.title)) || (hasDone && typeof body.done !== 'boolean')) return error(res, 400, 'body must contain a non-empty title and/or boolean done');
    const task = store.update(parseId(req.params.id), { ...(hasTitle && { title: body.title.trim() }), ...(hasDone && { done: body.done }) });
    return task ? res.json(task) : error(res, 404, `Task ${req.params.id} not found`);
  });
  app.delete('/tasks/:id', (req, res) => store.delete(parseId(req.params.id)) ? res.status(204).end() : error(res, 404, `Task ${req.params.id} not found`));
  app.get('/stats', (_req, res) => res.json(store.stats()));
  app.post('/reset', (_req, res) => res.json(store.reset()));
  app.use((_req, res) => error(res, 404, 'Route not found'));
  app.use((err, _req, res, _next) => err instanceof SyntaxError ? error(res, 400, 'Invalid JSON body') : error(res, 500, 'Internal server error'));
  return app;
}
