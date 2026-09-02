import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

const TARGET_URL = 'https://quotes.toscrape.com/js/';
const outputPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'output', 'browser-comparison.json');

function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

function mb(bytes) {
  return Number((bytes / 1024 / 1024).toFixed(2));
}

async function benchmarkHttp() {
  const memoryBefore = process.memoryUsage().rss;
  const start = process.hrtime.bigint();
  const response = await fetch(TARGET_URL, {
    headers: { 'user-agent': 'FlyRankBrowserComparison/1.0 (educational assignment)' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`HTTP benchmark returned ${response.status}`);
  const html = await response.text();
  const quoteCount = cheerio.load(html)('.quote').length;

  return {
    strategy: 'plain HTTP fetch + Cheerio',
    elapsed_ms: Number(elapsedMs(start).toFixed(2)),
    node_rss_delta_mb: mb(Math.max(0, process.memoryUsage().rss - memoryBefore)),
    response_bytes: Buffer.byteLength(html),
    quote_count: quoteCount,
    result: quoteCount === 0 ? 'HTML downloaded, but JavaScript-rendered quotes are absent' : 'quotes found',
  };
}

async function benchmarkPlaywright() {
  const memoryBefore = process.memoryUsage().rss;
  const start = process.hrtime.bigint();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.locator('.quote').first().waitFor({ timeout: 10_000 });
    const quoteCount = await page.locator('.quote').count();
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    const { metrics } = await client.send('Performance.getMetrics');
    const rendererHeap = metrics.find(({ name }) => name === 'JSHeapUsedSize')?.value ?? 0;

    return {
      strategy: 'Playwright + headless Chromium',
      elapsed_ms: Number(elapsedMs(start).toFixed(2)),
      node_rss_delta_mb: mb(Math.max(0, process.memoryUsage().rss - memoryBefore)),
      renderer_js_heap_mb: mb(rendererHeap),
      quote_count: quoteCount,
      result: 'JavaScript executed and rendered quotes were extracted',
    };
  } finally {
    await browser.close();
  }
}

const startedAt = new Date().toISOString();
const http = await benchmarkHttp();
const playwright = await benchmarkPlaywright();
const report = {
  target_url: TARGET_URL,
  measured_at: startedAt,
  iterations: 1,
  measurement_note: 'Times are end-to-end. Node RSS delta measures coordinator overhead; renderer JS heap is reported separately because Chromium runs in child processes.',
  http,
  playwright,
  conclusion: http.quote_count === 0 && playwright.quote_count > 0
    ? 'Plain HTTP is lighter and faster but incomplete for this JavaScript-rendered page; Playwright is justified when rendered content is required.'
    : 'Review the target because the expected JavaScript-rendering difference was not observed.',
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(report, null, 2));
