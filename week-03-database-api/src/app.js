import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { TaskService } from './task-service.js';
import { openapi } from '../../week-02-task-api/src/openapi.js';

const error = (res, status, message) => res.status(status).json({ error: message });
const validTitle = (value) => typeof value === 'string' && value.trim().length > 0;

export function createApp(repository) {
  const service = new TaskService(repository); const app = express();
  app.use(express.json()); app.use('/docs', swaggerUi.serve, swaggerUi.setup({ ...openapi, info: { ...openapi.info, title: 'Persistent Task API', version: '2.0.0' } }));
  app.get('/', (_req, res) => res.json({ name: 'Persistent Task API', version: '2.0', endpoints: ['/tasks', '/docs'] }));
  app.get('/health', async (_req, res, next) => { try { await service.list({}); res.json({ status: 'ok' }); } catch (err) { next(err); } });
  app.get('/tasks', async (req, res, next) => { try { res.json(await service.list({ done: req.query.done === undefined ? undefined : req.query.done === 'true', search: req.query.search })); } catch (err) { next(err); } });
  app.get('/tasks/:id', async (req, res, next) => { try { const task = await service.get(Number(req.params.id)); return task ? res.json(task) : error(res, 404, `Task ${req.params.id} not found`); } catch (err) { next(err); } });
  app.post('/tasks', async (req, res, next) => { try { if (!validTitle(req.body?.title)) return error(res, 400, 'title is required and must not be empty'); return res.status(201).json(await service.create(req.body.title)); } catch (err) { next(err); } });
  app.put('/tasks/:id', async (req, res, next) => { try { const body = req.body ?? {}; const hasTitle = Object.hasOwn(body, 'title'); const hasDone = Object.hasOwn(body, 'done'); if ((!hasTitle && !hasDone) || (hasTitle && !validTitle(body.title)) || (hasDone && typeof body.done !== 'boolean')) return error(res, 400, 'body must contain a non-empty title and/or boolean done'); const task = await service.update(Number(req.params.id), { ...(hasTitle && { title: body.title.trim() }), ...(hasDone && { done: body.done }) }); return task ? res.json(task) : error(res, 404, `Task ${req.params.id} not found`); } catch (err) { next(err); } });
  app.delete('/tasks/:id', async (req, res, next) => { try { return await service.delete(Number(req.params.id)) ? res.status(204).end() : error(res, 404, `Task ${req.params.id} not found`); } catch (err) { next(err); } });
  app.get('/stats', async (_req, res, next) => { try { res.json(await service.stats()); } catch (err) { next(err); } });
  app.use((err, _req, res, _next) => { console.error(err.message); error(res, 500, 'Database operation failed'); });
  return app;
}
