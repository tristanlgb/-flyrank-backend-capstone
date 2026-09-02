import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { PoliteFetcher } from '../src/cache.js';
import { discoverCatalogue, extractRawBook, normalizeBook, scrapeBooks } from '../src/scraper.js';
import { bookSchema } from '../src/book-schema.js';
import { isAllowedByRobots } from '../src/robots.js';

const catalogue = (number, next = null) => `<html><body>
  <article class="product_pod"><h3><a href="book-${number}/index.html">Book</a></h3></article>
  <ul class="pager">${next ? `<li class="next"><a href="${next}">next</a></li>` : ''}</ul>
</body></html>`;
const detail = ({ description = 'Useful description', price = '£51.77' } = {}) => `<html><body>
  <div class="product_main"><h1>A Light in the Attic</h1><p class="price_color">${price}</p><p class="availability"> In stock (22 available) </p><p class="star-rating Three"></p></div>
  ${description === null ? '' : `<div id="product_description"></div><p>${description}</p>`}
</body></html>`;

test('catalogue discovery resolves absolute URLs and follows next', () => {
  const page = discoverCatalogue(catalogue(1, 'page-2.html'), new URL('https://books.toscrape.com/catalogue/page-1.html'));
  assert.equal(page.books[0].product_url, 'https://books.toscrape.com/catalogue/book-1/index.html');
  assert.equal(page.nextUrl.href, 'https://books.toscrape.com/catalogue/page-2.html');
});

test('detail extraction preserves eight raw provenance fields', () => {
  const raw = extractRawBook(detail(), 'https://books.toscrape.com/catalogue/book-1/index.html', 'https://books.toscrape.com/catalogue/page-1.html', '2026-09-02T00:00:00.000Z');
  assert.equal(Object.keys(raw).length, 8);
  assert.equal(raw.price_text, '£51.77');
  assert.equal(raw.source_page, 'https://books.toscrape.com/catalogue/page-1.html');
});

test('normalization converts price and rating while keeping raw values', () => {
  const raw = extractRawBook(detail(), 'https://books.toscrape.com/catalogue/book-1/index.html', 'https://books.toscrape.com/catalogue/page-1.html', '2026-09-02T00:00:00.000Z');
  const parsed = bookSchema.parse(normalizeBook(raw));
  assert.equal(parsed.price_gbp, 51.77); assert.equal(parsed.rating, 3); assert.equal(parsed.price_text, '£51.77');
});

test('missing description becomes null and malformed price fails validation', () => {
  const raw = extractRawBook(detail({ description: null, price: 'unknown' }), 'https://books.toscrape.com/catalogue/book-1/index.html', 'https://books.toscrape.com/catalogue/page-1.html', '2026-09-02T00:00:00.000Z');
  assert.equal(raw.description, null);
  assert.equal(bookSchema.safeParse(normalizeBook(raw)).success, false);
});

test('robots rules are respected', () => {
  assert.equal(isAllowedByRobots('User-agent: *\nDisallow: /private', '/private/data'), false);
  assert.equal(isAllowedByRobots('User-agent: *\nDisallow: /private', '/catalogue/'), true);
});

test('fetcher caches successful responses and does not request twice', async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flyrank-cache-')); let calls = 0;
  const fetcher = new PoliteFetcher({ cacheDir, userAgent: 'test', delayMs: 0, sleepFn: async () => {}, fetchFn: async () => { calls += 1; return new Response('cached html'); } });
  await fetcher.get(new URL('https://example.com/page'), 'page.html');
  await fetcher.get(new URL('https://example.com/page'), 'page.html');
  assert.equal(calls, 1); assert.equal(fetcher.cacheHits, 1);
  await fs.rm(cacheDir, { recursive: true, force: true });
});

test('fetcher retries 5xx once but never retries 404', async () => {
  const cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'flyrank-retry-')); let calls500 = 0; let calls404 = 0;
  const retrying = new PoliteFetcher({ cacheDir, userAgent: 'test', delayMs: 0, sleepFn: async () => {}, fetchFn: async () => new Response(calls500++ === 0 ? 'no' : 'ok', { status: calls500 === 1 ? 500 : 200 }) });
  assert.equal((await retrying.get(new URL('https://example.com/retry'), 'retry.html')).text, 'ok'); assert.equal(calls500, 2);
  const notFound = new PoliteFetcher({ cacheDir, userAgent: 'test', delayMs: 0, sleepFn: async () => {}, fetchFn: async () => { calls404 += 1; return new Response('no', { status: 404 }); } });
  await assert.rejects(notFound.get(new URL('https://example.com/missing'), 'missing.html'), /HTTP 404/); assert.equal(calls404, 1);
  await fs.rm(cacheDir, { recursive: true, force: true });
});

test('pipeline keeps valid books and reports one deliberately broken URL', async () => {
  const responses = new Map([
    ['/catalogue/page-1.html', catalogue(1, 'page-2.html')],
    ['/catalogue/page-2.html', catalogue(2, 'page-3.html')],
    ['/catalogue/page-3.html', catalogue(3)],
    ['/catalogue/book-1/index.html', detail()],
    ['/catalogue/book-2/index.html', detail()],
    ['/catalogue/book-3/index.html', detail()]
  ]);
  const fetcher = { userAgent: 'test', pagesFetched: 0, cacheHits: 0, async get(url) { if (url.pathname === '/robots.txt') throw new Error('HTTP 404'); const html = responses.get(url.pathname); if (!html) throw new Error('HTTP 404'); return { text: html, fetchedAt: '2026-09-02T00:00:00.000Z' }; } };
  const result = await scrapeBooks({ catalogueLimit: 3, injectBrokenUrl: true, fetcher });
  assert.equal(result.books.length, 3); assert.equal(result.report.failed_pages, 1); assert.equal(result.errors.length, 1);
});
