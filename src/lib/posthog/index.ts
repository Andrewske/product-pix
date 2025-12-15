// Client-safe exports only
export { posthog, getPostHog } from './client';
export { sanitizeForPostHog } from './sanitize';
export { getPostHogEvents, type PostHogEvent } from './api';

// Server-only code requires explicit import:
// import { getPostHogServer } from '@/lib/posthog/server';