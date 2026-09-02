import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { LocalAuthProvider } from '../src/local-auth-provider.js';

class FakeAuthProvider {
  async signup(email) { return { id: 'user-1', email, created_at: '2026-01-01' }; }
  async login(email, password) { if (password !== 'correct-password') throw new Error('bad'); return { access_token: 'valid-token', refresh_token: 'refresh', user: { id: 'user-1', email } }; }
  async verify(token) { if (token !== 'valid-token') throw new Error('bad'); return { id: 'user-1', email: 'test@example.com', created_at: '2026-01-01' }; }
  async logout(token) { if (token !== 'valid-token') throw new Error('bad'); }
}
const app = () => createApp(new FakeAuthProvider());

test('signup validates and returns 201', async () => { assert.equal((await request(app()).post('/auth/signup').send({})).status, 400); assert.equal((await request(app()).post('/auth/signup').send({ email: 'test@example.com', password: 'password123' })).status, 201); });
test('login returns tokens and rejects bad credentials', async () => { assert.equal((await request(app()).post('/auth/login').send({ email: 'test@example.com', password: 'wrong-password' })).status, 401); assert.equal((await request(app()).post('/auth/login').send({ email: 'test@example.com', password: 'correct-password' })).body.access_token, 'valid-token'); });
test('public route is open and protected routes enforce bearer tokens', async () => { assert.equal((await request(app()).get('/public/info')).status, 200); assert.equal((await request(app()).get('/protected/profile')).status, 401); assert.equal((await request(app()).get('/protected/profile').set('Authorization', 'Bearer changed-token')).status, 401); assert.equal((await request(app()).get('/protected/profile').set('Authorization', 'Bearer valid-token')).status, 200); assert.equal((await request(app()).get('/protected/dashboard').set('Authorization', 'Bearer valid-token')).status, 200); });
test('logout is protected and returns 204', async () => { assert.equal((await request(app()).post('/auth/logout')).status, 401); assert.equal((await request(app()).post('/auth/logout').set('Authorization', 'Bearer valid-token')).status, 204); });

test('local development provider supports the complete auth lifecycle', async () => {
  const localApp = createApp(new LocalAuthProvider());
  const credentials = { email: 'local@example.com', password: 'password123' };
  assert.equal((await request(localApp).post('/auth/signup').send(credentials)).status, 201);
  const login = await request(localApp).post('/auth/login').send(credentials);
  assert.equal(login.status, 200);
  const authorization = `Bearer ${login.body.access_token}`;
  assert.equal((await request(localApp).get('/protected/profile').set('Authorization', authorization)).status, 200);
  assert.equal((await request(localApp).post('/auth/logout').set('Authorization', authorization)).status, 204);
  assert.equal((await request(localApp).get('/protected/profile').set('Authorization', authorization)).status, 401);
});
