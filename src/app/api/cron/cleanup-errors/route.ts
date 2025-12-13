import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';

const RETENTION_DAYS = 90;

async function cleanupCriticalErrors(cutoffDate: string): Promise<{count: number | null, error: any}> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient();
  const { count, error } = await (supabase
    .from('critical_errors')
    .delete()
    .lt('created_at', cutoffDate) as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .not('resolved_at', 'is', null)
    .select('*', { count: 'exact', head: true });

  if (error) {
    logger.error('Failed to cleanup critical_errors', { error });
  }

  return { count, error };
}

async function cleanupObservabilityFailures(cutoffDate: string): Promise<{count: number | null, error: any}> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient();
  const { count, error } = await (supabase
    .from('observability_failures')
    .delete()
    .lt('created_at', cutoffDate) as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .not('reviewed_at', 'is', null)
    .select('*', { count: 'exact', head: true });

  if (error) {
    logger.error('Failed to cleanup observability_failures', { error });
  }

  return { count, error };
}

function getCutoffDate(): string {
  return new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
}

function createSuccessResponse(criticalCount: number, failuresCount: number, cutoffDate: string): NextResponse {
  logger.info('Error cleanup completed', {
    criticalDeleted: criticalCount,
    failuresDeleted: failuresCount,
    cutoffDate,
  });

  return NextResponse.json({
    success: true,
    deleted: {
      critical_errors: criticalCount,
      observability_failures: failuresCount,
    },
    cutoffDate,
  });
}

export async function GET(request: Request): Promise<NextResponse> {
  // Verify cron job authentication using Vercel's CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!authHeader || authHeader !== expectedAuth) {
    logger.warn('Unauthorized cron job attempt', {
      receivedAuth: authHeader ? 'present' : 'missing',
      expectedAuth: 'present',
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const cutoffDate = getCutoffDate();

    const [criticalResult, failuresResult] = await Promise.all([
      cleanupCriticalErrors(cutoffDate),
      cleanupObservabilityFailures(cutoffDate),
    ]);

    return createSuccessResponse(
      criticalResult.count ?? 0,
      failuresResult.count ?? 0,
      cutoffDate
    );

  } catch (error) {
    logger.error('Error cleanup cron failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}