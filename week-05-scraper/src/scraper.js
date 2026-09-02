import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import path from 'node:path';
import { bookSchema, errorRecordSchema, runReportSchema } from './book-schema.js';
import { PoliteFetcher } from './cache.js';
import { checkRobots } from './robots.js';

const ratings = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };
const filenameForBook = (url) => `book-${crypto.createHash('sha256').update(url.href).digest('hex').slice(0, 16)}.html`;

export function discoverCatalogue(html, pageUrl) {
  const $ = cheerio.load(html);
  const books = $('article.product_pod h3 a').map((_index, element) => ({
    product_url: new URL($(element).attr('href'), pageUrl).href,
    source_page: pageUrl.href
  })).get();
  const nextHref = $('li.next a').attr('href');
  return { books, nextUrl: nextHref ? new URL(nextHref, pageUrl) : null };
}

export function extractRawBook(html, productUrl, sourcePage, fetchedAt) {
  const $ = cheerio.load(html);
  const main = $('.product_main');
  const ratingText = main.find('.star-rating').attr('class')?.split(/\s+/).find((name) => ratings[name]);
  return {
    title: main.find('h1').text().trim(),
    product_url: productUrl,
    price_text: main.find('.price_color').text().trim(),
    availability_text: main.find('.availability').text().replace(/\s+/g, ' ').trim(),
    rating_text: ratingText,
    description: $('#product_description').next('p').text().trim() || null,
    source_page: sourcePage,
    fetched_at: fetchedAt
  };
}

export function normalizeBook(raw) {
  const numericPrice = raw.price_text.replace(/[^0-9.]/g, '');
  return {
    ...raw,
    price_gbp: numericPrice ? Number(numericPrice) : Number.NaN,
    available: /in stock/i.test(raw.availability_text),
    rating: ratings[raw.rating_text]
  };
}

export async function scrapeBooks({
  baseUrl = 'https://books.toscrape.com/catalogue/page-1.html',
  catalogueLimit = 3,
  cacheDir = path.resolve('week-05-scraper/cache'),
  injectBrokenUrl = false,
  fetcher: suppliedFetcher
} = {}) {
  const startedAt = new Date();
  const fetcher = suppliedFetcher || new PoliteFetcher({
    cacheDir,
    userAgent: 'FlyRankInternship-A9/1.0 (+https://github.com/tristanlgb/-flyrank-backend-capstone)'
  });
  const robots = await checkRobots(new URL(baseUrl).origin, fetcher);
  if (!robots.allowed) throw new Error('robots.txt disallows /catalogue/');

  const discovered = [];
  let currentUrl = new URL(baseUrl);
  let cataloguePages = 0;
  while (currentUrl && cataloguePages < catalogueLimit) {
    const response = await fetcher.get(currentUrl, `catalogue-page-${cataloguePages + 1}.html`);
    const page = discoverCatalogue(response.text, currentUrl);
    discovered.push(...page.books);
    currentUrl = page.nextUrl;
    cataloguePages += 1;
  }
  const unique = [...new Map(discovered.map((item) => [item.product_url, item])).values()];
  if (injectBrokenUrl) {
    unique.push({
      product_url: new URL('/catalogue/this-book-does-not-exist/index.html', new URL(baseUrl).origin).href,
      source_page: baseUrl
    });
  }

  const books = [];
  const errors = [];
  for (const item of unique) {
    const url = new URL(item.product_url);
    try {
      const response = await fetcher.get(url, filenameForBook(url));
      const raw = extractRawBook(response.text, item.product_url, item.source_page, response.fetchedAt);
      const parsed = bookSchema.safeParse(normalizeBook(raw));
      if (parsed.success) books.push(parsed.data);
      else errors.push(errorRecordSchema.parse({ url: item.product_url, stage: 'validate', reason: parsed.error.issues.map((issue) => issue.message).join('; ') }));
    } catch (error) {
      errors.push(errorRecordSchema.parse({ url: item.product_url, stage: 'fetch', reason: error.message }));
    }
  }

  const deduplicated = [...new Map(books.map((book) => [book.product_url, book])).values()];
  const finishedAt = new Date();
  const report = runReportSchema.parse({
    started_at: startedAt.toISOString(), finished_at: finishedAt.toISOString(), duration_ms: finishedAt - startedAt,
    catalogue_pages: cataloguePages, discovered_urls: discovered.length, unique_urls: unique.length,
    pages_fetched: fetcher.pagesFetched, cache_hits: fetcher.cacheHits,
    valid_records: deduplicated.length, invalid_records: errors.filter((item) => item.stage === 'validate').length,
    failed_pages: errors.filter((item) => item.stage === 'fetch').length,
    robots_result: robots.note
  });
  return { books: deduplicated, errors, report };
}
