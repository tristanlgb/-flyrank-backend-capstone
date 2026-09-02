import * as cheerio from 'cheerio';
import { bookSchema, scrapeResultSchema } from './book-schema.js';
import { checkRobots } from './robots.js';

const ratings = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function parseBooks(html, pageUrl) {
  const $ = cheerio.load(html);
  return $('article.product_pod').map((_index, element) => {
    const card = $(element); const ratingClass = card.find('.star-rating').attr('class')?.split(/\s+/).find((name) => ratings[name]);
    const rawPrice = card.find('.price_color').text().replace(/[^0-9.]/g, '');
    const href = card.find('h3 a').attr('href');
    return bookSchema.parse({
      title: card.find('h3 a').attr('title')?.trim(),
      price_gbp: Number(rawPrice),
      available: /in stock/i.test(card.find('.availability').text()),
      rating: ratings[ratingClass],
      source_url: new URL(href, pageUrl).href
    });
  }).get();
}

export async function scrapeBooks({
  baseUrl = 'https://books.toscrape.com/catalogue/page-1.html', pages = 3,
  delayMs = 1000, fetchFn = fetch, sleepFn = sleep,
  userAgent = 'TristanLenzberg-FlyRankLearningBot/1.0 (+https://github.com/tristanlgb/-flyrank-backend-capstone)'
} = {}) {
  const origin = new URL(baseUrl).origin;
  const robots = await checkRobots(origin, fetchFn, userAgent);
  if (!robots.allowed) throw new Error('robots.txt does not allow this scraper path');
  const books = []; const failedPages = []; let successfulPages = 0;
  for (let page = 1; page <= pages; page += 1) {
    if (page > 1) await sleepFn(delayMs);
    const url = new URL(`/catalogue/page-${page}.html`, origin);
    try {
      const response = await fetchFn(url, { headers: { 'User-Agent': userAgent, Accept: 'text/html' }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = parseBooks(await response.text(), url);
      books.push(...parsed); successfulPages += 1;
    } catch (error) {
      failedPages.push({ page, error: error.message });
    }
  }
  return scrapeResultSchema.parse({ source: origin, collected_at: new Date().toISOString(), requested_pages: pages, successful_pages: successfulPages, failed_pages: failedPages, total_books: books.length, books });
}
