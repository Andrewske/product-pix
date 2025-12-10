# Image Generation Flow

| Step | Description | File |
|------|-------------|------|
| 1 | **User enters prompt** on generate page, selects aspect ratio | `src/app/generate/page.tsx` |
| 2 | **Optional: Upload source image** - gets presigned URL, uploads direct to R2 | `src/components/forms/upload-form.tsx` |
| 3 | **Submit to API** - validates input with Zod schema | `src/app/api/generate/route.ts` |
| 4 | **Rate limit check** | `src/lib/rate-limit/index.ts` |
| 5 | **Calculate credit cost** based on resolution (1/2/4 credits) | `src/lib/pricing/credits.ts` |
| 6 | **Create job + consume credits** atomically via Supabase RPC | `src/lib/db/jobs.ts` → `createGenerationJob()` |
| 7 | **Call Gemini API** - text-to-image or image-to-image | `src/lib/ai/providers/gemini.ts` |
| 8 | **Upload result to R2** as base64 → buffer → S3 PutObject | `src/lib/r2/upload.ts` |
| 9 | **Save generated_images record** with URL, dimensions | `src/lib/db/generated-images.ts` |
| 10 | **Record generation cost** for billing analytics | `src/lib/db/cost-queries.ts` |
| 11 | **Mark job complete**, return image URL to frontend | `src/lib/ai/generate-image.ts` |
| 12 | **Display result** with download/regenerate options | `src/app/generate/page.tsx` |

**On failure**: Job marked failed, credits refunded if retryable error (`src/lib/db/credits.ts`)
