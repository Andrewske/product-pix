// src/lib/admin-feedback-handlers.ts
import { NextResponse } from 'next/server';
import { getFeedbackAnalytics, getFilteredFeedback } from '@/lib/db/admin-analytics';
import type { FeedbackReason } from '@/types';

export type AdminFeedbackHandler = (
  searchParams: URLSearchParams,
) => Promise<NextResponse>;

export const handleAnalytics: AdminFeedbackHandler = async (searchParams) => {
  const days = Math.min(parseInt(searchParams.get('days') || '30', 10), 365);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  const analytics = await getFeedbackAnalytics({ days, limit });
  return NextResponse.json(analytics);
};

export const handleList: AdminFeedbackHandler = async (searchParams) => {
  const feedbackType = searchParams.get('feedbackType') as 'positive' | 'negative' | undefined;
  const reasonParam = searchParams.get('reason');
  const reason = reasonParam ? (reasonParam as FeedbackReason) : undefined;
  const userId = searchParams.get('userId') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;

  const result = await getFilteredFeedback({
    feedbackType,
    reason,
    userId,
    limit,
    offset,
    startDate,
    endDate,
  });

  return NextResponse.json(result);
};

export const getAdminFeedbackHandler = (action: string): AdminFeedbackHandler | null => {
  switch (action) {
    case 'analytics':
      return handleAnalytics;
    case 'list':
      return handleList;
    default:
      return null;
  }
};