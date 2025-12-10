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
import { env } from '@/lib/env';

export interface GenerateImageParams {
  jobId: string;
  userId: string;
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

interface ProductAnalysisResult {
  analysis?: ProductAnalysis;
  imageTitle?: string;
}

/**
 * Run product analysis for image-to-image generation
 */
const runProductAnalysis = async (
  jobId: string,
  sourceImage: Buffer,
  sourceMimeType: string,
  sourceFilename?: string
): Promise<ProductAnalysisResult> => {
  const result = await analyzeProductImage(sourceImage, sourceMimeType);
  if (result.ok) {
    const analysis = result.data.analysis;
    await updateJobParameters(jobId, { analysis });
    const imageTitle = generateImageTitle(analysis);

    // Record analysis cost
    try {
      const costData = calculateCost(env.ANALYSIS_MODEL, {
        input: result.data.usage.promptTokens,
        output: result.data.usage.completionTokens,
      });

      await createGenerationCost({
        jobId,
        generatedImageId: undefined, // No image yet
        modelId: env.ANALYSIS_MODEL,
        provider: costData.provider,
        inputTokens: result.data.usage.promptTokens,
        outputTokens: result.data.usage.completionTokens,
        inputCostUsd: costData.inputCost,
        outputCostUsd: costData.outputCost,
        totalCostUsd: costData.total,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Failed to calculate cost for analysis', { error: message });
    }

    return { analysis, imageTitle };
  } else {
    // Fallback: use original filename as title
    const imageTitle = sourceFilename ? getTitleFromFilename(sourceFilename) : 'untitled';
    return { imageTitle };
  }
};

/**
 * Record generation cost for image generation
 */
const recordGenerationCost = async (
  jobId: string,
  generatedImageId: string | undefined,
  usage: { promptTokens: number; completionTokens: number }
): Promise<void> => {
  try {
    const costData = calculateCost(env.GEMINI_MODEL, {
      input: usage.promptTokens,
      output: usage.completionTokens,
    });

    await createGenerationCost({
      jobId,
      generatedImageId,
      modelId: env.GEMINI_MODEL,
      provider: costData.provider,
      inputTokens: usage.promptTokens,
      outputTokens: usage.completionTokens,
      inputCostUsd: costData.inputCost,
      outputCostUsd: costData.outputCost,
      totalCostUsd: costData.total,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('Failed to calculate cost for image generation', { error: message });
  }
};

/**
 * Generate an image using the configured AI provider
 */
export const generateImage = async (
  params: GenerateImageParams
): Promise<GenerateImageResult> => {
  const { jobId, userId, sourceImage, sourceMimeType, sourceFilename, config } = params;

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
     const analysisResult = await runProductAnalysis(jobId, sourceImage, sourceMimeType, sourceFilename);
     analysis = analysisResult.analysis;
     imageTitle = analysisResult.imageTitle;
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
       await recordGenerationCost(jobId, generatedImage?.id, result.usage);
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
