// src/lib/ai/generate-image.ts
import { getImageProvider, type ImageConfig, type GenerationResponse, type ProductAnalysis } from './index';
import { analyzeProductImage, buildPromptFromTemplate, generateImageTitle, getTitleFromFilename } from './index';
import { uploadBase64Image } from '@/lib/r2';
import { updateJobStatus, getJob, updateJobParameters } from '@/lib/db/jobs';
import { refundCredits } from '@/lib/db/credits';
import { createGeneratedImage } from '@/lib/db/generated-images';
import { calculateCost } from '@/lib/pricing';
import { createGenerationCost } from '@/lib/db/cost-queries';
import { logger } from '@/lib/logging';

export interface GenerateImageParams {
  jobId: string;
  userId: string;
  prompt: string;
  sourceImage?: Buffer;
  sourceMimeType?: string;
  sourceFilename?: string;
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
  const { jobId, userId, prompt, sourceImage, sourceMimeType, sourceFilename, config } = params;

  const provider = getImageProvider();

  // Mark job as processing
  await updateJobStatus(jobId, 'processing');

  // Get job to access template_id
  const job = await getJob(jobId);
  if (!job) {
    return {
      success: false,
      error: 'Job not found',
    };
  }

  const templateId = job.template_id ?? 'ecommerce-base';
  let analysis: ProductAnalysis | undefined = undefined;
  let imageTitle: string | undefined;

  // Analysis step for image-to-image
  if (sourceImage && sourceMimeType) {
    const result = await analyzeProductImage(sourceImage, sourceMimeType);
    if (result.ok) {
      analysis = result.data.analysis;
      await updateJobParameters(jobId, { analysis });
      imageTitle = generateImageTitle(analysis);

      // Record analysis cost
      try {
        const costData = calculateCost('gemini-2.0-flash', {
          input: result.data.usage.promptTokens,
          output: result.data.usage.completionTokens,
        });

        if (costData.fallbackUsed) {
          logger.warn('Using fallback pricing for analysis');
        }

        await createGenerationCost({
          jobId,
          generatedImageId: undefined, // No image yet
          modelId: 'gemini-2.0-flash',
          provider: costData.provider,
          inputTokens: result.data.usage.promptTokens,
          outputTokens: result.data.usage.completionTokens,
          inputCostUsd: costData.inputCost,
          outputCostUsd: costData.outputCost,
          totalCostUsd: costData.total,
          fallbackUsed: costData.fallbackUsed,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Failed to calculate cost for analysis', { error: message });
      }
    } else {
      // Fallback: use original filename as title
      imageTitle = sourceFilename ? getTitleFromFilename(sourceFilename) : 'untitled';
    }
  }

  // Build prompt from template (works with or without analysis)
  const promptResult = await buildPromptFromTemplate(templateId, analysis);
  if (!promptResult.ok) {
    return {
      success: false,
      error: `Template error: ${promptResult.error.message}`,
    };
  }
  const compiledPrompt = promptResult.data;

  try {
    let result: GenerationResponse;

    if (sourceImage && sourceMimeType) {
      // Image-to-image transformation
      result = await provider.generateFromImage(
        sourceImage,
        sourceMimeType,
        compiledPrompt,
        config
      );
    } else {
      // Text-to-image generation
      result = await provider.generateFromText(compiledPrompt, config);
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
      title: imageTitle,
    });

    // Calculate and store generation cost
    if (result.usage) {
      try {
        const costData = calculateCost('gemini-3-pro-image-preview', {
          input: result.usage.promptTokens,
          output: result.usage.completionTokens,
        });

        if (costData.fallbackUsed) {
          logger.warn('Using fallback pricing for image generation');
        }

        await createGenerationCost({
          jobId,
          generatedImageId: generatedImage?.id,
          modelId: 'gemini-3-pro-image-preview',
          provider: costData.provider,
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          inputCostUsd: costData.inputCost,
          outputCostUsd: costData.outputCost,
          totalCostUsd: costData.total,
          fallbackUsed: costData.fallbackUsed,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Failed to calculate cost for image generation', { error: message });
      }
    } else {
      logger.warn('No usage data available for cost calculation');
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
