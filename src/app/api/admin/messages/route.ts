// src/app/api/admin/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getMessageAnalytics, getFilteredMessages, sendAdminReply } from '@/lib/db/admin-messages';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse query parameters and dispatch to handler
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'analytics';

    if (action === 'analytics') {
      const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

      const analytics = await getMessageAnalytics({ days, limit });
      return NextResponse.json(analytics);
    }

    if (action === 'list') {
      const sentiment = searchParams.get('sentiment') as 'positive' | 'neutral' | 'negative' | undefined;
      const category = searchParams.get('category') as 'bug_report' | 'feature_request' | 'billing' | 'praise' | 'complaint' | 'other' | undefined;
      const userId = searchParams.get('userId') || undefined;
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
      const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
      const startDate = searchParams.get('startDate') || undefined;
      const endDate = searchParams.get('endDate') || undefined;

      const result = await getFilteredMessages({
        sentiment,
        category,
        userId,
        limit,
        offset,
        startDate,
        endDate,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    logger.error('Error in admin messages GET API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify admin auth
    const user = await requireAuth();
    const isAdmin = await requireAdmin(user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { userId, content } = body;

    // 3. Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required and must be a string' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content is required and must be a string' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      );
    }

    // 4. Send admin reply
    const message = await sendAdminReply({ userId, content });

    if (!message) {
      return NextResponse.json(
        { error: 'Failed to send admin reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message });

  } catch (error) {
    logger.error('Error in admin messages POST API', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}