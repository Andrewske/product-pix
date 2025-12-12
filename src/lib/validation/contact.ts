import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be 5000 characters or less'),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;