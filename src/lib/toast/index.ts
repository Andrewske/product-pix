import { ProductPixError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { logger } from '@/lib/logging';
import { toast as sonnerToast } from 'sonner';

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
      captureError(messageOrError).catch((captureFailure) => {
        logger.error('OBSERVABILITY_FAILURE in toast handler', {
          originalError: messageOrError.name,
          captureError: captureFailure instanceof Error ? captureFailure.message : 'Unknown',
        });
      });
    }
    // Plain strings and generic Errors are NOT tracked
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};