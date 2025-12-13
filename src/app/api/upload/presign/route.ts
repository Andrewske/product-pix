import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { getPresignedUploadUrl } from '@/lib/r2';
import { z } from 'zod';
import { createGenerationError, ErrorCodes } from '@/lib/errors';
import { captureError } from '@/lib/observability/capture-error';

const requestSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});

export const POST = withAuth(async (request) => {
  try {
    // Validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Generate presigned URL
    const result = await getPresignedUploadUrl(
      request.user.id,
      parsed.data.filename,
      parsed.data.contentType
    );

    return NextResponse.json(result);
  } catch (error) {
    const generationError = createGenerationError(
      ErrorCodes.GENERATION_FAILED,
      'Failed to generate upload URL',
      {
        severity: 'medium',
        templateSlug: 'upload-presign',
        creditsConsumed: 0,
        userId: request.user.id,
        retryable: true,
      }
    );

    await captureError(generationError, { route: '/api/upload/presign' });

    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
});