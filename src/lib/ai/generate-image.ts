// src/lib/ai/generate-image.ts
import { getImageProvider, type ImageConfig, type GenerationResponse } from './index';
import { uploadBase64Image } from '@/lib/r2';
import { updateJobStatus, getJob } from '@/lib/db/jobs';
import { refundCredits } from '@/lib/db/credits';
import { createGeneratedImage } from '@/lib/db/generated-images';
import { calculateCost } from '@/lib/pricing';
import { createGenerationCost } from '@/lib/db/cost-queries';

export interface GenerateImageParams {
  jobId: string;
  userId: string;
  prompt: string;
  sourceImage?: Buffer;
  sourceMimeType?: string;
  config: ImageConfig;
}

export interface GenerateImageResult {
  success: boolean;
  imageUrl?: string;
  fileKey?: string;
  error?: string;
}

/**
 * Generate an image using the configured AI provider
 */
export const generateImage = async (
  params: GenerateImageParams
): Promise<GenerateImageResult> => {
  const { jobId, userId, prompt, sourceImage, sourceMimeType, config } = params;

  const provider = getImageProvider();

  // Mark job as processing
  await updateJobStatus(jobId, 'processing');

  try {
    let result: GenerationResponse;

    if (sourceImage && sourceMimeType) {
      // Image-to-image transformation
      result = await provider.generateFromImage(
        sourceImage,
        sourceMimeType,
        prompt,
        config
      );
    } else {
      // Text-to-image generation
      result = await provider.generateFromText(prompt, config);
    }

    if (!result.success) {
      // Handle failure
      await updateJobStatus(jobId, 'failed', result.error);

      // Refund credits if retryable error
      if (result.retryable) {
        const job = await getJob(jobId);
        if (job && job.credits_charged) {
          await refundCredits(
            userId,
            job.credits_charged,
            jobId,
            `Refund for failed generation: ${result.error}`
          );
        }
      }

      return {
        success: false,
        error: result.error,
      };
    }

    // Upload generated image to R2
    const format = result.mimeType.split('/')[1] as 'png' | 'jpeg' | 'webp';
    const uploadResult = await uploadBase64Image(
      result.imageData,
      userId,
      jobId,
      format
    );

    // Save generated image record
    const generatedImage = await createGeneratedImage({
      jobId,
      userId,
      fileKey: uploadResult.fileKey,
      publicUrl: uploadResult.publicUrl,
      width: result.width,
      height: result.height,
      fileSize: Buffer.from(result.imageData, 'base64').length,
    });

    // Calculate and store generation cost
    if (result.usage) {
      const costResult = calculateCost('gemini-2.5-flash', {
        input: result.usage.promptTokens,
        output: result.usage.completionTokens,
      });

      if (costResult.ok) {
        const costData = costResult.data;
        if (costData.fallbackUsed) {
          console.warn(`⚠️  Using fallback pricing for image generation`);
        }

        await createGenerationCost({
          jobId,
          generatedImageId: generatedImage?.id,
          modelId: 'gemini-2.5-flash',
          provider: costData.provider,
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          inputCostUsd: costData.inputCost,
          outputCostUsd: costData.outputCost,
          totalCostUsd: costData.total,
          fallbackUsed: costData.fallbackUsed,
        });
      } else {
        console.warn(`⚠️  Failed to calculate cost for image generation: ${costResult.error.message}`);
      }
    } else {
      console.warn(`⚠️  No usage data available for cost calculation`);
    }

    // Mark job as completed
    await updateJobStatus(jobId, 'completed');

    return {
      success: true,
      imageUrl: uploadResult.publicUrl,
      fileKey: uploadResult.fileKey,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, 'failed', message);

    return {
      success: false,
      error: message,
    };
  }
};
