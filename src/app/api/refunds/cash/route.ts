// src/app/api/refunds/cash/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { createStripeRefund } from '@/lib/stripe/refunds';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEligibleCashRefunds, createCashRefundRequest } from '@/lib/db/refunds';
import { createCreditError, ErrorCodes } from '@/lib/errors';
import { captureError } from '@/lib/observability/capture-error';

export const POST = withAuth(async (request) => {
  try {
    const userId = request.user.id;

    const body = await request.json();
    const { purchaseId, percentage } = body;

    if (!purchaseId || ![90, 100].includes(percentage)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Check eligibility
    const eligiblePurchases = await getEligibleCashRefunds(userId);
    const purchase = eligiblePurchases.find(p => p.purchaseId === purchaseId);

    if (!purchase) {
      return NextResponse.json(
        { error: 'Purchase not eligible for refund' },
        { status: 400 }
      );
    }

    // Get purchase details from database
    const adminClient = createAdminClient();
    const { data: purchaseData, error: purchaseError } = await adminClient
      .from('stripe_purchases')
      .select('stripe_payment_intent_id, credits_granted, purchase_credit_ledger!inner(*)')
      .eq('id', purchaseId)
      .eq('user_id', userId)
      .single();

    if (purchaseError || !purchaseData) {
      const creditError = createCreditError(
        ErrorCodes.CREDIT_REFUND_FAILED,
        'Failed to fetch purchase details for cash refund',
        {
          severity: 'critical',
          amount: 0,
          operation: 'refund',
          userId,
        }
      );

      await captureError(creditError, { route: '/api/refunds/cash' });

      return NextResponse.json(
        { error: 'Purchase not found' },
        { status: 404 }
      );
    }

    const refundAmountCents = percentage === 100
      ? purchase.refundAmount100Cents
      : purchase.refundAmount90Cents;

    // Create Stripe refund
    const stripeRefund = await createStripeRefund({
      paymentIntentId: purchaseData.stripe_payment_intent_id,
      amountCents: refundAmountCents,
      metadata: {
        userId,
        purchaseId,
        creditsRefunded: purchase.creditsUnused.toString(),
        percentage: percentage.toString(),
      },
    });

    // Create cash refund request record first to get the ID
    const cashRefundRequest = await createCashRefundRequest({
      userId,
      purchaseId,
      creditsRefunded: purchase.creditsUnused,
      refundAmountCents,
      refundPercentage: percentage,
      stripeRefundId: stripeRefund.id,
    });

    // Deduct credits immediately
    const { error: deductError } = await adminClient.rpc(
      'deduct_credits_for_cash_refund',
      {
        p_user_id: userId,
        p_stripe_purchase_id: purchaseId,
        p_amount: purchase.creditsUnused,
        p_cash_refund_id: cashRefundRequest.id,
      }
    );

    if (deductError) {
      const creditError = createCreditError(
        ErrorCodes.CREDIT_CONSUME_FAILED,
        'Failed to deduct credits for cash refund',
        {
          severity: 'critical',
          amount: purchase.creditsUnused,
          operation: 'consume',
          userId,
        }
      );

      await captureError(creditError, { route: '/api/refunds/cash' });

      // TODO: Consider rolling back Stripe refund here
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      refundId: stripeRefund.id,
      amountCents: refundAmountCents,
    });
  } catch (error) {
    const creditError = createCreditError(
      ErrorCodes.CREDIT_REFUND_FAILED,
      'Cash refund processing failed',
      {
        severity: 'critical',
        amount: 0,
        operation: 'refund',
        userId: request.user.id,
      }
    );

    await captureError(creditError, { route: '/api/refunds/cash' });

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
});