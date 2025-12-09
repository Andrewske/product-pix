// src/app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGenerationJob, getJob } from '@/lib/db/jobs';
import { getUpload } from '@/lib/db/uploads';
import { generateImage } from '@/lib/ai/generate-image';
import { getPublicUrl } from '@/lib/r2';
import { rateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

const requestSchema = z.object({
  uploadId: z.string().uuid().optional(),
  prompt: z.string().min(10).max(1000),
  aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1'),
  resolution: z.enum(['1k', '2k', '4k']).default('1k'),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit check
    const rateLimitResult = await rateLimiters.generation(user.id);
    if (!rateLimitResult.success) {
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

    const { uploadId, prompt, aspectRatio, resolution } = parsed.data;

    // Calculate credits based on resolution
    const creditCost = resolution === '4k' ? 3 : resolution === '2k' ? 2 : 1;

    // If uploadId provided, fetch the upload
    let sourceImage: Buffer | undefined;
    let sourceMimeType: string | undefined;

    if (uploadId) {
      const upload = await getUpload(uploadId);
      if (!upload) {
        return NextResponse.json(
          { error: 'Upload not found' },
          { status: 404 }
        );
      }

      // Verify ownership
      if (upload.user_id !== user.id) {
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
    }

    // Create job with credit consumption
    const jobResult = await createGenerationJob(
      user.id,
      uploadId ?? null,
      prompt,
      { aspectRatio, resolution },
      creditCost
    );

    // Check for insufficient credits
    if (jobResult.message === "Insufficient credits") {
      // Get current balance for the modal
      const supabase = await createClient();
      const { data: userData } = await supabase
        .from("users")
        .select("credit_balance")
        .eq("id", user.id)
        .single();
      
      return NextResponse.json(
        {
          error: "Insufficient credits",
          balance: userData?.credit_balance || 0,
          required: creditCost
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
      userId: user.id,
      prompt,
      sourceImage,
      sourceMimeType,
      config: { aspectRatio, resolution },
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, jobId: jobResult.job_id },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId: jobResult.job_id,
      imageUrl: result.imageUrl,
      fileKey: result.fileKey,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get job status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId required' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const job = await getJob(jobId);

  if (!job || job.user_id !== user.id) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ job });
}
