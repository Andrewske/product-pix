// src/app/api/upload/confirm/route.ts
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/server';
import { createUpload } from '@/lib/db/uploads';
import { z } from 'zod';

const requestSchema = z.object({
  fileKey: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  fileSize: z.number().positive(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
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

    const { fileKey, filename, mimeType, fileSize, width, height } = parsed.data;

    // Verify the file key belongs to this user
    if (!fileKey.startsWith(`uploads/${request.user.id}/`)) {
      return NextResponse.json(
        { error: 'Invalid file key' },
        { status: 403 }
      );
    }

    // Create upload record
    const upload = await createUpload({
      user_id: request.user.id,
      filename,
      file_key: fileKey,
      file_size: fileSize,
      mime_type: mimeType,
      width: width ?? null,
      height: height ?? null,
    });

    if (!upload) {
      return NextResponse.json(
        { error: 'Failed to create upload record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadId: upload.id,
      fileKey: upload.file_key,
    });
  } catch (error) {
    console.error('Upload confirm error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
