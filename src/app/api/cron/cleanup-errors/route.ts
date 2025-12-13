import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';

const RETENTION_DAYS = 90;

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = createAdminClient();
    const cutoffDate = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    // Delete resolved critical errors older than 90 days
    const { count: criticalDeleted, error: criticalError } = await (supabase
      .from('critical_errors')
      .delete()
      .lt('created_at', cutoffDate) as any)
      .not('resolved_at', 'is', null) // Only delete resolved errors
      .select('*', { count: 'exact', head: true });

    if (criticalError) {
      logger.error('Failed to cleanup critical_errors', { error: criticalError });
    }

    // Delete reviewed observability failures older than 90 days
    const { count: failuresDeleted, error: failuresError } = await (supabase
      .from('observability_failures')
      .delete()
      .lt('created_at', cutoffDate) as any)
      .not('reviewed_at', 'is', null) // Only delete reviewed failures
      .select('*', { count: 'exact', head: true });

    if (failuresError) {
      logger.error('Failed to cleanup observability_failures', { error: failuresError });
    }

    logger.info('Error cleanup completed', {
      criticalDeleted: criticalDeleted ?? 0,
      failuresDeleted: failuresDeleted ?? 0,
      cutoffDate,
    });

    return NextResponse.json({
      success: true,
      deleted: {
        critical_errors: criticalDeleted ?? 0,
        observability_failures: failuresDeleted ?? 0,
      },
      cutoffDate,
    });

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