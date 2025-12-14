import { z } from 'zod';

export const BaseErrorContextSchema = z.object({
  userId: z.string().optional(),
  requestId: z.string().optional(),
  route: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  duration: z.number().optional(),
  tags: z.array(z.string()).optional(),
  environment: z.string().optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  originalError: z.string().optional(),
  stack: z.string().optional(),
});

export const PaymentErrorContextSchema = BaseErrorContextSchema.extend({
  amount: z.number().nonnegative(),
  currency: z.string().length(3).toLowerCase().default('usd'),
  paymentIntentId: z.string().optional(),
  stripeErrorCode: z.string().optional(),
});

export const CreditErrorContextSchema = BaseErrorContextSchema.extend({
  amount: z.number().nonnegative(),
  operation: z.enum(['consume', 'add', 'refund']),
  balanceBefore: z.number().optional(),
  balanceAfter: z.number().optional(),
});

export const GenerationErrorContextSchema = BaseErrorContextSchema.extend({
  templateSlug: z.string(),
  creditsConsumed: z.number().nonnegative(),
  creditAmount: z.number().optional(),
  retryable: z.boolean().optional(),
});

export const AuthErrorContextSchema = BaseErrorContextSchema.extend({
  authMethod: z.enum(['oauth', 'email', 'magic_link']),
  provider: z.enum(['google', 'github', 'gitlab']).optional(),
  emailDomain: z.string().optional(),
});

export const RateLimitErrorContextSchema = BaseErrorContextSchema.extend({
  limit: z.number(),
  remaining: z.number(),
  resetAt: z.string().datetime(),
});

export const ValidationErrorContextSchema = BaseErrorContextSchema.extend({
  field: z.string(),
  validationRule: z.string(),
});