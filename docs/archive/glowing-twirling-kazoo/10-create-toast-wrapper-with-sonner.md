# Create Toast Wrapper with Sonner Integration

## Files to Modify/Create
- `src/lib/toast/index.ts` (new)

## Implementation Details

Create toast wrapper that integrates with Sonner and auto-tracks ProductPixError:

```typescript
import { toast as sonnerToast } from 'sonner';
import { captureError } from '@/lib/observability/capture-error';
import { ProductPixError } from '@/lib/errors/error-classes';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message);
  },

  info: (message: string) => {
    sonnerToast.info(message);
  },

  warning: (message: string) => {
    sonnerToast.warning(message);
  },

  error: (messageOrError: string | Error) => {
    const message = messageOrError instanceof Error
      ? messageOrError.message
      : messageOrError;

    sonnerToast.error(message);

    // Auto-track ProductPixError instances (intentional errors with context)
    if (messageOrError instanceof ProductPixError) {
      captureError(messageOrError).catch(console.error);
    }
    // Plain strings and generic Errors are NOT tracked
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
```

**Safe by default:**
- `toast.error(ProductPixError)` → auto-tracked
- `toast.error('string')` → NOT tracked
- `toast.error(new Error())` → NOT tracked

This prevents validation errors and user-facing messages from polluting error tracking.

## Acceptance Criteria
- [ ] Toast wrapper created with all methods (success, info, warning, error, dismiss)
- [ ] Error method shows toast for all input types
- [ ] ProductPixError instances auto-tracked via captureError()
- [ ] Plain strings and generic Errors NOT tracked
- [ ] All methods delegate to Sonner correctly

## Dependencies
- Task 02 (error classes)
- Task 08 (captureError handler)
