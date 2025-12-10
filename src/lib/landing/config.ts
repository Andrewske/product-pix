import { z } from 'zod';
import { BeforeAfterExampleSchema } from './types';

const examplesData = [
  {
    beforeImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/ffb69068ef4b0e9511d6198bc12b0068fe65a5365c6339f22c3ec2cc1ce1222e.jpg",
    afterImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png",
    product: "Peanut Butter Jar",
    category: "Food/Consumer"
  }
] as const;

// Validate the examples at build time
const validatedExamples = z.array(BeforeAfterExampleSchema).parse(examplesData);

export const landingConfig = {
  examples: validatedExamples,
  openGraphImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png",
} as const;