import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { MemoryTaskStore } from '../src/store.js';

const setup = () => createApp(new MemoryTaskStore());

test('root and health return JSON', async () => {
  assert.equal((await request(setup()).get('/')).status, 200);
  assert.deepEqual((await request(setup()).get('/health')).body, { status: 'ok' });
});

test('reads list, one task, and 404 JSON', async () => {
  assert.equal((await request(setup()).get('/tasks')).body.length, 3);
  assert.equal((await request(setup()).get('/tasks/1')).status, 200);
  assert.deepEqual((await request(setup()).get('/tasks/99')).body, { error: 'Task 99 not found' });
});

test('creates, validates, updates, and deletes', async () => {
  const app = setup();
  const created = await request(app).post('/tasks').send({ title: 'Buy milk' });
  assert.equal(created.status, 201);
  assert.equal((await request(app).post('/tasks').send({})).status, 400);
  const updated = await request(app).put(`/tasks/${created.body.id}`).send({ done: true });
  assert.equal(updated.body.done, true);
  assert.equal((await request(app).delete(`/tasks/${created.body.id}`)).status, 204);
  assert.equal((await request(app).get(`/tasks/${created.body.id}`)).status, 404);
});

test('filters, searches, reports stats, and resets', async () => {
  const app = setup();
  assert.equal((await request(app).get('/tasks?done=true')).body.length, 1);
  assert.equal((await request(app).get('/tasks?search=crud')).body.length, 1);
  assert.deepEqual((await request(app).get('/stats')).body, { total: 3, done: 1, open: 2 });
  assert.equal((await request(app).post('/reset')).body.length, 3);
});
