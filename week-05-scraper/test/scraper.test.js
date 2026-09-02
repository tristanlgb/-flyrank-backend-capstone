import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBooks, scrapeBooks } from '../src/scraper.js';
import { isAllowedByRobots } from '../src/robots.js';

const card = (title = 'A Book') => `<article class="product_pod"><p class="star-rating Four"></p><h3><a href="a-book_1/index.html" title="${title}">${title}</a></h3><p class="price_color">£51.77</p><p class="availability">In stock</p></article>`;
test('parses and normalizes messy HTML into checked data', () => { const books = parseBooks(card(), 'https://books.toscrape.com/catalogue/page-1.html'); assert.deepEqual(books[0], { title: 'A Book', price_gbp: 51.77, available: true, rating: 4, source_url: 'https://books.toscrape.com/catalogue/a-book_1/index.html' }); });
test('robots rules are respected', () => { assert.equal(isAllowedByRobots('User-agent: *\nDisallow: /private', '/private/data'), false); assert.equal(isAllowedByRobots('User-agent: *\nDisallow: /private', '/catalogue'), true); });
test('one broken page is reported without losing successful pages', async () => {
  const fetchFn = async (url) => {
    if (url.pathname === '/robots.txt') return new Response('', { status: 404 });
    if (url.pathname.includes('page-2')) return new Response('broken', { status: 500 });
    return new Response(card(`Book ${url.pathname}`), { status: 200 });
  };
  const result = await scrapeBooks({ pages: 3, delayMs: 0, fetchFn, sleepFn: async () => {} });
  assert.equal(result.total_books, 2); assert.equal(result.successful_pages, 2); assert.deepEqual(result.failed_pages, [{ page: 2, error: 'HTTP 500' }]);
});
