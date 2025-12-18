// src/app/api/generate/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/client';
import { createGenerationJob, getJob } from '@/lib/db/jobs';
import { getUpload } from '@/lib/db/uploads';
import { trackActivity } from '@/lib/db';
import { generateImage } from '@/lib/ai/generate-image';
import { getPublicUrl } from '@/lib/r2';
import { rateLimiters } from '@/lib/rate-limit';
import { calculateGenerationCost } from '@/lib/pricing';
import type { creditEconomy } from '@/lib/pricing/pricing.config';
import { createGenerationError } from '@/lib/errors/error-classes';
import { captureError } from '@/lib/observability/capture-error';
import { ErrorCodes } from '@/lib/errors/codes';
import { trackServerEvent } from '@/lib/analytics/server';
import { z } from 'zod';

const requestSchema = z.object({
  uploadId: z.string().uuid().optional(),
  templateSlug: z.string().min(1),
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1'),
  resolution: z.enum(['1k', '2k', '4k']).default('1k'),
  mode: z.enum(['lightning', 'snail']).optional().default('lightning'),
  addons: z.array(z.string()).optional(),
});

export const POST = withAuth(async (request) => {
  let templateSlug = '';
  let creditCost = 0;
  let jobResult: { success: boolean; job_id: string | null; message: string } | undefined;

  try {

    // Rate limit check
    const rateLimitResult = await rateLimiters.generation(request.user.id);
    if (!rateLimitResult.success) {
      // Track rate limit hit
      trackServerEvent(request.user.id, {
        event: 'rate_limit_hit',
        properties: {
          user_id: request.user.id,
          limit_type: 'generation_per_hour',
          current_count: 0, // Placeholder, actual count not available
          limit: 10, // Placeholder
        },
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60,
        },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      );
    }

    // Validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { uploadId, templateSlug: parsedTemplateSlug, aspectRatio, resolution, mode, addons } = parsed.data;
    templateSlug = parsedTemplateSlug;

    // Calculate credits using new cost breakdown function
    const costBreakdown = calculateGenerationCost({
      resolution,
      mode,
      addons: addons as Array<keyof typeof creditEconomy.addonCosts> | undefined
    });
    creditCost = costBreakdown.total;

    // If uploadId provided, fetch the upload
    let sourceImage: Buffer | undefined;
    let sourceMimeType: string | undefined;
    let sourceFilename: string | undefined;

    if (uploadId) {
      const upload = await getUpload(uploadId);
      if (!upload) {
        return NextResponse.json(
          { error: 'Upload not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (upload.user_id !== request.user.id) {
        return NextResponse.json(
          { error: 'Not authorized to use this upload' },
          { status: 403 }
        );
      }

      // Fetch image from R2
      const imageUrl = getPublicUrl(upload.file_key);
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch source image' },
          { status: 500 }
        );
      }

      sourceImage = Buffer.from(await response.arrayBuffer());
      sourceMimeType = upload.mime_type;
      sourceFilename = upload.filename;
    }

    // Create job with credit consumption
    jobResult = await createGenerationJob(
      request.user.id,
      uploadId ?? null,
      '', // Empty prompt - using template instead
      { aspectRatio, resolution },
      creditCost,
      templateSlug,
      mode
    );

    // Check for insufficient credits
    if (jobResult.message === "Insufficient credits") {
      // Get current balance for the modal
      const supabase = await createClient();
      const { data: userData } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", request.user.id)
        .single();

      // Track insufficient credits event
      await trackActivity(request.user.id, 'insufficient_credits', {
        required: creditCost,
        available: userData?.credit_balance || 0
      });

      return NextResponse.json(
        {
          error: "Insufficient credits",
          balance: userData?.credit_balance || 0,
          required: creditCost,
          costBreakdown: costBreakdown
        },
        { status: 402 }
      );
    }
    if (!jobResult.success || !jobResult.job_id) {
      return NextResponse.json(
        { error: jobResult.message },
        { status: 400 }
      );
    }

    // Start generation (synchronous for MVP, async with Trigger.dev in Phase 2)
    const result = await generateImage({
      jobId: jobResult.job_id,
      userId: request.user.id,
      sourceImage,
      sourceMimeType,
      sourceFilename,
      config: { aspectRatio, resolution },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, jobId: jobResult.job_id },
        { status: 500 }
      );
    }

    // Get the generated image ID
    const supabase = await createClient();
    const { data: imageData } = await supabase
      .from('generated_images')
      .select('id')
      .eq('job_id', jobResult.job_id)
      .single();

    return NextResponse.json({
      success: true,
      jobId: jobResult.job_id,
      imageId: imageData?.id,
      imageUrl: result.imageUrl,
      fileKey: result.fileKey,
    });
  } catch (error) {
    const creditsConsumed = jobResult?.success === true ? creditCost : 0;

    const generationError = createGenerationError(
      ErrorCodes.GENERATION_FAILED,
      'Image generation failed',
      {
        severity: creditsConsumed ? 'critical' : 'high',
        templateSlug,
        creditsConsumed,
        userId: request.user.id,
        creditAmount: creditCost,
        retryable: false,
        originalError: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
    );

    await captureError(generationError, { route: '/api/generate' });

    return NextResponse.json(
      { error: 'Generation failed', jobId: jobResult?.job_id },
      { status: 500 }
    );
  }
});

// Get job status
export const GET = withAuth(async (request) => {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId required' },
      { status: 400 }
    );
  }

  const job = await getJob(jobId);

  if (!job || job.user_id !== request.user.id) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ job });
});
