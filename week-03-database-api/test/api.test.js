import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app.js';
import { SqliteTaskRepository } from '../src/repositories/sqlite-task-repository.js';

test('SQLite CRUD preserves the Week 2 API contract', async () => {
  const repository = new SqliteTaskRepository(':memory:'); const app = createApp(repository);
  assert.equal((await request(app).get('/tasks')).body.length, 3);
  const created = await request(app).post('/tasks').send({ title: 'Persist me' });
  assert.equal(created.status, 201);
  assert.equal((await request(app).put(`/tasks/${created.body.id}`).send({ done: true })).body.done, true);
  assert.equal((await request(app).delete(`/tasks/${created.body.id}`)).status, 204);
  assert.equal((await request(app).get(`/tasks/${created.body.id}`)).status, 404);
  repository.close();
});

test('invalid bodies return 400 and unknown IDs return 404', async () => {
  const repository = new SqliteTaskRepository(':memory:'); const app = createApp(repository);
  assert.equal((await request(app).post('/tasks').send({ title: '' })).status, 400);
  assert.equal((await request(app).get('/tasks/999')).status, 404);
  repository.close();
});

test('SQLite data survives closing and reopening the database', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'flyrank-sqlite-'));
  const filename = path.join(directory, 'tasks.db');
  const first = new SqliteTaskRepository(filename);
  const created = await first.create('Still here after restart');
  first.close();
  const reopened = new SqliteTaskRepository(filename);
  assert.equal((await reopened.find(created.id)).title, 'Still here after restart');
  reopened.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
