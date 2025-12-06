import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './client';

interface PresignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

/**
 * Generate a presigned URL for direct browser upload to R2
 * @param userId - User ID for namespacing
 * @param filename - Original filename
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration in seconds (default 1 hour)
 */
export const getPresignedUploadUrl = async (
  userId: string,
  filename: string,
  contentType: string,
  expiresIn = 3600
): Promise<PresignedUploadResult> => {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileKey = `uploads/${userId}/${timestamp}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET(),
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client(), command, { expiresIn });

  return {
    uploadUrl,
    fileKey,
    publicUrl: `${R2_PUBLIC_URL()}/${fileKey}`,
  };
};

/**
 * Generate a presigned URL for downloading a private file
 */
export const getPresignedDownloadUrl = async (
  fileKey: string,
  expiresIn = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET(),
    Key: fileKey,
  });

  return getSignedUrl(r2Client(), command, { expiresIn });
};

/**
 * Delete a file from R2
 */
export const deleteFile = async (fileKey: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET(),
    Key: fileKey,
  });

  await r2Client().send(command);
};

/**
 * Get the public URL for a file
 */
export const getPublicUrl = (fileKey: string): string => {
  return `${R2_PUBLIC_URL()}/${fileKey}`;
};