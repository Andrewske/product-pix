// src/app/api/images/[id]/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { submitFeedback, getFeedbackForImage, deleteFeedback } from '@/lib/db/feedback';
import { NEGATIVE_FEEDBACK_REASONS, POSITIVE_FEEDBACK_REASONS } from '@/types/feedback';

const feedbackSchema = z.object({
  feedbackType: z.enum(['positive', 'negative']),
  reasons: z.array(z.string()),
  comment: z.string().max(1000).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: imageId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user owns the image
  const { data: image } = await supabase
    .from('generated_images')
    .select('user_id')
    .eq('id', imageId)
    .single();

  if (!image || image.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const validation = feedbackSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Validation failed', details: validation.error.issues }, { status: 400 });
  }

  const { feedbackType, reasons, comment } = validation.data;

  // Validate reasons match feedback type
  const validReasons = feedbackType === 'positive' ? POSITIVE_FEEDBACK_REASONS : NEGATIVE_FEEDBACK_REASONS;
  const invalidReasons = reasons.filter(reason => !validReasons.includes(reason as any));

  if (invalidReasons.length > 0) {
    return NextResponse.json({
      error: `Invalid reasons for ${feedbackType} feedback: ${invalidReasons.join(', ')}`
    }, { status: 400 });
  }

  const result = await submitFeedback(user.id, {
    imageId,
    feedbackType,
    reasons: reasons as any, // Type assertion after validation
    comment,
  });

  if (!result) {
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }

  return NextResponse.json(result);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: imageId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const feedback = await getFeedbackForImage(imageId, user.id);

  return NextResponse.json(feedback);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: imageId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const success = await deleteFeedback(imageId, user.id);

  if (!success) {
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}