import { z } from 'zod';

export const BeforeAfterExampleSchema = z.object({
  beforeImage: z.string().url('Invalid before image URL'),
  afterImage: z.string().url('Invalid after image URL'),
  product: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
});

export type BeforeAfterExample = z.infer<typeof BeforeAfterExampleSchema>;