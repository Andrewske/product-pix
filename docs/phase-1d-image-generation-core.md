# Phase 1D: Image Generation Core

**ProductPix.app — AI-Powered Product Photo Generator**

---

## Overview

This document covers implementing the AI image generation system using Gemini 3 Pro Image (Nano Banana Pro) via the Vercel AI SDK. This is the core functionality of ProductPix.

### Why This Phase Matters

This is the heart of the application — everything else exists to support this capability. We need to:

- **Validate AI integration** before building UI around it
- **Create a provider abstraction** to avoid vendor lock-in
- **Implement proper error handling** for AI failures
- **Add rate limiting** to prevent abuse and budget overruns
- **Validate images** before sending to expensive AI APIs

### Architecture Overview

```
User Request
     ↓
Rate Limiter → Reject if exceeded
     ↓
Image Validator → Reject if invalid
     ↓
Credit Check → Reject if insufficient
     ↓
Provider Abstraction
     ↓
┌────────────────────────────────────────┐
│         AI Provider (Gemini)           │
│  - Text-to-Image                       │
│  - Image-to-Image transformation       │
│  - Multiple aspect ratios              │
│  - Up to 4K resolution                 │
└────────────────────────────────────────┘
     ↓
Save to R2 → Return result
```

---

## Prerequisites

- [ ] Phase 1A completed (AI SDK installed, R2 configured)
- [ ] Phase 1B completed (database schema, credit functions)
- [ ] Phase 1C completed (authentication working)
- [ ] Gemini API access validated (Task 1A.0)

---

## Task 1D.0: Provider Abstraction Layer (HIGH PRIORITY)

**Estimated Time:** 45 minutes

**Why:** Gemini 3 Pro Image is a **preview model**. Preview models can change, be deprecated, or have availability issues. A provider abstraction allows swapping providers without touching business logic.

### Steps

1. **Define provider interface**
   ```typescript
   // src/lib/ai/types.ts
   export interface ImageConfig {
     aspectRatio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
     resolution: '1k' | '2k' | '4k';
     quality?: 'standard' | 'hd';
   }

   export interface GenerationResult {
     success: true;
     imageData: string;  // base64
     mimeType: string;
     width: number;
     height: number;
   }

   export interface GenerationError {
     success: false;
     error: string;
     code: 'RATE_LIMITED' | 'CONTENT_FILTERED' | 'INVALID_INPUT' | 'PROVIDER_ERROR' | 'UNKNOWN';
     retryable: boolean;
   }

   export type GenerationResponse = GenerationResult | GenerationError;

   export interface ImageProvider {
     name: string;

     /**
      * Generate an image from a text prompt
      */
     generateFromText(
       prompt: string,
       config: ImageConfig
     ): Promise<GenerationResponse>;

     /**
      * Transform an existing image with a prompt
      */
     generateFromImage(
       sourceImage: Buffer,
       sourceMimeType: string,
       prompt: string,
       config: ImageConfig
     ): Promise<GenerationResponse>;

     /**
      * Check if the provider is available
      */
     isAvailable(): Promise<boolean>;
   }
   ```

