import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { Json } from '@/lib/supabase/database.types';

interface ObservabilityFailureData {
  errorData: Record<string, unknown>;
  failureReason: string;
  occurredAt?: string;
}

export async function saveObservabilityFailure(data: ObservabilityFailureData): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('observability_failures').insert({
    error_data: data.errorData as Json,
    failure_reason: data.failureReason,
    occurred_at: data.occurredAt ?? new Date().toISOString(),
  });

  if (error) {
    // Last resort - just log, don't throw
    logger.error('Failed to save observability failure', { error, data });
  }
}