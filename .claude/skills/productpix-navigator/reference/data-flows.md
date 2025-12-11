# Data Flows - Detailed Diagrams

Comprehensive data flow documentation for all major ProductPix operations.

## Image Generation Flow (Detailed)

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: src/app/generate/page.tsx                         │
│                                                              │
│ User fills form:                                             │
│ - Prompt text                                                │
│ - Optional source image                                      │
│ - Generation parameters                                      │
└───────────────────────┬──────────────────────────────────────┘
                        │ POST /api/generate
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ API ROUTE: src/app/api/generate/route.ts                    │
│                                                              │
│ 1. Validate request (Zod schema)                            │
│ 2. Extract user from session                                │
│ 3. Check rate limits                                         │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE: createJob() RPC                                    │
│ src/lib/db/jobs.ts → Supabase RPC                           │
│                                                              │
│ create_generation_job(                                       │
│   user_id,                                                   │
│   template_id,                                               │
│   params                                                     │
│ )                                                            │
│                                                              │
│ Internally calls:                                            │
│ ├─▶ consume_credits(user_id, cost)                          │
│ │   ├─▶ Check users.credits >= cost                         │
│ │   ├─▶ Deduct from users.credits                           │
│ │   └─▶ Insert into credit_transactions                     │
│ │                                                            │
│ └─▶ Insert into jobs table                                  │
│     └─▶ Returns job_id                                      │
└───────────────────────┬──────────────────────────────────────┘
                        │ job created
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ AI PROVIDER: src/lib/ai/providers/gemini.ts                 │
│                                                              │
│ geminiProvider.rawPrompt({                                   │
│   prompt: compiledPrompt,                                    │
│   sourceImage: uploadedImage (optional)                      │
│ })                                                           │
│                                                              │
│ ├─▶ If sourceImage: imagen.editImage()                      │
│ └─▶ Else: imagen.generateImages()                           │
└───────────────────────┬──────────────────────────────────────┘
                        │ Base64 image response
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ STORAGE: src/lib/r2/index.ts                                │
│                                                              │
│ uploadToR2({                                                 │
│   buffer: Buffer.from(base64),                               │
│   key: generated-images/{uuid}.png                           │
│ })                                                           │
│                                                              │
│ ├─▶ Convert base64 to buffer                                │
│ ├─▶ Generate unique R2 key                                  │
│ ├─▶ Upload to Cloudflare R2                                 │
│ └─▶ Return public URL                                       │
└───────────────────────┬──────────────────────────────────────┘
                        │ r2_url
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE: saveGeneratedImage()                               │
│ src/lib/db/generated-images.ts                              │
│                                                              │
│ Insert into generated_images:                                │
│ - job_id                                                     │
│ - r2_url                                                     │
│ - r2_key                                                     │
│ - cost (calculated from pricing config)                      │
│ - metadata                                                   │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE: updateJobStatus()                                  │
│ src/lib/db/jobs.ts                                          │
│                                                              │
│ Update jobs SET                                              │
│   status = 'completed',                                      │
│   completed_at = now()                                       │
│ WHERE id = job_id                                            │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ RESPONSE: Return to client                                   │
│                                                              │
│ {                                                            │
│   imageUrl: string,                                          │
│   jobId: string,                                             │
│   creditsRemaining: number                                   │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
```

### Error Handling in Generation Flow

```
At each step, errors are caught and handled:

API Route
├─▶ Validation error → 400 Bad Request
├─▶ Unauthorized → 401 Unauthorized
└─▶ Rate limit → 429 Too Many Requests

createJob() RPC
├─▶ Insufficient credits → CreditError
│   └─▶ Credits NOT deducted
│   └─▶ Job NOT created
└─▶ Database error → 500 Internal Server Error

Gemini API
├─▶ Timeout → TimeoutError
│   └─▶ refund_credits() RPC called
│   └─▶ Job status = 'failed'
└─▶ Content policy violation → PolicyError
    └─▶ refund_credits() RPC called
    └─▶ Job status = 'failed'

R2 Upload
└─▶ Upload failed → StorageError
    └─▶ refund_credits() RPC called
    └─▶ Job status = 'failed'
```

## Source Image Upload Flow (Browser → R2)

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: src/components/forms/* (file input)               │
│                                                              │
│ User selects image file                                      │
│ - Validate file type (image/png, image/jpeg)                │
│ - Validate file size (< 10MB)                               │
└───────────────────────┬──────────────────────────────────────┘
                        │ POST /api/upload
                        │ { filename, contentType }
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ API ROUTE: src/app/api/upload/route.ts                      │
│                                                              │
│ 1. Validate request                                          │
│ 2. Generate unique R2 key: uploads/{userId}/{uuid}.ext      │
│ 3. Call getPresignedUrl()                                    │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ R2 CLIENT: src/lib/r2/index.ts                              │
│                                                              │
│ getPresignedUrl({                                            │
│   key: uploads/{userId}/{uuid}.ext,                          │
│   expiresIn: 3600 (1 hour)                                   │
│ })                                                           │
│                                                              │
│ Returns:                                                     │
│ {                                                            │
│   presignedUrl: "https://...",                               │
│   r2Key: "uploads/...",                                      │
│   publicUrl: "https://..."                                   │
│ }                                                            │
└───────────────────────┬──────────────────────────────────────┘
                        │ Return to client
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: Direct browser upload                             │
│                                                              │
│ fetch(presignedUrl, {                                        │
│   method: 'PUT',                                             │
│   body: fileBlob,                                            │
│   headers: { 'Content-Type': contentType }                   │
│ })                                                           │
│                                                              │
│ ⚠️  CRITICAL: This goes DIRECTLY to R2, NOT through server  │
└───────────────────────┬──────────────────────────────────────┘
                        │ Upload complete
                        │ POST /api/upload/confirm
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ API ROUTE: Confirm upload                                    │
│                                                              │
│ createUpload({                                               │
│   user_id,                                                   │
│   r2_key,                                                    │
│   r2_url,                                                    │
│   filename,                                                  │
│   content_type                                               │
│ })                                                           │
│                                                              │
│ Insert into uploads table                                    │
└──────────────────────────────────────────────────────────────┘
```

### Why Direct Browser Upload?

1. **Performance**: No server bottleneck, parallel uploads
2. **Cost**: Reduces server bandwidth costs
3. **Scalability**: R2 handles upload load, not Next.js server

### CORS Configuration Required

R2 bucket must have CORS configured (see docs/r2-cors-setup.md):
- AllowedOrigins: localhost:3000, productpix.app
- AllowedMethods: GET, PUT, HEAD
- AllowedHeaders: Content-Type, x-amz-*

## Credit Purchase Flow (Stripe)

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: src/app/pricing/page.tsx                          │
│                                                              │
│ User clicks "Buy 100 Credits" button                         │
│ - Selected tier: { credits: 100, price: 10 }                │
└───────────────────────┬──────────────────────────────────────┘
                        │ POST /api/stripe/checkout
                        │ { priceId }
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ API ROUTE: src/app/api/stripe/checkout/route.ts             │
│                                                              │
│ 1. Get or create Stripe customer                            │
│ 2. Create checkout session:                                 │
│    stripe.checkout.sessions.create({                         │
│      customer: stripeCustomerId,                             │
│      line_items: [{ price: priceId, quantity: 1 }],          │
│      metadata: { userId, credits },                          │
│      success_url: /success?session_id={CHECKOUT_SESSION_ID}, │
│      cancel_url: /pricing                                    │
│    })                                                        │
│                                                              │
│ 3. Return { url: session.url }                              │
└───────────────────────┬──────────────────────────────────────┘
                        │ Redirect to Stripe
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ STRIPE: Hosted checkout                                      │
│                                                              │
│ User completes payment on Stripe-hosted page                 │
│ - Enter payment details                                      │
│ - Stripe processes payment                                   │
└───────────────────────┬──────────────────────────────────────┘
                        │ Payment successful
                        │ Webhook event: checkout.session.completed
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ WEBHOOK: src/app/api/webhooks/stripe/route.ts               │
│                                                              │
│ 1. Verify Stripe signature                                  │
│ 2. Extract event data:                                       │
│    - userId from metadata                                    │
│    - credits from metadata                                   │
│    - session_id                                              │
│                                                              │
│ 3. Call add_credits RPC                                      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE: add_credits() RPC                                  │
│ src/lib/db/credits.ts → Supabase RPC                         │
│                                                              │
│ BEGIN TRANSACTION;                                           │
│                                                              │
│ UPDATE users                                                 │
│ SET credits = credits + amount                               │
│ WHERE id = user_id;                                          │
│                                                              │
│ INSERT INTO credit_transactions (                            │
│   user_id,                                                   │
│   amount,                                                    │
│   type,           -- 'purchase'                              │
│   stripe_session_id                                          │
│ );                                                           │
│                                                              │
│ COMMIT;                                                      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ REDIRECT: User returns to success page                      │
│                                                              │
│ src/app/success/page.tsx                                     │
│ - Fetch session from Stripe                                  │
│ - Display success message                                    │
│ - Show new credit balance                                    │
└──────────────────────────────────────────────────────────────┘
```

## Batch Generation Flow

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: src/app/batch/new/page.tsx                        │
│                                                              │
│ User creates batch:                                          │
│ - Upload CSV with product data                               │
│ - Select prompt template                                     │
│ - Configure batch settings                                   │
└───────────────────────┬──────────────────────────────────────┘
                        │ POST /api/batch
                        │ { templateId, items: [...] }
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ API ROUTE: src/app/api/batch/route.ts                       │
│                                                              │
│ 1. Validate batch request                                    │
│ 2. Calculate total cost                                      │
│ 3. Check user has sufficient credits                         │
│ 4. Create batch record                                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ DATABASE: createBatch()                                      │
│ src/lib/db/batch.ts                                         │
│                                                              │
│ INSERT INTO batches (                                        │
│   user_id,                                                   │
│   template_id,                                               │
│   total_items,                                               │
│   status,         -- 'pending'                               │
│   metadata                                                   │
│ )                                                            │
│ RETURNING batch_id                                           │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ CREATE JOBS: Loop through batch items                       │
│                                                              │
│ for each item in batch.items:                                │
│   createJob({                                                │
│     user_id,                                                 │
│     template_id,                                             │
│     batch_id,                                                │
│     params: item.variables                                   │
│   })                                                         │
│                                                              │
│ Each job follows standard generation flow                    │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ BACKGROUND PROCESSING                                        │
│                                                              │
│ Jobs processed sequentially or in parallel                   │
│ (depending on implementation)                                │
│                                                              │
│ Each job updates batch progress:                             │
│ - Increment completed_items                                  │
│ - Update batch.status when all complete                      │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ MONITORING: src/app/batch/[batchId]/page.tsx                │
│                                                              │
│ Poll GET /api/batch/[id] every 5 seconds                     │
│                                                              │
│ Display:                                                     │
│ - Progress: 23/100 images generated                          │
│ - Status: processing, completed, failed                      │
│ - Generated images gallery                                   │
│ - Error summary if failures                                  │
└──────────────────────────────────────────────────────────────┘
```

## prompt-bench Testing Flow

```
┌──────────────────────────────────────────────────────────────┐
│ CLI: bun bench test --template ecommerce-base               │
│                                                              │
│ Entry: prompt-bench/cli.ts                                   │
│ Command: prompt-bench/commands/test.ts                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 1: RUN (Generate Images)                               │
│ prompt-bench/commands/run.ts                                 │
│                                                              │
│ 1. Load template from registry                               │
│ 2. Load batch file (JSON with test cases)                    │
│ 3. Compile prompts (template + variables)                    │
│ 4. For each test case:                                       │
│    ├─▶ Create prompt_test record (idempotent by hash)       │
│    ├─▶ Call Gemini API                                      │
│    ├─▶ Upload image to R2                                   │
│    └─▶ Save to generated_images table                       │
│                                                              │
│ Output: Test batch with N images in R2                       │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 2: EVALUATE (Score Images)                             │
│ prompt-bench/commands/evaluate.ts                            │
│                                                              │
│ 1. Fetch all images for batch label                          │
│ 2. For each image:                                           │
│    ├─▶ Fetch image from R2 URL                              │
│    ├─▶ Send to Claude with evaluation prompt                │
│    ├─▶ Parse score (0-100)                                  │
│    └─▶ Save to prompt_evaluations table                     │
│                                                              │
│ 3. Calculate statistics (mean, median, std dev)              │
│                                                              │
│ Output: Evaluation scores for all images                     │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────────┐
│ STEP 3: REPORT (Generate HTML)                              │
│ prompt-bench/commands/report.ts                              │
│                                                              │
│ 1. Query evaluation results                                  │
│ 2. Generate statistics:                                      │
│    ├─▶ Score distribution histogram                         │
│    ├─▶ Mean, median, std dev                                │
│    └─▶ Baseline comparison (if available)                   │
│                                                              │
│ 3. Optional: Generate AI insights                            │
│    └─▶ Analyze patterns, suggest improvements               │
│                                                              │
│ 4. Render HTML report                                        │
│ 5. Save to prompt-bench/reports/{label}.html                 │
│ 6. Open in browser                                           │
└──────────────────────────────────────────────────────────────┘
```

## Data Transformations Reference

| Stage | Input Format | Output Format | Location |
|-------|--------------|---------------|----------|
| **Form Submission** | FormData | JSON object | Frontend components |
| **API Validation** | JSON object | Validated DTO | API route handlers (Zod) |
| **Gemini Response** | Base64 string | Buffer | `src/lib/ai/providers/gemini.ts` |
| **R2 Upload** | Buffer | R2 URL | `src/lib/r2/index.ts` |
| **Database Storage** | R2 URL + metadata | Database record | `src/lib/db/*.ts` |
| **Client Response** | Database record | JSON API response | API route handlers |
| **prompt-bench Template** | Template + vars | Compiled prompt | `prompt-bench/core/compiler.ts` |
| **Evaluation** | R2 URL | Score (0-100) | `prompt-bench/core/evaluator.ts` |
