# Phase 1A: Project Foundation

**ProductPix.app — AI-Powered Product Photo Generator**

---

## Overview

This document covers the initial project setup for ProductPix, a SaaS application that uses AI (Gemini 3 Pro Image) to generate professional product photos for e-commerce sellers on Poshmark, eBay, and Etsy.

### Why This Phase Matters

The foundation phase establishes the core infrastructure that every other component depends on. Poor decisions here cascade through the entire project. We're setting up:

- Next.js with App Router (server components, streaming, API routes)
- Supabase client configuration (database + auth)
- Cloudflare R2 for image storage (zero egress costs)
- Environment variable management
- Project structure following functional programming principles

### Tech Stack Context

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Framework | Next.js 14+ (App Router) | Server components, Vercel deployment synergy |
| Database | Supabase (Postgres) | RLS for multi-tenancy, Realtime for job updates |
| Storage | Cloudflare R2 | S3-compatible, zero egress (critical for image-heavy app) |
| AI | Vercel AI SDK + Gemini 3 Pro Image | Native image generation, up to 4K output |

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] A Google Cloud account with Gemini API access
- [ ] A Supabase account (free tier works for development)
- [ ] A Cloudflare account with R2 enabled
- [ ] Git configured

---

## Task 1A.0: Validate Gemini API Access (CRITICAL)

**Priority:** 🔴 CRITICAL — Do this FIRST before any other work

**Why:** Gemini 3 Pro Image is a preview model with regional restrictions. If you can't access it, the entire project architecture needs to change.

### Regional Restrictions

Image generation is **NOT available** in:
- United Kingdom
- Several countries in Europe, Middle East & Africa

### Steps

