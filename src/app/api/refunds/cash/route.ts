// src/app/api/refunds/cash/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createStripeRefund } from '@/lib/stripe/refunds';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { purchaseId, percentage } = body;

    if (!purchaseId || ![90, 100].includes(percentage)) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Dynamic import to avoid test mocking issues
    const { getEligibleCashRefunds, createCashRefundRequest } = await import('@/lib/db/refunds');

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
      console.error('Error fetching purchase details:', purchaseError);
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

    // Deduct credits immediately
    const { error: deductError } = await adminClient.rpc(
      'deduct_credits_for_cash_refund',
      {
        p_user_id: userId,
        p_amount: purchase.creditsUnused,
        p_purchase_id: purchaseId,
        p_description: `Cash refund (${percentage}%)`,
      }
    );

    if (deductError) {
      console.error('Error deducting credits:', deductError);
      // TODO: Consider rolling back Stripe refund here
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      );
    }

    // Create cash refund request record
    await createCashRefundRequest({
      userId,
      purchaseId,
      creditsRefunded: purchase.creditsUnused,
      refundAmountCents,
      refundPercentage: percentage,
      stripeRefundId: stripeRefund.id,
    });

    return NextResponse.json({
      success: true,
      refundId: stripeRefund.id,
      amountCents: refundAmountCents,
    });
  } catch (error) {
    console.error('Error processing cash refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}