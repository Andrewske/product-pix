import { z } from 'zod';

export const BeforeAfterExampleSchema = z.object({
  beforeImage: z.string().min(1, 'Before image path is required'),
  afterImage: z.string().min(1, 'After image path is required'),
  product: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
});

export type BeforeAfterExample = z.infer<typeof BeforeAfterExampleSchema>;