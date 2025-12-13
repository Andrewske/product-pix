# Update Client-Side Error Handling

## Files to Modify/Create
- `src/components/ui/error-boundary.tsx` (modify)
- `src/app/error.tsx` (modify)

## Implementation Details

### Error Boundary

Update existing error boundary to track ProductPixError:

```typescript
import { captureError } from '@/lib/observability/capture-error';
import { ProductPixError } from '@/lib/errors/error-classes';

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('Error boundary caught:', error, errorInfo);

  // Only track if ProductPixError, otherwise just log
  if (error instanceof ProductPixError) {
    captureError(error, {
      route: window.location.pathname,
    }).catch(console.error);
  }
}
```

### Global Error Page

Update `src/app/error.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/observability/capture-error';
import { ProductPixError } from '@/lib/errors/error-classes';

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    if (error instanceof ProductPixError) {
      captureError(error, {
        route: window.location.pathname,
      }).catch(console.error);
    }
  }, [error]);

  // ... existing error UI
}
```

**Key principle:** Only track ProductPixError instances. Generic errors just get logged.

## Acceptance Criteria
- [ ] Error boundary calls captureError for ProductPixError
- [ ] Generic errors logged but not tracked
- [ ] Global error page calls captureError for ProductPixError
- [ ] Route passed in options
- [ ] Errors caught and sent to observability system
- [ ] Existing error UI preserved

## Dependencies
- Task 02 (error classes)
- Task 08 (captureError handler)
