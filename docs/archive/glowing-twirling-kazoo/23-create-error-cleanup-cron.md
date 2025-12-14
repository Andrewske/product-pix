# Create Error Cleanup Cron Job

## Files to Modify/Create
- `src/app/api/cron/cleanup-errors/route.ts` (new)
- `vercel.json` (modify)

## Implementation Details

### Cleanup Cron Route

Create `src/app/api/cron/cleanup-errors/route.ts`:

```typescript
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
    const { count: criticalDeleted, error: criticalError } = await supabase
      .from('critical_errors')
      .delete()
      .lt('created_at', cutoffDate)
      .not('resolved_at', 'is', null) // Only delete resolved errors
      .select('*', { count: 'exact', head: true });

    if (criticalError) {
      logger.error('Failed to cleanup critical_errors', { error: criticalError });
    }

    // Delete reviewed observability failures older than 90 days
    const { count: failuresDeleted, error: failuresError } = await supabase
      .from('observability_failures')
      .delete()
      .lt('created_at', cutoffDate)
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
```

### Update Vercel Cron Configuration

Update `vercel.json` to add weekly cleanup cron:

```json
{
  "crons": [
    {
      "path": "/api/batch/poll-gemini",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-errors",
      "schedule": "0 3 * * 0"
    }
  ]
}
```

**Schedule**: `0 3 * * 0` = Every Sunday at 3:00 AM UTC

## Design Decisions

### Retention Policy
- **90 days** for resolved/reviewed entries
- Only deletes entries that have been handled (resolved_at or reviewed_at not null)
- Unresolved errors are kept indefinitely until addressed

### Weekly Schedule
- Runs once per week (Sunday 3am UTC)
- Low-frequency to minimize DB load
- Enough to prevent unbounded table growth

### Safety
- Only deletes old AND resolved/reviewed entries
- Critical unresolved errors remain until explicitly resolved
- Observability failures remain until reviewed

## Acceptance Criteria
- [ ] Cleanup route created at `/api/cron/cleanup-errors`
- [ ] Deletes resolved critical_errors older than 90 days
- [ ] Deletes reviewed observability_failures older than 90 days
- [ ] Does NOT delete unresolved/unreviewed entries
- [ ] Returns count of deleted entries
- [ ] Logs cleanup results
- [ ] Vercel cron configured for weekly run (Sunday 3am)
- [ ] Route handles errors gracefully

## Dependencies
- Task 05 (database migrations)
- Task 06 (database query setup)
