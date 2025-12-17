import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ok, err, type Result, createError } from './errors';
import type { DetectedAngles } from './types';
import type { ResolvedSourceImage } from './source-image';
import { logger } from './logger';
import { generateCacheKey } from './analysis-cache';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AngleDetectorOptions {
  cacheEnabled?: boolean;
  model?: string;
}

/**
 * Cached angle detection result
 */
interface CachedAngleResult {
  imagesHash: string;
  detectedAngles: DetectedAngles;
  createdAt: Date;
}

/**
 * Get cached angle detection for a batch of images
 */
async function getAngleCache(imagesHash: string): Promise<Result<CachedAngleResult | null>> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('angle_cache')
    .select('*')
    .eq('images_hash', imagesHash)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found - cache miss
      return ok(null);
    }
    return err(createError('DATABASE_ERROR', `Failed to fetch angle cache: ${error.message}`));
  }

  return ok({
    imagesHash: data.images_hash,
    detectedAngles: data.detected_angles as DetectedAngles,
    createdAt: new Date(data.created_at)
  });
}

/**
 * Store angle detection results in cache
 */
async function setAngleCache(imagesHash: string, detectedAngles: DetectedAngles): Promise<Result<void>> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('angle_cache')
    .insert({
      images_hash: imagesHash,
      detected_angles: detectedAngles
    });

  if (error) {
    return err(createError('DATABASE_ERROR', `Failed to cache angle detection: ${error.message}`));
  }

  return ok(undefined);
}

/**
 * Create fallback DetectedAngles when Gemini fails
 * Assigns basic angle descriptions and marks all sources as potential primary references
 */
function createFallbackAngles(sourceImages: ResolvedSourceImage[]): DetectedAngles {
  const basicAngles = [
    'front view',
    'side view',
    'three-quarter view',
    'back view',
    'top view',
    'detail view'
  ];

  return {
    sourceAngles: sourceImages.map((_, index) => ({
      imageIndex: index,
      detectedAngle: basicAngles[index % basicAngles.length],
      isPrimaryReference: true // Mark all as potential primary references
    }))
  };
}

/**
 * Detect angles from source images using Gemini vision model
 *
 * @param sourceImages - Array of resolved source images
 * @param options - Configuration options
 * @returns DetectedAngles result or error
 */
export async function detectSourceAngles(
  sourceImages: ResolvedSourceImage[],
  options: AngleDetectorOptions = {}
): Promise<Result<DetectedAngles>> {
  const { cacheEnabled = true, model = 'gemini-2.0-flash' } = options;

  if (sourceImages.length === 0) {
    return err(createError(
      'VALIDATION_ERROR',
      'At least one source image is required for angle detection'
    ));
  }

  // Generate cache key from image buffers
  const imagesHash = generateCacheKey(sourceImages);

  // Check cache first if enabled
  if (cacheEnabled) {
    const cacheResult = await getAngleCache(imagesHash);
    if (cacheResult.ok && cacheResult.data) {
      logger.debug('Angle detection cache hit', { imagesHash });
      return ok(cacheResult.data.detectedAngles);
    }
  }

  logger.debug('Angle detection cache miss, calling Gemini', {
    imagesHash,
    sourceImageCount: sourceImages.length,
    model
  });

  try {
    // Prepare image contents for Gemini
    const imageContents = sourceImages.map(img => ({
      type: 'image' as const,
      image: img.buffer,
    }));

    const prompt = `Analyze these ${sourceImages.length} product images and describe what angle/view each one shows.

For each image, provide:
1. A clear description of the camera angle/viewpoint using standard photography terms
2. Whether this image shows the most complete view of the product (mark as primary reference)

Guidelines for angle descriptions:
- Use terms like: front, back, side, three-quarter view, top-down, bottom-up, detail, close-up
- Be specific about orientation (left side, right side, angled from above, etc.)
- For unusual angles, describe clearly (e.g., "low angle looking up", "high angle looking down")
- Category-specific terms are acceptable (e.g., "outsole detail" for footwear)

For primary reference selection:
- Choose the image that shows the most complete view of the entire product
- Prefer images where the product is well-centered and fully visible
- If no single image shows a complete view, select the best one available

Image indices are 0-based (0 to ${sourceImages.length - 1}).`;

    const result = await generateObject({
      model: google(model),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...imageContents
          ]
        }
      ],
      schema: z.object({
        sourceAngles: z.array(z.object({
          imageIndex: z.number().int().min(0),
          detectedAngle: z.string().min(1),
          isPrimaryReference: z.boolean()
        }))
      }),
    });

    const detectedAngles: DetectedAngles = result.object;

    // Validate that we have angles for all source images
    if (detectedAngles.sourceAngles.length !== sourceImages.length) {
      logger.warn('Gemini returned incorrect number of angle detections', {
        expected: sourceImages.length,
        received: detectedAngles.sourceAngles.length
      });
    }

    // Ensure at least one primary reference
    const hasPrimary = detectedAngles.sourceAngles.some(angle => angle.isPrimaryReference);
    if (!hasPrimary && detectedAngles.sourceAngles.length > 0) {
      // Default to first image as primary
      detectedAngles.sourceAngles[0].isPrimaryReference = true;
    }

    // Cache the result if caching is enabled
    if (cacheEnabled) {
      const cacheResult = await setAngleCache(imagesHash, detectedAngles);
      if (!cacheResult.ok) {
        logger.warn('Failed to cache angle detection result', {
          error: cacheResult.error.message
        });
      }
    }

    logger.debug('Angle detection completed', {
      detectedAngles: detectedAngles.sourceAngles.map(a => a.detectedAngle),
      primaryReferenceCount: detectedAngles.sourceAngles.filter(a => a.isPrimaryReference).length
    });

    return ok(detectedAngles);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown angle detection error';

    logger.warn('Angle detection failed, using fallback', {
      error: message,
      imagesHash,
      sourceImageCount: sourceImages.length
    });

    // Create fallback angles
    const fallbackAngles = createFallbackAngles(sourceImages);

    // Cache the fallback result to avoid repeated failures
    if (cacheEnabled) {
      const cacheResult = await setAngleCache(imagesHash, fallbackAngles);
      if (!cacheResult.ok) {
        logger.warn('Failed to cache fallback angle detection', {
          error: cacheResult.error.message
        });
      }
    }

    return ok(fallbackAngles);
  }
}