2. **Create Gemini provider implementation**
   ```typescript
   // src/lib/ai/providers/gemini.ts
   import { google } from '@ai-sdk/google';
   import { generateText } from 'ai';
   import type { ImageProvider, ImageConfig, GenerationResponse } from '../types';

   // Map our config to Gemini's expected values
   const aspectRatioMap: Record<ImageConfig['aspectRatio'], string> = {
     '1:1': '1:1',
     '2:3': '2:3',
     '3:2': '3:2',
     '3:4': '3:4',
     '4:3': '4:3',
     '4:5': '4:5',
     '5:4': '5:4',
     '9:16': '9:16',
     '16:9': '16:9',
     '21:9': '21:9',
   };

   const getResolutionDimensions = (
     aspectRatio: ImageConfig['aspectRatio'],
     resolution: ImageConfig['resolution']
   ): { width: number; height: number } => {
     const baseSize = resolution === '4k' ? 4096 : resolution === '2k' ? 2048 : 1024;

     const [w, h] = aspectRatio.split(':').map(Number);
     const ratio = w / h;

     if (ratio >= 1) {
       return { width: baseSize, height: Math.round(baseSize / ratio) };
     } else {
       return { width: Math.round(baseSize * ratio), height: baseSize };
     }
   };

   export const createGeminiProvider = (): ImageProvider => {
     // Use the correct model ID for image generation
     const model = google('gemini-2.0-flash-exp');  // or gemini-3-pro-image-preview when available

     return {
       name: 'gemini',

       async generateFromText(prompt: string, config: ImageConfig): Promise<GenerationResponse> {
         try {
           const result = await generateText({
             model,
             providerOptions: {
               google: {
                 responseModalities: ['TEXT', 'IMAGE'],
                 imageConfig: {
                   aspectRatio: aspectRatioMap[config.aspectRatio],
                 },
               },
             },
             prompt: `Generate a professional product photo: ${prompt}`,
           });

           // Extract image from response
           const imagePart = result.response?.messages?.[0]?.content?.find(
             (part: { type: string }) => part.type === 'image'
           );

           if (!imagePart || imagePart.type !== 'image') {
             return {
               success: false,
               error: 'No image generated',
               code: 'PROVIDER_ERROR',
               retryable: true,
             };
           }

           const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

           return {
             success: true,
             imageData: imagePart.image,  // base64
             mimeType: imagePart.mimeType || 'image/png',
             ...dimensions,
           };
         } catch (error) {
           return this.handleError(error);
         }
       },

       async generateFromImage(
         sourceImage: Buffer,
         sourceMimeType: string,
         prompt: string,
         config: ImageConfig
       ): Promise<GenerationResponse> {
         try {
           const result = await generateText({
             model,
             providerOptions: {
               google: {
                 responseModalities: ['TEXT', 'IMAGE'],
                 imageConfig: {
                   aspectRatio: aspectRatioMap[config.aspectRatio],
                 },
               },
             },
             messages: [
               {
                 role: 'user',
                 content: [
                   {
                     type: 'text',
                     text: `Transform this product photo: ${prompt}. Create a professional e-commerce image with clean background and good lighting.`,
                   },
                   {
                     type: 'image',
                     image: sourceImage,
                     mimeType: sourceMimeType,
                   },
                 ],
               },
             ],
           });

           // Extract image from response
           const imagePart = result.response?.messages?.[0]?.content?.find(
             (part: { type: string }) => part.type === 'image'
           );

           if (!imagePart || imagePart.type !== 'image') {
             return {
               success: false,
               error: 'No image generated',
               code: 'PROVIDER_ERROR',
               retryable: true,
             };
           }

           const dimensions = getResolutionDimensions(config.aspectRatio, config.resolution);

           return {
             success: true,
             imageData: imagePart.image,
             mimeType: imagePart.mimeType || 'image/png',
             ...dimensions,
           };
         } catch (error) {
           return this.handleError(error);
         }
       },

       async isAvailable(): Promise<boolean> {
         try {
           // Simple test call to check availability
           const result = await generateText({
             model,
             prompt: 'Say "ok"',
             maxTokens: 10,
           });
           return !!result.text;
         } catch {
           return false;
         }
       },

       handleError(error: unknown): GenerationResponse {
         const message = error instanceof Error ? error.message : 'Unknown error';

         // Check for rate limiting
         if (message.includes('429') || message.includes('rate')) {
           return {
             success: false,
             error: 'Rate limit exceeded. Please try again later.',
             code: 'RATE_LIMITED',
             retryable: true,
           };
         }

         // Check for content filtering
         if (message.includes('safety') || message.includes('blocked') || message.includes('policy')) {
           return {
             success: false,
             error: 'Content was filtered by safety policies.',
             code: 'CONTENT_FILTERED',
             retryable: false,
           };
         }

         // Check for invalid input
         if (message.includes('invalid') || message.includes('unsupported')) {
           return {
             success: false,
             error: 'Invalid input provided.',
             code: 'INVALID_INPUT',
             retryable: false,
           };
         }

         return {
           success: false,
           error: message,
           code: 'PROVIDER_ERROR',
           retryable: true,
         };
       },
     } as ImageProvider & { handleError: (error: unknown) => GenerationResponse };
   };
   ```