1. **Get API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/)
   - Create a new API key
   - Save it securely (you'll add to `.env.local` later)

2. **Test API Access**
   ```bash
   curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "contents": [{
         "parts": [{
           "text": "Generate a product photo of a red leather handbag on a white background with soft shadows"
         }]
       }],
       "generationConfig": {
         "responseModalities": ["TEXT", "IMAGE"]
       }
     }'
   ```

3. **Expected Response**
   - Success: JSON with base64 image data
   - Failure (region blocked): Error mentioning unsupported region/modality
   - Failure (no access): 403 or model not found error

4. **If Blocked**
   - Consider using a VPN for development (not production)
   - Switch to alternative: `gemini-2.5-flash-preview-04-17` (Flash Image model)
   - Or implement Stability AI / Replicate as fallback

### Acceptance Criteria

- [ ] Successfully received a generated image response
- [ ] API key saved securely
- [ ] Confirmed which model(s) are accessible

---

## Task 1A.1: Create Next.js Project

**Estimated Time:** 15 minutes

### Steps

1. **Create the project**
   ```bash
   cd /home/kevin/coding/product-pix
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```

   When prompted:
   - Would you like to use TypeScript? **Yes**
   - Would you like to use ESLint? **Yes**
   - Would you like to use Tailwind CSS? **Yes**
   - Would you like to use `src/` directory? **Yes**
   - Would you like to use App Router? **Yes**
   - Would you like to customize the default import alias? **Yes** → `@/*`

2. **Verify installation**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 — you should see the Next.js welcome page.

### Acceptance Criteria

- [ ] Project created with App Router
- [ ] TypeScript configured
- [ ] Tailwind CSS working
- [ ] Dev server runs without errors

---

## Task 1A.2: Project Structure

**Estimated Time:** 15 minutes

**Why:** A well-organized structure makes the codebase navigable and enforces separation of concerns. We follow functional programming principles — no classes unless required by frameworks.

### Steps

1. **Create the folder structure**
   ```bash
   cd /home/kevin/coding/product-pix

   # Core application folders
   mkdir -p src/lib/ai/providers
   mkdir -p src/lib/db
   mkdir -p src/lib/r2
   mkdir -p src/lib/auth
   mkdir -p src/lib/utils

   # Components
   mkdir -p src/components/ui
   mkdir -p src/components/forms
   mkdir -p src/components/layout

   # Types
   mkdir -p src/types

   # Server-side code (API routes use app/api)
   mkdir -p src/server/actions

   # Supabase
   mkdir -p supabase/migrations
   ```

2. **Create placeholder files**
   ```bash
   # Type definitions
   touch src/types/database.ts
   touch src/types/ai.ts
   touch src/types/api.ts

   # Lib index files
   touch src/lib/ai/index.ts
   touch src/lib/db/index.ts
   touch src/lib/r2/index.ts
   touch src/lib/auth/index.ts
   ```

### Directory Purpose

```
src/
├── app/                    # Next.js App Router pages and API routes
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Input, etc.)
│   ├── forms/              # Form components (UploadForm, PromptInput)
│   └── layout/             # Layout components (Header, Footer, Sidebar)
├── lib/
│   ├── ai/
│   │   ├── providers/      # AI provider implementations (Gemini, fallbacks)
│   │   ├── index.ts        # Provider factory and main exports
│   │   └── types.ts        # AI-related type definitions
│   ├── db/                 # Database utilities and queries
│   ├── r2/                 # Cloudflare R2 utilities
│   ├── auth/               # Authentication utilities
│   └── utils/              # General utilities
├── server/
│   └── actions/            # Server actions for forms
├── types/                  # Global type definitions
└── ...
```

### Acceptance Criteria

- [ ] All directories created
- [ ] Placeholder files in place
- [ ] Structure follows functional programming principles

---

## Task 1A.3: Environment Variables

**Estimated Time:** 10 minutes

**Why:** Centralizing environment configuration prevents secrets from being scattered across the codebase and makes deployment configuration straightforward.

### Steps

1. **Create `.env.local` template**
   ```bash
   cat > .env.local << 'EOF'
   # ===========================================
   # ProductPix Environment Configuration
   # ===========================================

   # Google AI (Gemini)
   # Get from: https://aistudio.google.com/
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here

   # Supabase
   # Get from: Supabase Dashboard > Settings > API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Cloudflare R2
   # Get from: Cloudflare Dashboard > R2 > Manage R2 API Tokens
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key_id
   R2_SECRET_ACCESS_KEY=your_secret_access_key
   R2_BUCKET_NAME=productpix-images
   R2_PUBLIC_URL=https://your-bucket.r2.dev

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Rate Limiting (Upstash Redis - optional for dev)
   # UPSTASH_REDIS_REST_URL=
   # UPSTASH_REDIS_REST_TOKEN=

   # Stripe (Phase 3)
   # STRIPE_SECRET_KEY=
   # STRIPE_WEBHOOK_SECRET=
   # NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   EOF
   ```

2. **Create `.env.example`** (for version control)
   ```bash
   cat > .env.example << 'EOF'
   # Google AI (Gemini)
   GOOGLE_GENERATIVE_AI_API_KEY=

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # Cloudflare R2
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET_NAME=
   R2_PUBLIC_URL=

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   EOF
   ```

3. **Update `.gitignore`**
   ```bash
   echo "" >> .gitignore
   echo "# Environment files" >> .gitignore
   echo ".env.local" >> .gitignore
   echo ".env*.local" >> .gitignore
   ```

4. **Create environment validation**
   ```typescript
   // src/lib/env.ts
   import { z } from 'zod';

   const envSchema = z.object({
     // Google AI
     GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),

     // Supabase
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
     SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

     // R2
     R2_ACCOUNT_ID: z.string().min(1),
     R2_ACCESS_KEY_ID: z.string().min(1),
     R2_SECRET_ACCESS_KEY: z.string().min(1),
     R2_BUCKET_NAME: z.string().min(1),
     R2_PUBLIC_URL: z.string().url(),

     // App
     NEXT_PUBLIC_APP_URL: z.string().url(),
   });

   export const env = envSchema.parse(process.env);
   ```

### Acceptance Criteria

- [ ] `.env.local` created with all placeholders
- [ ] `.env.example` created for version control
- [ ] `.gitignore` updated to exclude env files
- [ ] Environment validation schema created

---

## Task 1A.4: Core Dependencies

**Estimated Time:** 10 minutes

**Why:** Installing all dependencies upfront prevents version conflicts and ensures consistent development environment.

### Steps

1. **Install core dependencies**
   ```bash
   npm install ai @ai-sdk/google zod @supabase/supabase-js @supabase/ssr
   ```

2. **Install R2/S3 dependencies**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

3. **Install UI dependencies**
   ```bash
   npm install lucide-react clsx tailwind-merge
   ```

4. **Install development dependencies**
   ```bash
   npm install -D @types/node
   ```

5. **Verify package.json**
   ```bash
   cat package.json | grep -A 50 '"dependencies"'
   ```

### Expected Dependencies

```json
{
  "dependencies": {
    "ai": "^4.x",
    "@ai-sdk/google": "^1.x",
    "zod": "^3.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "@aws-sdk/client-s3": "^3.x",
    "@aws-sdk/s3-request-presigner": "^3.x",
    "lucide-react": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "next": "14.x",
    "react": "^18.x",
    "react-dom": "^18.x"
  }
}
```

### Acceptance Criteria

- [ ] All dependencies installed without errors
- [ ] No peer dependency warnings (or documented if unavoidable)
- [ ] `npm run build` succeeds

---

## Task 1A.5: Supabase Project Setup

**Estimated Time:** 20 minutes

**Why:** Supabase provides our database (Postgres), authentication, and real-time capabilities. Setting it up correctly is essential for the entire application.

### Steps

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization (or create one)
   - Set project name: `productpix`
   - Set database password (save this!)
   - Select region closest to your users
   - Click "Create new project"

2. **Get Connection Strings**
   - Go to Settings > API
   - Copy:
     - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

3. **Update `.env.local`**
   ```bash
   # Update these values in .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

4. **Install Supabase CLI** (for local development)
   ```bash
   npm install -D supabase
   npx supabase init
   ```

5. **Link to remote project**
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
   (Get project ref from Supabase dashboard URL)

### Acceptance Criteria

- [ ] Supabase project created
- [ ] All API keys saved to `.env.local`
- [ ] Supabase CLI installed and linked
- [ ] Can access Supabase dashboard

---

## Task 1A.6: Supabase Client Configuration

**Estimated Time:** 30 minutes

**Why:** We need separate Supabase clients for browser (client components) and server (API routes, server components). This ensures proper authentication context in each environment.

### Steps

1. **Create browser client**
   ```typescript
   // src/lib/supabase/client.ts
   import { createBrowserClient } from '@supabase/ssr';
   import type { Database } from '@/types/database';

   export const createClient = () => {
     return createBrowserClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     );
   };
   ```

2. **Create server client**
   ```typescript
   // src/lib/supabase/server.ts
   import { createServerClient, type CookieOptions } from '@supabase/ssr';
   import { cookies } from 'next/headers';
   import type { Database } from '@/types/database';

   export const createClient = async () => {
     const cookieStore = await cookies();

     return createServerClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll();
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options)
               );
             } catch {
               // Called from Server Component — ignore
             }
           },
         },
       }
     );
   };
   ```

3. **Create admin client** (for server-side operations that bypass RLS)
   ```typescript
   // src/lib/supabase/admin.ts
   import { createClient } from '@supabase/supabase-js';
   import type { Database } from '@/types/database';

   export const createAdminClient = () => {
     return createClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!,
       {
         auth: {
           autoRefreshToken: false,
           persistSession: false,
         },
       }
     );
   };
   ```

4. **Create middleware for auth**
   ```typescript
   // src/middleware.ts
   import { createServerClient } from '@supabase/ssr';
   import { NextResponse, type NextRequest } from 'next/server';

   export async function middleware(request: NextRequest) {
     let supabaseResponse = NextResponse.next({
       request,
     });

     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return request.cookies.getAll();
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) =>
               request.cookies.set(name, value)
             );
             supabaseResponse = NextResponse.next({
               request,
             });
             cookiesToSet.forEach(({ name, value, options }) =>
               supabaseResponse.cookies.set(name, value, options)
             );
           },
         },
       }
     );

     // Refresh session if needed
     await supabase.auth.getUser();

     return supabaseResponse;
   }

   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     ],
   };
   ```

5. **Create index export**
   ```typescript
   // src/lib/supabase/index.ts
   export { createClient } from './client';
   export { createClient as createServerClient } from './server';
   export { createAdminClient } from './admin';
   ```

### Acceptance Criteria

- [ ] Browser client created
- [ ] Server client created with cookie handling
- [ ] Admin client created for bypassing RLS
- [ ] Middleware configured for session refresh
- [ ] All clients properly typed with Database type

---

## Task 1A.7: Cloudflare R2 Bucket Setup

**Estimated Time:** 20 minutes

**Why:** R2 provides S3-compatible object storage with zero egress fees — critical for an image-heavy application. We need to configure the bucket and generate API credentials.

### Steps

1. **Create R2 Bucket**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to R2 > Overview
   - Click "Create bucket"
   - Name: `productpix-images`
   - Location: Automatic (or choose region)
   - Click "Create bucket"

2. **Configure Public Access** (for serving generated images)
   - Go to bucket settings
   - Under "Public access", click "Allow Access"
   - Copy the public URL (e.g., `https://pub-xxx.r2.dev`)
   - Add to `.env.local` as `R2_PUBLIC_URL`

