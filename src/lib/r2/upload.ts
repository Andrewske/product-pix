import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './client';

interface UploadResult {
  fileKey: string;
  publicUrl: string;
}

/**
 * Upload a buffer directly to R2 (for server-side use, e.g., saving AI-generated images)
 */
export const uploadBuffer = async (
  buffer: Buffer,
  fileKey: string,
  contentType: string
): Promise<UploadResult> => {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET(),
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client().send(command);

  return {
    fileKey,
    publicUrl: `${R2_PUBLIC_URL()}/${fileKey}`,
  };
};

/**
 * Upload a base64-encoded image (common format from AI responses)
 */
export const uploadBase64Image = async (
  base64Data: string,
  userId: string,
  jobId: string,
  format: 'png' | 'jpeg' | 'webp' = 'png'
): Promise<UploadResult> => {
  const buffer = Buffer.from(base64Data, 'base64');
  const fileKey = `generated/${userId}/${jobId}.${format}`;
  const contentType = `image/${format}`;

  return uploadBuffer(buffer, fileKey, contentType);
};

/**
 * Download a file from R2 as a Buffer
 */
export const downloadBuffer = async (fileKey: string): Promise<Buffer> => {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key: fileKey,
  });

  const response = await r2Client().send(command);
  const bytes = await response.Body?.transformToByteArray();

  if (!bytes) {
    throw new Error(`Failed to download file: ${fileKey}`);
  }

  return Buffer.from(bytes);
};