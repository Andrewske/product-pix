import { ProductPixError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error-client';
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
      captureError(messageOrError).catch(console.error);
    }
    // Plain strings and generic Errors are NOT tracked
    // Note: captureError already logs to console, no need for additional logging
  },

  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};