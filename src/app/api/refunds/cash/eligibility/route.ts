// src/app/api/refunds/cash/eligibility/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { getEligibleCashRefunds } from '@/lib/db/refunds';

export const GET = withAuth(async (request) => {
  try {
    const eligiblePurchases = await getEligibleCashRefunds(request.user.id);

    return NextResponse.json({
      eligiblePurchases,
    });
  } catch (error) {
    console.error('Error fetching cash refund eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refund eligibility' },
      { status: 500 }
    );
  }
});