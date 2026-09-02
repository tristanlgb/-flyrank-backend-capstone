import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { scrapeBooks } from './scraper.js';

const injectBrokenUrl = process.argv.includes('--inject-broken-url');
const outputDir = fileURLToPath(new URL('../output/', import.meta.url));
await fs.mkdir(outputDir, { recursive: true });
const result = await scrapeBooks({ injectBrokenUrl });
await Promise.all([
  fs.writeFile(`${outputDir}books.json`, `${JSON.stringify(result.books, null, 2)}\n`),
  fs.writeFile(`${outputDir}errors.json`, `${JSON.stringify(result.errors, null, 2)}\n`),
  fs.writeFile(`${outputDir}${injectBrokenUrl ? 'failure-proof-report.json' : 'run-report.json'}`, `${JSON.stringify(result.report, null, 2)}\n`)
]);
console.log(`catalogue_pages=${result.report.catalogue_pages} discovered=${result.report.discovered_urls} unique_urls=${result.report.unique_urls}`);
console.log(`valid=${result.report.valid_records} failed_pages=${result.report.failed_pages} fetched=${result.report.pages_fetched} cache_hits=${result.report.cache_hits}`);