3. **Create provider factory**
   ```typescript
   // src/lib/ai/index.ts
   import { createGeminiProvider } from './providers/gemini';
   import type { ImageProvider } from './types';

   export type { ImageProvider, ImageConfig, GenerationResponse, GenerationResult, GenerationError } from './types';

   let cachedProvider: ImageProvider | null = null;

   /**
    * Get the configured image generation provider
    * Currently uses Gemini, but can be swapped via env or config
    */
   export const getImageProvider = (): ImageProvider => {
     if (cachedProvider) {
       return cachedProvider;
     }

     // In the future, this could read from env to select provider
     // const providerName = process.env.IMAGE_PROVIDER || 'gemini';

     cachedProvider = createGeminiProvider();
     return cachedProvider;
   };

   /**
    * Clear the cached provider (useful for testing)
    */
   export const clearProviderCache = (): void => {
     cachedProvider = null;
   };
   ```

### Acceptance Criteria

- [ ] Provider interface defined
- [ ] Gemini provider implements interface
- [ ] Error handling covers common cases
- [ ] Provider factory returns singleton

---

## Task 1D.1: AI SDK Setup

**Estimated Time:** 15 minutes

### Steps

1. **Verify environment variables**
   ```bash
   # Check that GOOGLE_GENERATIVE_AI_API_KEY is set in .env.local
   grep GOOGLE_GENERATIVE_AI_API_KEY .env.local
   ```

2. **Create test script**
   ```typescript
   // scripts/test-ai.ts
   // Run with: npx tsx scripts/test-ai.ts

   import { google } from '@ai-sdk/google';
   import { generateText } from 'ai';

   async function testAI() {
     console.log('Testing AI SDK connection...');

     try {
       const result = await generateText({
         model: google('gemini-2.0-flash-exp'),
         prompt: 'Say "Hello ProductPix!"',
         maxTokens: 50,
       });

       console.log('Response:', result.text);
       console.log('AI SDK is working!');
     } catch (error) {
       console.error('Error:', error);
     }
   }

   testAI();
   ```

3. **Run the test**
   ```bash
   npx tsx scripts/test-ai.ts
   ```

### Acceptance Criteria

- [ ] API key configured
- [ ] Test script runs successfully
- [ ] Receives response from Gemini

---

## Task 1D.1.5: Image Validation Utilities (HIGH PRIORITY)

**Estimated Time:** 30 minutes

**Why:** Validating images before sending to expensive AI APIs saves money and provides better error messages.

### Steps

1. **Create image validation utilities**
   ```typescript
   // src/lib/images/validation.ts
   export const IMAGE_CONFIG = {
     maxSizeBytes: 10 * 1024 * 1024,  // 10MB
     minSizeBytes: 1024,               // 1KB minimum
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
   ```

2. **Create index export**
   ```typescript
   // src/lib/images/index.ts
   export * from './validation';
   ```

### Acceptance Criteria

- [ ] MIME type validation by magic bytes
- [ ] File size validation
- [ ] Dimension validation
- [ ] Comprehensive validation function

---

## Task 1D.2: Image Generation Utility

**Estimated Time:** 45 minutes

### Steps

