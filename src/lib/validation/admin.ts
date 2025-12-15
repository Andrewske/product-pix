import { z } from 'zod';

export const userListQuerySchema = z.object({
  search: z.string().max(255).optional(),
  hasErrors: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  hasMessages: z.string().optional().transform(val => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }),
  minCredits: z.coerce.number().int().min(0).optional(),
  maxCredits: z.coerce.number().int().min(0).optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  sortBy: z.enum(['created_at', 'last_active', 'credit_balance']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type UserListQueryParams = z.infer<typeof userListQuerySchema>;