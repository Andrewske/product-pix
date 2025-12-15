import { z } from 'zod';

export const jobMetadataSchema = z.object({
  template_slug: z.string(),
  status: z.string(),
  credits_charged: z.number(),
  error_message: z.string().nullable().optional(),
  prompt: z.string(),
});

export const transactionMetadataSchema = z.object({
  transaction_type: z.string(),
  amount: z.number(),
  description: z.string().nullable().optional(),
  balance_after: z.number(),
});

export const messageMetadataSchema = z.object({
  content: z.string(),
  is_from_admin: z.boolean(),
  read_at: z.string().nullable().optional(),
});

export const imageMetadataSchema = z.object({
  file_key: z.string(),
  public_url: z.string(),
  is_favorite: z.boolean().optional(),
});

export const feedbackMetadataSchema = z.object({
  feedback_type: z.string(),
  comment: z.string().nullable().optional(),
  reasons: z.array(z.string()).optional(),
  image_id: z.string(),
});

export const errorMetadataSchema = z.object({
  error_name: z.string(),
  error_message: z.string(),
  domain: z.string(),
  severity: z.string(),
  resolved_at: z.string().nullable().optional(),
});

export const uploadMetadataSchema = z.object({
  filename: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
});

export const activityMetadataSchema = z.record(z.string(), z.unknown());

export const metadataSchemas = {
  job: jobMetadataSchema,
  transaction: transactionMetadataSchema,
  message: messageMetadataSchema,
  image: imageMetadataSchema,
  feedback: feedbackMetadataSchema,
  error: errorMetadataSchema,
  upload: uploadMetadataSchema,
  activity: activityMetadataSchema,
} as const;