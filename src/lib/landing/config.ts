import { z } from 'zod';
import { BeforeAfterExampleSchema } from './types';

const examplesData = [
  {
    beforeImage: "/images/landing/example1-before.webp",
    afterImage: "/images/landing/example1-after.webp",
    product: "Wireless Headphones",
    category: "Electronics"
  },
  {
    beforeImage: "/images/landing/example2-before.webp",
    afterImage: "/images/landing/example2-after.webp",
    product: "Coffee Mug",
    category: "Kitchenware"
  },
  {
    beforeImage: "/images/landing/example3-before.webp",
    afterImage: "/images/landing/example3-after.webp",
    product: "Leather Wallet",
    category: "Accessories"
  }
] as const;

// Validate the examples at build time
const validatedExamples = z.array(BeforeAfterExampleSchema).parse(examplesData);

export const landingConfig = {
  examples: validatedExamples,
  openGraphImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png",
} as const;