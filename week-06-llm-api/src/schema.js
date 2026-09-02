import { z } from 'zod';
export const inputSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(2000), price: z.number().nonnegative(), rating: z.number().int().min(1).max(5) }).strict();
export const outputSchema = z.object({ category: z.enum(['fiction','nonfiction','technology','business','other']), summary: z.string().min(1).max(160), quality_flags: z.array(z.enum(['missing_context','suspicious_price','low_rating','none'])).min(1), confidence: z.number().min(0).max(1) }).strict();
