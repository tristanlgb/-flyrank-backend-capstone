import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { callWithRetry, enrichBook } from '../src/llm.js';

const input = { title: 'Learning Node', description: 'A practical JavaScript backend guide', price: 24, rating: 5 };
const validOutput = { category: 'technology', summary: 'A practical guide to Node.js.', quality_flags: ['none'], confidence: 0.95 };
const response = (content, usage = { prompt_tokens: 20, completion_tokens: 10 }) => ({ choices: [{ message: { content } }], usage });
const quietLogger = { info() {}, warn() {} };

test('400 names invalid fields before model call', async () => {
  let calls = 0;
  const result = await request(createApp({ enrichBook: async () => { calls += 1; } })).post('/ai/enrich-book').send({ title: '' });
  assert.equal(result.status, 400);
  assert.equal(calls, 0);
  assert.ok(result.body.fields.some(field => field.field === 'title'));
});

test('stub returns controlled JSON', async () => {
  const result = await request(createApp()).post('/ai/enrich-book').send(input);
  assert.equal(result.status, 200);
  assert.equal(result.body.data.category, 'technology');
  assert.equal(result.body.meta.provider, 'stub');
});

test('422 never leaks raw model text', async () => {
  const result = await request(createApp({ enrichBook: async () => null })).post('/ai/enrich-book').send(input);
  assert.equal(result.status, 422);
  assert.equal('raw' in result.body, false);
});

test('timeout becomes a useful 504 response', async () => {
  const error = Object.assign(new Error('secret provider timeout'), { name: 'APIConnectionTimeoutError' });
  const result = await request(createApp({ enrichBook: async () => { throw error; } })).post('/ai/enrich-book').send(input);
  assert.equal(result.status, 504);
  assert.deepEqual(result.body, { error: 'AI provider timed out', retryable: true });
  assert.equal(JSON.stringify(result.body).includes('secret'), false);
});

test('401 is never retried', async () => {
  let calls = 0;
  const client = { chat: { completions: { create: async () => { calls += 1; throw Object.assign(new Error('unauthorized'), { status: 401 }); } } } };
  await assert.rejects(callWithRetry(client, { model: 'test' }, { sleep: async () => {}, logger: quietLogger }));
  assert.equal(calls, 1);
});

test('429 retries and honours Retry-After', async () => {
  let calls = 0;
  const delays = [];
  const client = { chat: { completions: { create: async () => {
    calls += 1;
    if (calls === 1) throw Object.assign(new Error('busy'), { status: 429, headers: { 'retry-after': '2' } });
    return response(JSON.stringify(validOutput));
  } } } };
  await callWithRetry(client, { model: 'test' }, { sleep: async delay => delays.push(delay), random: () => 0, logger: quietLogger });
  assert.equal(calls, 2);
  assert.deepEqual(delays, [2000]);
});

test('malformed output is repaired exactly once', async () => {
  const outputs = ['not json', JSON.stringify(validOutput)];
  let calls = 0;
  const result = await enrichBook(input, { LLM_API_KEY: 'test', LLM_MODEL: 'test-model' }, {
    call: async () => response(outputs[calls++]), logger: quietLogger
  });
  assert.equal(calls, 2);
  assert.equal(result.meta.repairs, 1);
  assert.deepEqual(result.data, validOutput);
});

test('second malformed output is quarantined with audit fields', async () => {
  const records = [];
  let calls = 0;
  const result = await enrichBook(input, { LLM_API_KEY: 'test', LLM_MODEL: 'test-model' }, {
    call: async () => { calls += 1; return response('still not json'); },
    quarantine: async record => records.push(record), logger: quietLogger
  });
  assert.equal(result, null);
  assert.equal(calls, 2);
  assert.equal(records.length, 1);
  assert.deepEqual(records[0].input, input);
  assert.equal(records[0].promptVersion, 'enrich-book-v1');
  assert.equal(records[0].raw, 'still not json');
});

test('kill switch uses deterministic fallback with zero provider calls', async () => {
  let calls = 0;
  const result = await enrichBook(input, { LLM_ENABLED: 'false', LLM_API_KEY: 'unused' }, {
    call: async () => { calls += 1; }
  });
  assert.equal(calls, 0);
  assert.equal(result.meta.provider, 'fallback');
  assert.deepEqual(result.data, await enrichBook(input, { LLM_STUB: '1' }).then(value => value.data));
});
