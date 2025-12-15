// Export types (safe everywhere)
export type { CaptureErrorOptions, PostHogErrorProperties } from './types';

// Server-side capture (default for backward compatibility)
export { captureError } from './capture-error';

// Client must use: import { captureError } from '@/lib/observability/capture-error-client';