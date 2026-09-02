import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';

test('health reports a live Node runtime', async () => {
  const response = await request(createApp()).get('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', runtime: 'node' });
});

test('echo demonstrates the request-response loop', async () => {
  const response = await request(createApp()).post('/echo').send({ message: 'hello backend' });
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { received: { message: 'hello backend' } });
});