1. **Create main generation function**
   ```typescript
   // src/lib/ai/generate-image.ts
   import { getImageProvider, type ImageConfig, type GenerationResponse } from './index';
   import { uploadBase64Image } from '@/lib/r2';
   import { updateJobStatus } from '@/lib/db/jobs';
   import { refundCredits } from '@/lib/db/credits';

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
           // TODO: Get credits from job record and refund
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
   ```

### Acceptance Criteria

- [ ] Generation function handles text-to-image
- [ ] Generation function handles image-to-image
- [ ] Results uploaded to R2
- [ ] Job status updated appropriately
- [ ] Error handling in place

---

## Task 1D.3: Test Text-to-Image

**Estimated Time:** 30 minutes

### Steps

1. **Create test script**
   ```typescript
   // scripts/test-text-to-image.ts
   // Run with: npx tsx scripts/test-text-to-image.ts

   import { getImageProvider } from '../src/lib/ai';
   import * as fs from 'fs';

   async function testTextToImage() {
     console.log('Testing text-to-image generation...');

     const provider = getImageProvider();

     const result = await provider.generateFromText(
       'A professional product photo of a red leather handbag on a clean white background with soft shadows',
       {
         aspectRatio: '1:1',
         resolution: '1k',
       }
     );

     if (result.success) {
       console.log('Generation successful!');
       console.log(`Size: ${result.width}x${result.height}`);
       console.log(`Type: ${result.mimeType}`);

       // Save to file for inspection
       const buffer = Buffer.from(result.imageData, 'base64');
       fs.writeFileSync('test-output.png', buffer);
       console.log('Saved to test-output.png');
     } else {
       console.error('Generation failed:', result.error);
       console.error('Code:', result.code);
       console.error('Retryable:', result.retryable);
     }
   }

   testTextToImage().catch(console.error);
   ```

2. **Run and verify**
   ```bash
   npx tsx scripts/test-text-to-image.ts
   # Check test-output.png
   ```

### Acceptance Criteria

- [ ] Text-to-image generation works
- [ ] Output image is valid
- [ ] Quality is acceptable for product photos

---

## Task 1D.4: Image Upload Handler

**Estimated Time:** 45 minutes

**Note:** This uses presigned URLs from Phase 1A.8. This task handles the confirmation step after upload.

### Steps

1. **Create upload confirmation route**
   ```typescript
   // src/app/api/upload/confirm/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';
   import { createUpload } from '@/lib/db/uploads';
   import { z } from 'zod';

   const requestSchema = z.object({
     fileKey: z.string().min(1),
     filename: z.string().min(1),
     mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
     fileSize: z.number().positive(),
     width: z.number().positive().optional(),
     height: z.number().positive().optional(),
   });

   export async function POST(request: NextRequest) {
     try {
       // Authenticate user
       const supabase = await createClient();
       const { data: { user }, error: authError } = await supabase.auth.getUser();

       if (authError || !user) {
         return NextResponse.json(
           { error: 'Unauthorized' },
           { status: 401 }
         );
       }

       // Validate request
       const body = await request.json();
       const parsed = requestSchema.safeParse(body);

       if (!parsed.success) {
         return NextResponse.json(
           { error: 'Invalid request', details: parsed.error.issues },
           { status: 400 }
         );
       }

       const { fileKey, filename, mimeType, fileSize, width, height } = parsed.data;

       // Verify the file key belongs to this user
       if (!fileKey.startsWith(`uploads/${user.id}/`)) {
         return NextResponse.json(
           { error: 'Invalid file key' },
           { status: 403 }
         );
       }

       // Create upload record
       const upload = await createUpload({
         user_id: user.id,
         filename,
         file_key: fileKey,
         file_size: fileSize,
         mime_type: mimeType,
         width: width ?? null,
         height: height ?? null,
       });

       if (!upload) {
         return NextResponse.json(
           { error: 'Failed to create upload record' },
           { status: 500 }
         );
       }

       return NextResponse.json({
         uploadId: upload.id,
         fileKey: upload.file_key,
       });
     } catch (error) {
       console.error('Upload confirm error:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }
   ```