3. **Generate API Token**
   - Go to R2 > Overview > Manage R2 API Tokens
   - Click "Create API token"
   - Token name: `productpix-dev`
   - Permissions: Object Read & Write
   - Specify bucket: `productpix-images`
   - TTL: No expiration (or set as needed)
   - Click "Create API Token"
   - **SAVE THE CREDENTIALS IMMEDIATELY** (shown only once)

4. **Get Account ID**
   - Found in the URL: `dash.cloudflare.com/<ACCOUNT_ID>/r2`
   - Or go to any Cloudflare page, it's in the right sidebar

5. **Update `.env.local`**
   ```bash
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key_id
   R2_SECRET_ACCESS_KEY=your_secret_access_key
   R2_BUCKET_NAME=productpix-images
   R2_PUBLIC_URL=https://pub-xxx.r2.dev
   ```

6. **Configure CORS**
   - See separate document: `docs/r2-cors-setup.md`

### Acceptance Criteria

- [ ] R2 bucket created
- [ ] Public access configured
- [ ] API token generated and saved
- [ ] All R2 credentials in `.env.local`
- [ ] CORS configured (see separate doc)

---

## Task 1A.8: R2 Utilities with Presigned URLs

**Estimated Time:** 45 minutes

**Why:** Instead of routing large image uploads through Next.js API routes (which have size limits and timeout issues), we generate presigned URLs that let browsers upload directly to R2.

