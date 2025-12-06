import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { Result, ok, err, createError } from './errors';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';

// =============================================================================
// Constants
// =============================================================================

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

// =============================================================================
// Types
// =============================================================================

export interface ResolvedSourceImage {
  buffer: Buffer;
  mimeType: string;
  hash: string;
  r2Key: string;
  r2Url: string;
}

export interface SourceImageOptions {
  batchFilePath: string;  // For resolving relative paths
  skipUpload?: boolean;   // For dry-run mode
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Get MIME type from file extension
 */
export const getMimeType = (filePath: string): Result<string> => {
  const ext = extname(filePath).toLowerCase();
  const mimeType = SUPPORTED_MIME_TYPES[ext];

  if (!mimeType) {
    return err(createError(
      'VALIDATION_ERROR',
      `Unsupported image format: ${ext}. Supported: ${Object.keys(SUPPORTED_MIME_TYPES).join(', ')}`
    ));
  }

  return ok(mimeType);
};

/**
 * Compute SHA-256 hash of buffer
 */
export const computeHash = (buffer: Buffer): string => {
  return createHash('sha256').update(buffer).digest('hex');
};

/**
 * Resolve source image path (relative to batch file or absolute)
 */
export const resolveSourcePath = (
  sourcePath: string,
  batchFilePath: string
): Result<string> => {
  let absolutePath: string;

  if (sourcePath.startsWith('http://') || sourcePath.startsWith('https://')) {
    // URL - will be handled separately
    return ok(sourcePath);
  }

  if (sourcePath.startsWith('/')) {
    absolutePath = sourcePath;
  } else {
    // Relative to batch file directory
    const batchDir = dirname(resolve(process.cwd(), batchFilePath));
    absolutePath = resolve(batchDir, sourcePath);
  }

  if (!existsSync(absolutePath)) {
    return err(createError(
      'VALIDATION_ERROR',
      `Source image not found: ${absolutePath}`
    ));
  }

  return ok(absolutePath);
};

/**
 * Load and validate source image from local path
 */
export const loadSourceImage = (
  absolutePath: string
): Result<{ buffer: Buffer; mimeType: string }> => {
  const mimeResult = getMimeType(absolutePath);
  if (!mimeResult.ok) return mimeResult;

  try {
    const buffer = readFileSync(absolutePath);
    return ok({ buffer, mimeType: mimeResult.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to read source image: ${message}`));
  }
};

/**
 * Fetch source image from URL
 */
export const fetchSourceImage = async (
  url: string
): Promise<Result<{ buffer: Buffer; mimeType: string }>> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return err(createError('NETWORK_ERROR', `Failed to fetch source image: ${response.status}`));
    }

    const contentType = response.headers.get('content-type') || '';
    const mimeType = contentType.split(';')[0].trim();

    if (!Object.values(SUPPORTED_MIME_TYPES).includes(mimeType)) {
      return err(createError('VALIDATION_ERROR', `Unsupported MIME type from URL: ${mimeType}`));
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return ok({ buffer, mimeType });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('NETWORK_ERROR', `Failed to fetch source image: ${message}`, { retryable: true }));
  }
};

/**
 * Upload source image to R2 with hash-based key
 */
export const uploadSourceImage = async (
  buffer: Buffer,
  mimeType: string
): Promise<Result<{ r2Key: string; r2Url: string; hash: string }>> => {
  const hash = computeHash(buffer);
  const ext = Object.entries(SUPPORTED_MIME_TYPES).find(([, mime]) => mime === mimeType)?.[0] || '.png';
  const r2Key = `prompt-tests/sources/${hash}${ext}`;

  try {
    await uploadBuffer(buffer, r2Key, mimeType);
    const r2Url = getPublicUrl(r2Key);
    return ok({ r2Key, r2Url, hash });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to upload source image: ${message}`));
  }
};

/**
 * Main entry point: Resolve, load, and optionally upload source image
 */
export const resolveSourceImage = async (
  sourceRef: string,
  options: SourceImageOptions
): Promise<Result<ResolvedSourceImage>> => {
  const isUrl = sourceRef.startsWith('http://') || sourceRef.startsWith('https://');

  // Step 1: Load the image
  let loadResult: Result<{ buffer: Buffer; mimeType: string }>;

  if (isUrl) {
    loadResult = await fetchSourceImage(sourceRef);
  } else {
    const pathResult = resolveSourcePath(sourceRef, options.batchFilePath);
    if (!pathResult.ok) return pathResult;
    loadResult = loadSourceImage(pathResult.data);
  }

  if (!loadResult.ok) return loadResult;
  const { buffer, mimeType } = loadResult.data;

  // Step 2: Compute hash (always needed for idempotency)
  const hash = computeHash(buffer);
  const ext = Object.entries(SUPPORTED_MIME_TYPES).find(([, mime]) => mime === mimeType)?.[0] || '.png';
  const r2Key = `prompt-tests/sources/${hash}${ext}`;

  // Step 3: Upload if not dry-run
  if (options.skipUpload) {
    return ok({
      buffer,
      mimeType,
      hash,
      r2Key,
      r2Url: `[dry-run] ${r2Key}`,
    });
  }

  const uploadResult = await uploadSourceImage(buffer, mimeType);
  if (!uploadResult.ok) return uploadResult;

  return ok({
    buffer,
    mimeType,
    hash: uploadResult.data.hash,
    r2Key: uploadResult.data.r2Key,
    r2Url: uploadResult.data.r2Url,
  });
};