### Acceptance Criteria

- [ ] Endpoint validates user authentication
- [ ] Creates upload record in database
- [ ] Returns upload ID for use in generation

---

## Task 1D.5: Image-to-Image Generation

**Estimated Time:** 1 hour

### Steps

1. **Create test script**
   ```typescript
   // scripts/test-image-to-image.ts
   // Run with: npx tsx scripts/test-image-to-image.ts <input-image-path>

   import { getImageProvider } from '../src/lib/ai';
   import { validateImage, getMimeTypeFromBuffer } from '../src/lib/images';
   import * as fs from 'fs';

   async function testImageToImage() {
     const inputPath = process.argv[2];
     if (!inputPath) {
       console.error('Usage: npx tsx scripts/test-image-to-image.ts <input-image-path>');
       process.exit(1);
     }

     console.log('Testing image-to-image generation...');
     console.log('Input:', inputPath);

     // Read source image
     const sourceBuffer = fs.readFileSync(inputPath);
     const mimeType = getMimeTypeFromBuffer(sourceBuffer);

     if (!mimeType) {
       console.error('Could not determine image type');
       process.exit(1);
     }

     // Validate
     const validation = validateImage(sourceBuffer, mimeType);
     if (!validation.valid) {
       console.error('Validation failed:', validation.error);
       process.exit(1);
     }

     console.log(`Source: ${mimeType}, ${sourceBuffer.length} bytes`);

     const provider = getImageProvider();

     const result = await provider.generateFromImage(
       sourceBuffer,
       mimeType,
       'Professional product photo with clean white background, soft shadows, studio lighting',
       {
         aspectRatio: '1:1',
         resolution: '1k',
       }
     );

     if (result.success) {
       console.log('Generation successful!');
       console.log(`Output: ${result.width}x${result.height}, ${result.mimeType}`);

       const buffer = Buffer.from(result.imageData, 'base64');
       fs.writeFileSync('test-output-transformed.png', buffer);
       console.log('Saved to test-output-transformed.png');
     } else {
       console.error('Generation failed:', result.error);
       console.error('Code:', result.code);
     }
   }

   testImageToImage().catch(console.error);
   ```

2. **Test with various inputs**
   ```bash
   # Test with a product image
   npx tsx scripts/test-image-to-image.ts /path/to/product.jpg
   ```

### Acceptance Criteria

- [ ] Image-to-image transformation works
- [ ] Source image is properly passed to AI
- [ ] Output maintains product appearance
- [ ] Background is properly transformed

---

## Task 1D.6: Response Handling

**Estimated Time:** 30 minutes

### Steps

1. **Create generated image record function**
   ```typescript
   // src/lib/db/generated-images.ts
   import { createClient } from '@/lib/supabase/server';
   import { createAdminClient } from '@/lib/supabase/admin';
   import type { GeneratedImage } from '@/types';

   export interface CreateGeneratedImageParams {
     jobId: string;
     userId: string;
     fileKey: string;
     publicUrl: string;
     width: number;
     height: number;
     fileSize?: number;
   }

   export const createGeneratedImage = async (
     params: CreateGeneratedImageParams
   ): Promise<GeneratedImage | null> => {
     const supabase = createAdminClient();

     const { data, error } = await supabase
       .from('generated_images')
       .insert({
         job_id: params.jobId,
         user_id: params.userId,
         file_key: params.fileKey,
         public_url: params.publicUrl,
         width: params.width,
         height: params.height,
         file_size: params.fileSize ?? null,
       })
       .select()
       .single();

     if (error) {
       console.error('Error creating generated image record:', error);
       return null;
     }

     return data;
   };

   export const getUserGeneratedImages = async (
     userId: string,
     limit = 50
   ): Promise<GeneratedImage[]> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('generated_images')
       .select('*')
       .eq('user_id', userId)
       .is('deleted_at', null)
       .order('created_at', { ascending: false })
       .limit(limit);

     if (error) {
       console.error('Error fetching generated images:', error);
       return [];
     }

     return data;
   };

   export const toggleFavorite = async (
     imageId: string,
     userId: string
   ): Promise<boolean> => {
     const supabase = await createClient();

     // Get current state
     const { data: current } = await supabase
       .from('generated_images')
       .select('is_favorite')
       .eq('id', imageId)
       .eq('user_id', userId)
       .single();

     if (!current) return false;

     // Toggle
     const { error } = await supabase
       .from('generated_images')
       .update({ is_favorite: !current.is_favorite })
       .eq('id', imageId)
       .eq('user_id', userId);

     return !error;
   };

   export const softDeleteImage = async (
     imageId: string,
     userId: string
   ): Promise<boolean> => {
     const supabase = await createClient();

     const { error } = await supabase
       .from('generated_images')
       .update({ deleted_at: new Date().toISOString() })
       .eq('id', imageId)
       .eq('user_id', userId);

     return !error;
   };
   ```