### Architecture Decision

```
Traditional (problematic):
Browser → Next.js API → R2
         (size limits, timeouts)

Presigned URL (recommended):
Browser → Get presigned URL from API → Upload directly to R2
         (no size limits, faster)
```

### Steps

1. **Create R2 client**
   ```typescript
   // src/lib/r2/client.ts
   import { S3Client } from '@aws-sdk/client-s3';

   export const r2Client = new S3Client({
     region: 'auto',
     endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
     credentials: {
       accessKeyId: process.env.R2_ACCESS_KEY_ID!,
       secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
     },
   });

   export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
   export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;
   ```

2. **Create presigned URL utilities**
   ```typescript
   // src/lib/r2/presigned.ts
   import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
   import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
   import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './client';

   interface PresignedUploadResult {
     uploadUrl: string;
     fileKey: string;
     publicUrl: string;
   }

   /**
    * Generate a presigned URL for direct browser upload to R2
    * @param userId - User ID for namespacing
    * @param filename - Original filename
    * @param contentType - MIME type of the file
    * @param expiresIn - URL expiration in seconds (default 1 hour)
    */
   export const getPresignedUploadUrl = async (
     userId: string,
     filename: string,
     contentType: string,
     expiresIn = 3600
   ): Promise<PresignedUploadResult> => {
     const timestamp = Date.now();
     const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
     const fileKey = `uploads/${userId}/${timestamp}-${sanitizedFilename}`;

     const command = new PutObjectCommand({
       Bucket: R2_BUCKET,
       Key: fileKey,
       ContentType: contentType,
     });

     const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });

     return {
       uploadUrl,
       fileKey,
       publicUrl: `${R2_PUBLIC_URL}/${fileKey}`,
     };
   };

   /**
    * Generate a presigned URL for downloading a private file
    */
   export const getPresignedDownloadUrl = async (
     fileKey: string,
     expiresIn = 3600
   ): Promise<string> => {
     const command = new GetObjectCommand({
       Bucket: R2_BUCKET,
       Key: fileKey,
     });

     return getSignedUrl(r2Client, command, { expiresIn });
   };

   /**
    * Delete a file from R2
    */
   export const deleteFile = async (fileKey: string): Promise<void> => {
     const command = new DeleteObjectCommand({
       Bucket: R2_BUCKET,
       Key: fileKey,
     });

     await r2Client.send(command);
   };

   /**
    * Get the public URL for a file
    */
   export const getPublicUrl = (fileKey: string): string => {
     return `${R2_PUBLIC_URL}/${fileKey}`;
   };
   ```

