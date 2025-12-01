// src/lib/images/validation.ts
export const IMAGE_CONFIG = {
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  minSizeBytes: 1024, // 1KB minimum
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  maxDimension: 4096,
  minDimension: 256,
} as const;

export type AllowedMimeType = typeof IMAGE_CONFIG.allowedMimeTypes[number];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  mimeType: AllowedMimeType;
  sizeBytes: number;
}

/**
 * Validate image MIME type by checking magic bytes
 */
export const getMimeTypeFromBuffer = (buffer: Buffer): AllowedMimeType | null => {
  // Check magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
};

/**
 * Validate file size
 */
export const validateFileSize = (sizeBytes: number): ValidationResult => {
  if (sizeBytes < IMAGE_CONFIG.minSizeBytes) {
    return { valid: false, error: 'File is too small (minimum 1KB)' };
  }
  if (sizeBytes > IMAGE_CONFIG.maxSizeBytes) {
    return { valid: false, error: 'File is too large (maximum 10MB)' };
  }
  return { valid: true };
};

/**
 * Validate MIME type
 */
export const validateMimeType = (mimeType: string): ValidationResult => {
  if (!IMAGE_CONFIG.allowedMimeTypes.includes(mimeType as AllowedMimeType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${IMAGE_CONFIG.allowedMimeTypes.join(', ')}`,
    };
  }
  return { valid: true };
};

/**
 * Validate image dimensions
 */
export const validateDimensions = (width: number, height: number): ValidationResult => {
  if (width < IMAGE_CONFIG.minDimension || height < IMAGE_CONFIG.minDimension) {
    return {
      valid: false,
      error: `Image too small. Minimum ${IMAGE_CONFIG.minDimension}x${IMAGE_CONFIG.minDimension} pixels`,
    };
  }
  if (width > IMAGE_CONFIG.maxDimension || height > IMAGE_CONFIG.maxDimension) {
    return {
      valid: false,
      error: `Image too large. Maximum ${IMAGE_CONFIG.maxDimension}x${IMAGE_CONFIG.maxDimension} pixels`,
    };
  }
  return { valid: true };
};

/**
 * Comprehensive image validation
 */
export const validateImage = (
  buffer: Buffer,
  declaredMimeType: string,
  width?: number,
  height?: number
): ValidationResult => {
  // Validate size
  const sizeResult = validateFileSize(buffer.length);
  if (!sizeResult.valid) return sizeResult;

  // Validate declared MIME type
  const mimeResult = validateMimeType(declaredMimeType);
  if (!mimeResult.valid) return mimeResult;

  // Validate actual MIME type matches declared
  const actualMimeType = getMimeTypeFromBuffer(buffer);
  if (!actualMimeType) {
    return { valid: false, error: 'Unable to determine image type from file content' };
  }
  if (actualMimeType !== declaredMimeType) {
    return {
      valid: false,
      error: `File content doesn't match declared type (declared: ${declaredMimeType}, actual: ${actualMimeType})`,
    };
  }

  // Validate dimensions if provided
  if (width !== undefined && height !== undefined) {
    const dimResult = validateDimensions(width, height);
    if (!dimResult.valid) return dimResult;
  }

  return { valid: true };
};