2. **Update generate-image to save record**
   ```typescript
   // Update src/lib/ai/generate-image.ts
   // Add after uploading to R2:

   import { createGeneratedImage } from '@/lib/db/generated-images';

   // ... in generateImage function, after successful upload:

   // Save generated image record
   await createGeneratedImage({
     jobId,
     userId,
     fileKey: uploadResult.fileKey,
     publicUrl: uploadResult.publicUrl,
     width: result.width,
     height: result.height,
     fileSize: Buffer.from(result.imageData, 'base64').length,
   });
   ```

### Acceptance Criteria

- [ ] Generated images saved to database
- [ ] Can query user's generated images
- [ ] Favorite toggle works
- [ ] Soft delete works

---

## Task 1D.7: Generation API Route

**Estimated Time:** 45 minutes

### Steps

1. **Create generation endpoint**
   ```typescript
   // src/app/api/generate/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';
   import { createGenerationJob, getJob } from '@/lib/db/jobs';
   import { getUpload } from '@/lib/db/uploads';
   import { generateImage } from '@/lib/ai/generate-image';
   import { getPublicUrl } from '@/lib/r2';
   import { z } from 'zod';

   const requestSchema = z.object({
     uploadId: z.string().uuid().optional(),
     prompt: z.string().min(10).max(1000),
     aspectRatio: z.enum(['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9']).default('1:1'),
     resolution: z.enum(['1k', '2k', '4k']).default('1k'),
   });

   export async function POST(request: NextRequest) {
     try {
       // Authenticate user
       const supabase = await createClient();
       const { data: { user }, error: authError } = await supabase.auth.getUser();

       if (authError || !user) {
         return NextResponse.json(
           { error: 'Unauthorized' },
           { status: 401 }
         );
       }

       // Validate request
       const body = await request.json();
       const parsed = requestSchema.safeParse(body);

       if (!parsed.success) {
         return NextResponse.json(
           { error: 'Invalid request', details: parsed.error.issues },
           { status: 400 }
         );
       }

       const { uploadId, prompt, aspectRatio, resolution } = parsed.data;

       // Calculate credits based on resolution
       const creditCost = resolution === '4k' ? 3 : resolution === '2k' ? 2 : 1;

       // If uploadId provided, fetch the upload
       let sourceImage: Buffer | undefined;
       let sourceMimeType: string | undefined;

       if (uploadId) {
         const upload = await getUpload(uploadId);
         if (!upload) {
           return NextResponse.json(
             { error: 'Upload not found' },
             { status: 404 }
           );
         }

         // Verify ownership
         if (upload.user_id !== user.id) {
           return NextResponse.json(
             { error: 'Not authorized to use this upload' },
             { status: 403 }
           );
         }

         // Fetch image from R2
         const imageUrl = getPublicUrl(upload.file_key);
         const response = await fetch(imageUrl);
         if (!response.ok) {
           return NextResponse.json(
             { error: 'Failed to fetch source image' },
             { status: 500 }
           );
         }

         sourceImage = Buffer.from(await response.arrayBuffer());
         sourceMimeType = upload.mime_type;
       }

       // Create job with credit consumption
       const jobResult = await createGenerationJob(
         user.id,
         uploadId ?? null,
         prompt,
         { aspectRatio, resolution },
         creditCost
       );

       if (!jobResult.success || !jobResult.job_id) {
         return NextResponse.json(
           { error: jobResult.message },
           { status: 400 }
         );
       }

       // Start generation (synchronous for MVP, async with Trigger.dev in Phase 2)
       const result = await generateImage({
         jobId: jobResult.job_id,
         userId: user.id,
         prompt,
         sourceImage,
         sourceMimeType,
         config: { aspectRatio, resolution },
       });

       if (!result.success) {
         return NextResponse.json(
           { error: result.error, jobId: jobResult.job_id },
           { status: 500 }
         );
       }

       return NextResponse.json({
         success: true,
         jobId: jobResult.job_id,
         imageUrl: result.imageUrl,
         fileKey: result.fileKey,
       });
     } catch (error) {
       console.error('Generate error:', error);
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       );
     }
   }

   // Get job status
   export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url);
     const jobId = searchParams.get('jobId');

     if (!jobId) {
       return NextResponse.json(
         { error: 'jobId required' },
         { status: 400 }
       );
     }

     const supabase = await createClient();
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) {
       return NextResponse.json(
         { error: 'Unauthorized' },
         { status: 401 }
       );
     }

     const job = await getJob(jobId);

     if (!job || job.user_id !== user.id) {
       return NextResponse.json(
         { error: 'Job not found' },
         { status: 404 }
       );
     }

     return NextResponse.json({ job });
   }
   ```

