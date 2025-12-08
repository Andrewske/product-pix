# ProductPix.app

**AI-Powered Product Photo Generator**  
*Project Planning Document — November 2025*

---

## Executive Summary

ProductPix.app is a SaaS product that uses AI to generate professional product photos for e-commerce sellers on platforms like Poshmark, eBay, and Etsy. The app allows users to upload product images and generate studio-quality photos with customizable backgrounds, lighting, and styling.

> **KEY DISCOVERY:** Gemini 3 Pro Preview (`gemini-3-pro-preview`) has native image generation capabilities (Nano Banana Pro). This simplifies the architecture—we can use the Vercel AI SDK with @ai-sdk/google instead of a separate Imagen API. The model supports text-to-image, image-to-image editing, 1K/2K/4K output, and iterative refinement.

---

## Confirmed Tech Stack

| Component | Choice |
|-----------|--------|
| **Framework** | Next.js 14+ (App Router) |
| **AI / Image Gen** | Vercel AI SDK + @ai-sdk/google (Gemini 3 Pro Preview) |
| **Database** | Supabase (Postgres + Realtime + Auth) |
| **Background Jobs** | ~~Trigger.dev~~ **Gemini Batch API + Vercel Cron** (50% cost savings) |
| **File Storage** | Cloudflare R2 (S3-compatible, zero egress) |
| **Authentication** | Supabase Auth |
| **Payments** | Stripe (credit packs + subscriptions) |
| **Hosting** | Vercel |

---

## Gemini 3 Pro Image Generation (Nano Banana Pro)

The Gemini 3 Pro Preview model has native image generation capabilities accessible via the Vercel AI SDK. This is the recommended approach for ProductPix.

### Key Capabilities

- **Text-to-Image:** Generate images from text descriptions
- **Image-to-Image:** Edit/transform existing images with text prompts
- **Multi-Image Input:** Combine up to 14 reference images
- **Resolution:** 1K, 2K, or 4K output
- **Aspect Ratios:** 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- **Iterative Refinement:** Multi-turn conversations to refine output
- **Text Rendering:** Accurate text in images (good for watermarks, labels)

### Basic Usage (AI SDK)

```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text } = await generateText({
  model: google('gemini-3-pro-preview'),
  providerOptions: {
    google: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '1:1' }
    }
  },
  prompt: 'Product photo of a handbag on white background'
});
```

### Image-to-Image (Product Photo Enhancement)

```typescript
const result = await generateText({
  model: google('gemini-3-pro-preview'),
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] }
  },
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: 'Transform this product photo: white background, soft shadows, professional lighting' },
      { type: 'image', image: productImageBuffer }
    ]
  }]
});
```

---

## Project Phases Overview

1. **Phase 1: MVP Foundation** — Project setup, auth, single image generation
2. **Phase 2: Batch Processing** — Gemini Batch API, CSV upload, Vercel Cron polling
3. **Phase 3: Payments & Credits** — Stripe integration, credit system, usage tracking
4. **Phase 4: Polish & Launch** — UI polish, error handling, monitoring, deploy

---

## Phase 1: MVP Foundation — Detailed Tasks

### Phase 1A: Project Foundation

**Goal:** Base Next.js project with core infrastructure ready

| ID | Task | Description | Est. |
|----|------|-------------|------|
| 1A.1 | Create Next.js project | `npx create-next-app@latest` with App Router, TypeScript, Tailwind, ESLint | 15m |
| 1A.2 | Project structure | Create folders: /app, /lib, /components, /types, /server | 15m |
| 1A.3 | Environment variables | Set up .env.local template with placeholders for all services | 10m |
| 1A.4 | Core dependencies | Install: ai, @ai-sdk/google, zod, @supabase/supabase-js, @aws-sdk/client-s3 | 10m |
| 1A.5 | Supabase project | Create project on supabase.com, get connection strings | 20m |
| 1A.6 | Supabase client | Create /lib/supabase/client.ts and /lib/supabase/server.ts | 30m |
| 1A.7 | R2 bucket setup | Create Cloudflare R2 bucket, generate API keys, configure CORS | 20m |
| 1A.8 | R2 utilities | Create /lib/r2/ with upload, download, presigned URL functions | 45m |

---

### Phase 1B: Database Schema

**Goal:** Core database tables for MVP functionality

| ID | Task | Description | Est. |
|----|------|-------------|------|
| 1B.1 | Design schema | Tables: users, credits, jobs, generated_images, uploads | 30m |
| 1B.2 | Create migrations | SQL migrations for all tables with proper indexes | 45m |
| 1B.3 | Row Level Security | RLS policies for user data isolation | 30m |
| 1B.4 | TypeScript types | Generate types matching DB schema in /types/database.ts | 20m |
| 1B.5 | DB utility functions | CRUD helpers in /lib/db/ | 45m |

