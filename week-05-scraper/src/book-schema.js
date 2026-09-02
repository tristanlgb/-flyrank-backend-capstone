import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string().min(1),
  product_url: z.url().startsWith('https://'),
  price_text: z.string().min(1),
  availability_text: z.string().min(1),
  rating_text: z.enum(['One', 'Two', 'Three', 'Four', 'Five']),
  description: z.string().min(1).nullable(),
  source_page: z.url().startsWith('https://'),
  fetched_at: z.iso.datetime(),
  price_gbp: z.number().nonnegative(),
  available: z.boolean(),
  rating: z.int().min(1).max(5)
});

export const errorRecordSchema = z.object({
  url: z.url(),
  stage: z.enum(['fetch', 'extract', 'validate']),
  reason: z.string().min(1)
});

export const runReportSchema = z.object({
  started_at: z.iso.datetime(), finished_at: z.iso.datetime(), duration_ms: z.int().nonnegative(),
  catalogue_pages: z.int().nonnegative(), discovered_urls: z.int().nonnegative(), unique_urls: z.int().nonnegative(),
  pages_fetched: z.int().nonnegative(), cache_hits: z.int().nonnegative(), valid_records: z.int().nonnegative(),
  invalid_records: z.int().nonnegative(), failed_pages: z.int().nonnegative(), robots_result: z.string().min(1)
});
