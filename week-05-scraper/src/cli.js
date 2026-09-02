import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { scrapeBooks } from './scraper.js';

const output = await scrapeBooks();
const destination = fileURLToPath(new URL('../output/books.json', import.meta.url));
await fs.writeFile(destination, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Collected ${output.total_books} valid books from ${output.successful_pages}/${output.requested_pages} pages.`);
if (output.failed_pages.length) console.warn('Failed pages:', output.failed_pages);
console.log(`Saved ${destination}`);
