import { S3Client } from '@aws-sdk/client-s3';

let _r2Client: S3Client | null = null;

/**
 * Get R2 client instance (lazy-initialized to allow env vars to load)
 */
export const r2Client = (): S3Client => {
  if (!_r2Client) {
    _r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _r2Client;
};

export const R2_BUCKET = (): string => process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = (): string => process.env.R2_PUBLIC_URL!;