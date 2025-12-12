// src/app/api/refunds/cash/eligibility/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getEligibleCashRefunds } from '@/lib/db/refunds';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eligiblePurchases = await getEligibleCashRefunds(session.user.id);

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
}