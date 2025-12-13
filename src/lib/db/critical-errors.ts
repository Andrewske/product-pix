import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { Json } from '@/lib/supabase/database.types';

interface CriticalErrorData {
  userId?: string | null;
  errorName: string;
  errorMessage: string;
  errorCode: string;
  errorStack?: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  domain: 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system';
  route?: string | null;
  context: Record<string, unknown>;
}

interface CriticalError extends CriticalErrorData {
  id: string;
  createdAt: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export async function saveCriticalError(data: CriticalErrorData): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from('critical_errors').insert({
    user_id: data.userId,
    error_name: data.errorName,
    error_message: data.errorMessage,
    error_code: data.errorCode,
    error_stack: data.errorStack,
    severity: data.severity,
    domain: data.domain,
    route: data.route,
    context: data.context as Json,
  });

  if (error) {
    logger.error('Failed to save critical error', { error, data });
  }
}

interface GetCriticalErrorsOptions {
  limit?: number;
  beforeDate?: string;
  afterDate?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  domain?: string;
  resolved?: 'true' | 'false' | 'all';
}

export async function getCriticalErrors(
  userId?: string,
  options: GetCriticalErrorsOptions = {}
): Promise<CriticalError[]> {
  const supabase = createAdminClient();
  const { limit = 50, beforeDate, afterDate, severity, domain, resolved = 'all' } = options;

  let query = supabase
    .from('critical_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (beforeDate) {
    query = query.lt('created_at', beforeDate);
  }

  if (afterDate) {
    query = query.gt('created_at', afterDate);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (domain) {
    query = query.eq('domain', domain);
  }

  if (resolved === 'true') {
    query = query.not('resolved_at', 'is', null);
  } else if (resolved === 'false') {
    query = query.is('resolved_at', null);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to get critical errors', { error, userId, options });
    return [];
  }

  return (data ?? []).map(row => ({
    id: row.id,
    userId: row.user_id,
    errorName: row.error_name,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    errorStack: row.error_stack,
    severity: row.severity as 'critical' | 'high' | 'medium' | 'low',
    domain: row.domain as 'payment' | 'credit' | 'generation' | 'auth' | 'validation' | 'rate-limit' | 'system',
    route: row.route,
    context: row.context as Record<string, unknown>,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  }));
}

export async function resolveCriticalError(
  errorId: string,
  resolvedBy: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('critical_errors')
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', errorId);

  if (error) {
    logger.error('Failed to resolve critical error', { error, errorId, resolvedBy });
  }
}

export async function unresolveCriticalError(errorId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('critical_errors')
    .update({
      resolved_at: null,
      resolved_by: null,
    })
    .eq('id', errorId);

  if (error) {
    logger.error('Failed to unresolve critical error', { error, errorId });
  }
}