3. **Create upload utilities for server-side use**
   ```typescript
   // src/lib/r2/upload.ts
   import { PutObjectCommand } from '@aws-sdk/client-s3';
   import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './client';

   interface UploadResult {
     fileKey: string;
     publicUrl: string;
   }

   /**
    * Upload a buffer directly to R2 (for server-side use, e.g., saving AI-generated images)
    */
   export const uploadBuffer = async (
     buffer: Buffer,
     fileKey: string,
     contentType: string
   ): Promise<UploadResult> => {
     const command = new PutObjectCommand({
       Bucket: R2_BUCKET,
       Key: fileKey,
       Body: buffer,
       ContentType: contentType,
     });

     await r2Client.send(command);

     return {
       fileKey,
       publicUrl: `${R2_PUBLIC_URL}/${fileKey}`,
     };
   };

   /**
    * Upload a base64-encoded image (common format from AI responses)
    */
   export const uploadBase64Image = async (
     base64Data: string,
     userId: string,
     jobId: string,
     format: 'png' | 'jpeg' | 'webp' = 'png'
   ): Promise<UploadResult> => {
     const buffer = Buffer.from(base64Data, 'base64');
     const fileKey = `generated/${userId}/${jobId}.${format}`;
     const contentType = `image/${format}`;

     return uploadBuffer(buffer, fileKey, contentType);
   };
   ```

4. **Create index export**
   ```typescript
   // src/lib/r2/index.ts
   export { r2Client, R2_BUCKET, R2_PUBLIC_URL } from './client';
   export { getPresignedUploadUrl, getPresignedDownloadUrl, deleteFile, getPublicUrl } from './presigned';
   export { uploadBuffer, uploadBase64Image } from './upload';
   ```

5. **Create API route for presigned URLs**
   ```typescript
   // src/app/api/upload/presign/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';
   import { getPresignedUploadUrl } from '@/lib/r2';
   import { z } from 'zod';

   const requestSchema = z.object({
     filename: z.string().min(1).max(255),
     contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
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

       // Generate presigned URL
       const result = await getPresignedUploadUrl(
         user.id,
         parsed.data.filename,
         parsed.data.contentType
       );

       return NextResponse.json(result);
     } catch (error) {
       console.error('Presign error:', error);
       return NextResponse.json(
         { error: 'Failed to generate upload URL' },
         { status: 500 }
       );
     }
   }
   ```

### Acceptance Criteria

- [ ] R2 client configured
- [ ] Presigned URL generation working
- [ ] Server-side upload utilities created
- [ ] API route for presigned URLs created
- [ ] Can successfully upload a test image

---

## Phase 1A Checklist

| Task | Status | Notes |
|------|--------|-------|
| 1A.0 Validate Gemini API | ⬜ | CRITICAL - do first |
| 1A.1 Create Next.js project | ⬜ | |
| 1A.2 Project structure | ⬜ | |
| 1A.3 Environment variables | ⬜ | |
| 1A.4 Core dependencies | ⬜ | |
| 1A.5 Supabase project | ⬜ | |
| 1A.6 Supabase clients | ⬜ | |
| 1A.7 R2 bucket setup | ⬜ | See CORS doc |
| 1A.8 R2 utilities | ⬜ | |

---

## Next Phase

Once all tasks are complete, proceed to **Phase 1B: Database Schema**.
