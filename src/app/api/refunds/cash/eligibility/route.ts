// src/app/api/refunds/cash/eligibility/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { getEligibleCashRefunds } from '@/lib/db/refunds';
import { createCreditError, ErrorCodes } from '@/lib/errors';
import { captureError } from '@/lib/observability/capture-error';

export const GET = withAuth(async (request) => {
  try {
    const eligiblePurchases = await getEligibleCashRefunds(request.user.id);

    return NextResponse.json({
      eligiblePurchases,
    });
  } catch (error) {
    const creditError = createCreditError(
      ErrorCodes.CREDIT_REFUND_FAILED,
      'Failed to fetch cash refund eligibility',
      {
        severity: 'high',
        amount: 0,
        operation: 'refund',
        userId: request.user.id,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );

    await captureError(creditError, { route: '/api/refunds/cash/eligibility' });

    return NextResponse.json(
      { error: 'Failed to fetch refund eligibility' },
      { status: 500 }
    );
  }
});