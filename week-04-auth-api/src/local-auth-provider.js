import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

function hashPassword(password, salt) {
  return scryptSync(password, salt, 64);
}

export class LocalAuthProvider {
  constructor() {
    this.mode = 'local-development';
    this.usersByEmail = new Map();
    this.sessions = new Map();
  }

  async signup(email, password) {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.usersByEmail.has(normalizedEmail)) throw new Error('User already exists');
    const salt = randomBytes(16).toString('hex');
    const user = {
      id: randomUUID(),
      email: normalizedEmail,
      created_at: new Date().toISOString(),
      salt,
      passwordHash: hashPassword(password, salt),
    };
    this.usersByEmail.set(normalizedEmail, user);
    return this.publicUser(user);
  }

  async login(email, password) {
    const user = this.usersByEmail.get(email.trim().toLowerCase());
    if (!user) throw new Error('Invalid login credentials');
    const candidate = hashPassword(password, user.salt);
    if (!timingSafeEqual(candidate, user.passwordHash)) throw new Error('Invalid login credentials');
    const accessToken = randomBytes(32).toString('hex');
    this.sessions.set(accessToken, user);
    return { access_token: accessToken, refresh_token: null, user: this.publicUser(user) };
  }

  async verify(token) {
    const user = this.sessions.get(token);
    if (!user) throw new Error('Invalid token');
    return this.publicUser(user);
  }

  async logout(token) {
    if (!this.sessions.delete(token)) throw new Error('Invalid token');
  }

  publicUser(user) {
    return { id: user.id, email: user.email, created_at: user.created_at };
  }
}