### Acceptance Criteria

- [ ] POST endpoint creates job and generates image
- [ ] GET endpoint returns job status
- [ ] Credit deduction works
- [ ] Proper error responses

---

## Task 1D.8: Aspect Ratio Support

**Estimated Time:** 20 minutes

**Already implemented in Task 1D.0** — the provider abstraction handles aspect ratios. This task verifies all ratios work.

### Steps

1. **Create test script for all ratios**
   ```typescript
   // scripts/test-aspect-ratios.ts
   import { getImageProvider, type ImageConfig } from '../src/lib/ai';

   const aspectRatios: ImageConfig['aspectRatio'][] = [
     '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
   ];

   async function testAspectRatios() {
     const provider = getImageProvider();

     for (const ratio of aspectRatios) {
       console.log(`Testing ${ratio}...`);

       const result = await provider.generateFromText(
         'A simple red circle on white background',
         { aspectRatio: ratio, resolution: '1k' }
       );

       if (result.success) {
         console.log(`  ✓ ${ratio}: ${result.width}x${result.height}`);
       } else {
         console.log(`  ✗ ${ratio}: ${result.error}`);
       }

       // Rate limit protection
       await new Promise(resolve => setTimeout(resolve, 2000));
     }
   }

   testAspectRatios().catch(console.error);
   ```

### Acceptance Criteria

- [ ] All aspect ratios generate successfully
- [ ] Output dimensions match expected ratios

---

## Task 1D.9: Rate Limiting (HIGH PRIORITY)

**Estimated Time:** 45 minutes

**Why:** Without rate limiting, a single user can drain your AI API budget or overwhelm the system.

### Steps

