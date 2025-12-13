// src/app/api/test/error/route.ts
import { NextResponse } from 'next/server';
import { createPaymentError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';
import { logger } from '@/lib/logging';
import { withRequestContext } from '@/lib/request';

export const GET = withRequestContext(async () => {
  logger.info('Starting test error creation');

  // Create a critical payment error for testing
  const error = createPaymentError(
    ErrorCodes.PAYMENT_INTENT_FAILED,
    'Test critical payment error for observability testing',
    {
      severity: 'critical',
      amount: 100,
      currency: 'usd',
      paymentIntentId: 'pi_test_123',
      stripeErrorCode: 'card_declined',
    }
  );

  logger.info('Created error', {
    errorName: error.name,
    severity: error.severity,
    isCritical: error.isCritical,
    domain: error.domain,
    errorCode: error.errorCode,
  });

  // Capture the error
  await captureError(error, { route: '/api/test/error' });

  logger.info('Error capture completed');

  return NextResponse.json({
    success: false,
    message: 'Test error triggered and captured',
    errorId: error.errorCode,
    severity: error.severity,
    isCritical: error.isCritical,
  });
});