import fs from 'node:fs/promises';
import path from 'node:path';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class PoliteFetcher {
  constructor({ cacheDir, fetchFn = fetch, sleepFn = wait, delayMs = 1000, timeoutMs = 10000, userAgent }) {
    this.cacheDir = cacheDir; this.fetchFn = fetchFn; this.sleepFn = sleepFn;
    this.delayMs = delayMs; this.timeoutMs = timeoutMs; this.userAgent = userAgent;
    this.lastRequestAt = 0; this.pagesFetched = 0; this.cacheHits = 0;
  }
  async readCache(filename) {
    const file = path.join(this.cacheDir, filename);
    try { const [text, stat] = await Promise.all([fs.readFile(file, 'utf8'), fs.stat(file)]); this.cacheHits += 1; return { text, fetchedAt: stat.mtime.toISOString(), fromCache: true }; }
    catch (error) { if (error.code !== 'ENOENT') throw error; return null; }
  }
  async throttle() { const remaining = this.delayMs - (Date.now() - this.lastRequestAt); if (remaining > 0) await this.sleepFn(remaining); }
  async request(url, attempt = 1) {
    await this.throttle(); this.lastRequestAt = Date.now(); let response;
    try { response = await this.fetchFn(url, { headers: { 'User-Agent': this.userAgent, Accept: 'text/html' }, signal: AbortSignal.timeout(this.timeoutMs) }); }
    catch (error) { if (attempt === 1) { await this.sleepFn(this.delayMs); return this.request(url, 2); } throw new Error(`request failed after one retry: ${error.message}`); }
    if (response.status >= 500 && attempt === 1) { await this.sleepFn(this.delayMs); return this.request(url, 2); }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    this.pagesFetched += 1; return { text: await response.text(), fetchedAt: new Date().toISOString(), fromCache: false };
  }
  async get(url, filename) {
    await fs.mkdir(this.cacheDir, { recursive: true }); const cached = await this.readCache(filename); if (cached) return cached;
    const result = await this.request(url); await fs.writeFile(path.join(this.cacheDir, filename), result.text); return result;
  }
}