1. **Install Upstash (or use in-memory for dev)**
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. **Create rate limiter utility**
   ```typescript
   // src/lib/rate-limit/index.ts
   import { Ratelimit } from '@upstash/ratelimit';
   import { Redis } from '@upstash/redis';

   // Use Upstash Redis in production, in-memory in development
   const redis = process.env.UPSTASH_REDIS_REST_URL
     ? new Redis({
         url: process.env.UPSTASH_REDIS_REST_URL,
         token: process.env.UPSTASH_REDIS_REST_TOKEN!,
       })
     : null;

   // In-memory store for development
   const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

   /**
    * Simple in-memory rate limiter for development
    */
   const inMemoryRatelimit = {
     async limit(identifier: string) {
       const now = Date.now();
       const windowMs = 60 * 1000; // 1 minute
       const maxRequests = 10;

       const record = inMemoryStore.get(identifier);

       if (!record || record.resetAt < now) {
         inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
         return { success: true, remaining: maxRequests - 1 };
       }

       if (record.count >= maxRequests) {
         return { success: false, remaining: 0 };
       }

       record.count++;
       return { success: true, remaining: maxRequests - record.count };
     },
   };

   // Production rate limiter with Upstash
   const upstashRatelimit = redis
     ? new Ratelimit({
         redis,
         limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
         analytics: true,
       })
     : null;

   /**
    * Rate limit a request by identifier (usually user ID)
    */
   export const rateLimit = async (
     identifier: string
   ): Promise<{ success: boolean; remaining: number }> => {
     if (upstashRatelimit) {
       const result = await upstashRatelimit.limit(identifier);
       return { success: result.success, remaining: result.remaining };
     }

     return inMemoryRatelimit.limit(identifier);
   };

   /**
    * Different rate limits for different operations
    */
   export const rateLimiters = {
     // Generation: 10 per minute per user
     generation: async (userId: string) => rateLimit(`generation:${userId}`),

     // Uploads: 20 per minute per user
     upload: async (userId: string) => rateLimit(`upload:${userId}`),

     // API general: 60 per minute per user
     api: async (userId: string) => rateLimit(`api:${userId}`),
   };
   ```

3. **Add rate limiting to generation endpoint**
   ```typescript
   // Update src/app/api/generate/route.ts
   import { rateLimiters } from '@/lib/rate-limit';

   // Add at the beginning of POST handler, after auth:
   const rateLimitResult = await rateLimiters.generation(user.id);
   if (!rateLimitResult.success) {
     return NextResponse.json(
       {
         error: 'Rate limit exceeded. Please try again later.',
         retryAfter: 60,
       },
       {
         status: 429,
         headers: {
           'Retry-After': '60',
           'X-RateLimit-Remaining': String(rateLimitResult.remaining),
         },
       }
     );
   }
   ```

### Acceptance Criteria

- [ ] Rate limiter works in development (in-memory)
- [ ] Upstash integration ready for production
- [ ] Generation endpoint rate limited
- [ ] Proper 429 response with headers

---

## Phase 1D Checklist

| Task | Status | Notes |
|------|--------|-------|
| 1D.0 Provider abstraction | ⬜ | HIGH PRIORITY |
| 1D.1 AI SDK setup | ⬜ | |
| 1D.1.5 Image validation | ⬜ | HIGH PRIORITY |
| 1D.2 Image gen utility | ⬜ | |
| 1D.3 Test text-to-image | ⬜ | |
| 1D.4 Image upload handler | ⬜ | |
| 1D.5 Image-to-image gen | ⬜ | |
| 1D.6 Response handling | ⬜ | |
| 1D.7 Generation API route | ⬜ | |
| 1D.8 Aspect ratio support | ⬜ | |
| 1D.9 Rate limiting | ⬜ | HIGH PRIORITY |

---

## Testing Checklist

- [ ] Text-to-image generates valid images
- [ ] Image-to-image transforms products correctly
- [ ] All aspect ratios work
- [ ] Rate limiting prevents abuse
- [ ] Credits deducted correctly
- [ ] Failed generations refund credits
- [ ] Images saved to R2 and database

---

## Next Phase

Once all tasks are complete, proceed to **Phase 1E: Basic UI**.
