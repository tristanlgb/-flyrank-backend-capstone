import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string().min(1),
  price_gbp: z.number().nonnegative(),
  available: z.boolean(),
  rating: z.int().min(1).max(5),
  source_url: z.url()
});

export const scrapeResultSchema = z.object({
  source: z.url(),
  collected_at: z.iso.datetime(),
  requested_pages: z.int().positive(),
  successful_pages: z.int().nonnegative(),
  failed_pages: z.array(z.object({ page: z.int().positive(), error: z.string() })),
  total_books: z.int().nonnegative(),
  books: z.array(bookSchema)
});
