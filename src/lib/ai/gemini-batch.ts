// src/lib/ai/gemini-batch.ts
import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';

const client = new GoogleGenAI({
  apiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export interface BatchItemInput {
  id: string;
  prompt: string;
  sourceImageUrl?: string;
  aspectRatio: string;
  resolution: string;
}

export interface CreateBatchJobParams {
  items: BatchItemInput[];
  batchName: string;
}

export interface BatchJobResult {
  geminiBatchId: string;
  geminiFileId: string;
}

export interface BatchStatus {
  state: string;
  error?: {
    message: string;
    code?: number;
  };
  destFileName?: string;
}

/**
 * Fetch image from URL and convert to base64
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * Create a batch job with Gemini Batch API
 */
export async function createBatchJob(
  params: CreateBatchJobParams
): Promise<BatchJobResult> {
  // 1. Fetch source images if URLs provided
  const itemsWithImages = await Promise.all(
    params.items.map(async (item) => {
      if (item.sourceImageUrl) {
        try {
          const imageData = await fetchImageAsBase64(item.sourceImageUrl);
          return { ...item, imageData };
        } catch (error) {
          console.error(`Failed to fetch image for item ${item.id}:`, error);
          throw error;
        }
      }
      return item;
    })
  );

  // 2. Build JSONL content
  const requests = itemsWithImages.map((item) => {
    const parts: any[] = [];

    // Add image if present
    if ('imageData' in item && item.imageData) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: item.imageData,
        },
      });
    }

    // Add text prompt
    parts.push({
      text: item.prompt,
    });

    return {
      key: `item-${item.id}`,
      request: {
        contents: [
          {
            parts,
          },
        ],
        generation_config: {
          response_modalities: ['IMAGE'],
          // Map aspect ratio and resolution to Gemini params
          // Note: Gemini API may have different parameter names
          // Adjust based on actual API documentation
        },
      },
    };
  });

  const jsonlContent = requests.map((r) => JSON.stringify(r)).join('\n');

  // 3. Upload JSONL to Gemini File API
  // Create a temporary file path for upload
  const tempFilePath = `/tmp/batch-${Date.now()}.jsonl`;
  const fs = await import('fs/promises');
  await fs.writeFile(tempFilePath, jsonlContent, 'utf-8');

  try {
    // Upload file using the SDK
    const uploadedFile = await client.files.upload({
      file: tempFilePath,
      config: {
        displayName: `${params.batchName}-input`,
        mimeType: 'application/jsonl',
      },
    });

    // 4. Create batch job
    if (!uploadedFile.uri && !uploadedFile.name) {
      throw new Error('File upload failed - no uri or name returned');
    }
    const batchJob = await client.batches.create({
      model: env.GEMINI_MODEL || 'gemini-3-pro-image-preview',
      src: (uploadedFile.uri || uploadedFile.name) as string,
      config: {
        displayName: params.batchName,
      },
    });

    return {
      geminiBatchId: batchJob.name || '',
      geminiFileId: uploadedFile.name || '',
    };
  } finally {
    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Get batch job status
 */
export async function getBatchStatus(
  geminiBatchId: string
): Promise<BatchStatus> {
  const job = await client.batches.get({ name: geminiBatchId });

  return {
    state: job.state || 'UNKNOWN',
    error: job.error
      ? {
          message:
            typeof job.error === 'string'
              ? job.error
              : job.error.message || 'Unknown error',
          code:
            typeof job.error === 'object' && 'code' in job.error
              ? job.error.code
              : undefined,
        }
      : undefined,
    destFileName: job.dest?.fileName,
  };
}

/**
 * Cancel a batch job
 */
export async function cancelBatch(geminiBatchId: string): Promise<void> {
  await client.batches.cancel({ name: geminiBatchId });
}

/**
 * Download batch results
 */
export async function downloadResults(fileName: string): Promise<string> {
  // Download the results file
  const tempPath = "/tmp/temp.jsonl";
  await client.files.download({ file: fileName, downloadPath: tempPath });
  const fs = await import('fs/promises');
  const fileContent = await fs.readFile(tempPath, 'utf-8');
  
  return fileContent;
}

