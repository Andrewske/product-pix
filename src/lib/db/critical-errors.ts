import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { Json, Database } from '@/lib/supabase/database.types';

interface CriticalErrorData {
  userId?: string | null;
  errorName: string;
  errorMessage: string;
  errorCode: string;
  errorStack?: string | null;
  severity: Database["public"]["Enums"]["critical_errors_severity"];
  domain: Database["public"]["Enums"]["critical_errors_domain"];
  route?: string | null;
  context: Record<string, unknown>;
}

interface CriticalError extends CriticalErrorData {
  id: string;
  createdAt: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export async function saveCriticalError(data: CriticalErrorData): Promise<boolean> {
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
    return false;
  }

  return true;
}

interface GetCriticalErrorsOptions {
  limit?: number;
  beforeDate?: string;
  afterDate?: string;
  severity?: Database["public"]["Enums"]["critical_errors_severity"];
  domain?: Database["public"]["Enums"]["critical_errors_domain"];
  resolved?: 'true' | 'false' | 'all';
}

export async function getCriticalErrors(
  userId?: string,
  options: GetCriticalErrorsOptions = {}
): Promise<CriticalError[]> {
  const supabase = createAdminClient();
  const { limit: rawLimit = 50, beforeDate, afterDate, severity, domain, resolved = 'all' } = options;
  const limit = Math.min(rawLimit, 250);

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
    severity: row.severity,
    domain: row.domain,
    route: row.route,
    context: (row.context ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  }));
}

export async function resolveCriticalError(
  errorId: string,
  resolvedBy: string
): Promise<boolean> {
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
    return false;
  }

  return true;
}

export async function unresolveCriticalError(errorId: string): Promise<boolean> {
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
    return false;
  }

  return true;
}