---

### Phase 1C: Authentication

**Goal:** User signup/login with Supabase Auth

| ID | Task | Description | Est. |
|----|------|-------------|------|
| 1C.1 | Configure Supabase Auth | Enable email/password, configure redirect URLs in dashboard | 15m |
| 1C.2 | Auth middleware | Next.js middleware for protected routes | 30m |
| 1C.3 | Login page | /app/login/page.tsx with email/password form | 45m |
| 1C.4 | Signup page | /app/signup/page.tsx with registration form | 30m |
| 1C.5 | Auth hooks | Create useUser, useSession hooks in /lib/auth/ | 30m |
| 1C.6 | Auth callbacks | Handle OAuth callback, email confirmation routes | 20m |
| 1C.7 | User profile creation | DB trigger to create user record on auth.users insert | 20m |

---

### Phase 1D: Image Generation Core

**Goal:** Working single-image generation with Gemini 3 Pro

| ID | Task | Description | Est. |
|----|------|-------------|------|
| 1D.1 | AI SDK setup | Configure @ai-sdk/google with GOOGLE_GENERATIVE_AI_API_KEY | 15m |
| 1D.2 | Image gen utility | Create /lib/ai/generate-image.ts wrapper with types | 45m |
| 1D.3 | Test text-to-image | Verify gemini-3-pro-preview image generation works | 30m |
| 1D.4 | Image upload handler | API route to accept product images, validate, store temp | 45m |
| 1D.5 | Image-to-image gen | Pass source image + prompt to Gemini for transformation | 1hr |
| 1D.6 | Response handling | Parse base64 image response, save to R2, store metadata | 30m |
| 1D.7 | Generation API route | /app/api/generate/route.ts endpoint | 45m |
| 1D.8 | Aspect ratio support | Implement imageConfig options (1:1, 4:3, 16:9, etc.) | 20m |

---

### Phase 1E: Basic UI

**Goal:** Minimal functional interface for testing

| ID | Task | Description | Est. |
|----|------|-------------|------|
| 1E.1 | Layout component | Header with nav, main content area, footer | 30m |
| 1E.2 | Dashboard page | /app/dashboard/page.tsx - user's home after login | 45m |
| 1E.3 | Upload component | Drag-and-drop image upload with preview | 1hr |
| 1E.4 | Prompt input | Text input/textarea for generation instructions | 30m |
| 1E.5 | Generation preview | Display generated image result with zoom | 30m |
| 1E.6 | Loading states | Skeleton loaders, spinners, progress indicators | 20m |
| 1E.7 | Image gallery | Grid display of user's generated images | 45m |
| 1E.8 | Download function | Download button for generated images | 20m |

---

### Phase 1 Summary

| Sub-Phase | Tasks | Est. Time |
|-----------|-------|-----------|
| 1A: Project Foundation | 8 | ~2.75 hrs |
| 1B: Database Schema | 5 | ~2.75 hrs |
| 1C: Authentication | 7 | ~3.25 hrs |
| 1D: Image Generation Core | 8 | ~5.5 hrs |
| 1E: Basic UI | 8 | ~5.5 hrs |
| **TOTAL PHASE 1** | **36** | **~20 hrs** |

---

## Future Phases (High-Level)

### Phase 2: Batch Processing

> **UPDATED:** Using **Gemini Batch API** instead of Trigger.dev for 50% cost savings.
> **See:** `docs/phase-2-gemini-batch-implementation-plan.md` for detailed implementation plan.

**Key Changes:**
- Using Gemini Batch API for 50% cost savings on image generation
- Vercel Cron for polling instead of Trigger.dev orchestration
- Batch-level progress only (no per-item granularity until completion)
- Zero infrastructure costs beyond Gemini API (~$150-600/month vs ~$250-900/month)
- Latency: Minutes to hours (vs ~20 minutes with real-time approach)

**Implementation:**
- ~~Trigger.dev setup and configuration~~
- CSV upload and parsing
- Gemini Batch API integration (JSONL upload, job submission)
- Vercel Cron polling worker (checks batch status every 5 minutes)
- Batch-level status updates via Supabase Realtime
- Job management UI (cancel only; ~~pause, retry~~)
- Results processing (download JSONL, upload images to R2)

### Phase 3: Payments & Credits

- Stripe integration
- Credit pack purchase flow
- Subscription tier option
- Usage tracking and limits
- Billing history and invoices

### Phase 4: Polish & Launch

- Error handling and edge cases
- UI/UX polish
- Landing page
- Monitoring and alerting
- Production deployment
- Documentation

---

*— End of Planning Document —*
