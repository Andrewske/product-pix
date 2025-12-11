# Debugging Playbooks

Step-by-step investigation procedures for common ProductPix issues.

## Playbook Index

- [Generation Not Working](#playbook-generation-not-working)
- [Credits Not Updating](#playbook-credits-not-updating)
- [Upload Failures](#playbook-upload-failures)
- [Authentication Issues](#playbook-authentication-issues)
- [Payment/Stripe Issues](#playbook-paymentstripe-issues)
- [Batch Processing Stuck](#playbook-batch-processing-stuck)
- [prompt-bench Test Failures](#playbook-prompt-bench-test-failures)

---

## Playbook: Generation Not Working

**Symptoms**: User clicks "Generate" but image doesn't appear, spinner indefinitely, or error message

### Step 1: Identify Error Type

Check browser console and network tab:
```bash
# Browser DevTools Console
# Look for error messages

# Network tab → Filter by /api/generate
# Check response status code and body
```

**Error indicators**:
- 401 → [Auth playbook](#playbook-authentication-issues)
- 402/403 with "credits" → [Credits playbook](#playbook-credits-not-updating)
- 500 → Continue to Step 2
- Timeout → Likely Gemini API issue (Step 4)

### Step 2: Reproduce Locally

```bash
# Start dev server with debug logging
DEBUG=* bun dev

# Trigger generation from UI
# Watch server logs for:
# - API route hit (/api/generate)
# - Credit check
# - Gemini call
# - Storage upload
```

**Look for**:
- Where in the flow does it fail?
- Any error messages in server console?

### Step 3: Check User State

```sql
-- In Supabase SQL Editor
SELECT
  u.id,
  u.email,
  u.credits,
  COUNT(j.id) as total_jobs,
  COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed_jobs
FROM users u
LEFT JOIN jobs j ON j.user_id = u.id
WHERE u.email = 'user@example.com'
GROUP BY u.id, u.email, u.credits;
```

**Check**:
- Does user have enough credits?
- Any pattern in failed jobs?

### Step 4: Check External Services

```bash
# Gemini API status
curl -I https://generativelanguage.googleapis.com/

# Verify API key
echo $GEMINI_API_KEY
# Should start with "AIza..."

# Test Gemini API directly
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"instances":[{"prompt":"a red apple"}]}'
```

**If Gemini fails**:
- Check quota in Google Cloud Console
- Verify API key permissions
- Check Google Cloud status page

### Step 5: Check R2 Storage

```bash
# List recent R2 objects
npx wrangler r2 object list productpix-images --limit 10

# Check R2 bucket permissions
npx wrangler r2 bucket cors list productpix-images
```

**If R2 fails**:
- Verify R2 credentials in `.env.local`
- Check CORS configuration
- Test presigned URL generation

### Step 6: Database Investigation

```sql
-- Check recent failed jobs
SELECT
  j.id,
  j.created_at,
  j.status,
  j.error_message,
  j.metadata
FROM jobs j
WHERE j.user_id = '<user_id>'
  AND j.status = 'failed'
ORDER BY j.created_at DESC
LIMIT 10;

-- Check if credits were deducted
SELECT *
FROM credit_transactions
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 10;
```

**Look for**:
- Patterns in error messages
- Were credits deducted but not refunded?
- Specific job IDs to investigate

### Step 7: Manual Generation Test

```bash
# Create a test script to isolate the issue
# Create: scripts/test-generation.ts

import { geminiProvider } from '@/lib/ai/providers/gemini'

const result = await geminiProvider.rawPrompt({
  prompt: 'A simple test image',
  model: 'imagen-3.0-generate-001'
})

console.log('Result:', result)

# Run with:
bun run scripts/test-generation.ts
```

**This tests**:
- Gemini API connection
- API key validity
- Image generation in isolation

### Resolution Checklist

- [ ] Error identified in logs
- [ ] User has sufficient credits
- [ ] Gemini API is accessible
- [ ] R2 storage is accessible
- [ ] No RLS policy issues
- [ ] Failed jobs investigated
- [ ] Issue documented for future reference

---

## Playbook: Credits Not Updating

**Symptoms**: User purchased credits but balance not updated, or credits deducted but not refunded

### Step 1: Verify Purchase Occurred

```bash
# Check Stripe Dashboard
# → Payments
# → Search for customer email
# → Verify payment status = "succeeded"
```

**If payment failed**:
- User needs to retry purchase
- No credits should be added

**If payment succeeded**, continue to Step 2.

### Step 2: Check Webhook Delivery

```bash
# Stripe Dashboard → Developers → Webhooks
# → Click webhook endpoint
# → View recent events

# Look for:
# - checkout.session.completed event
# - Delivery status (succeeded vs failed)
# - Response code from your endpoint
```

**If webhook failed**:
- Check webhook signature secret in `.env.local`
- Review webhook handler code: `src/app/api/webhooks/stripe/route.ts`
- Retry webhook from Stripe Dashboard

### Step 3: Check Database

```sql
-- Find user's credit transactions
SELECT *
FROM credit_transactions
WHERE user_id = '<user_id>'
  AND type = 'purchase'
ORDER BY created_at DESC;

-- Check current balance
SELECT credits FROM users WHERE id = '<user_id>';
```

**If transaction missing**:
- Webhook didn't process successfully
- Manually add credits (Step 5)

**If transaction exists but balance wrong**:
- RPC may have failed mid-transaction
- Investigate database logs

### Step 4: Check Webhook Logs

```bash
# In your application logs
grep "stripe.*webhook" logs/api.log | tail -50

# Or add temporary logging to webhook handler
# src/app/api/webhooks/stripe/route.ts
console.log('Webhook event:', event.type)
console.log('Metadata:', event.data.object.metadata)
```

**Look for**:
- Signature verification errors
- Parsing errors
- RPC call failures

### Step 5: Manual Credit Addition

If purchase confirmed but credits not added:

```sql
-- Manually add credits via RPC
SELECT add_credits(
  '<user_id>',
  100,                           -- amount
  'manual',                      -- type
  'Manual credit addition due to webhook failure'  -- description
);

-- Verify balance updated
SELECT credits FROM users WHERE id = '<user_id>';
```

**Document**:
- Why manual addition was needed
- Webhook event ID from Stripe
- Resolution steps for future

### Step 6: Refund Investigation

For credits not refunded after failed generation:

```sql
-- Check job status
SELECT id, status, created_at, error_message
FROM jobs
WHERE user_id = '<user_id>'
  AND status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours';

-- Check if refund exists
SELECT *
FROM credit_transactions
WHERE job_id = '<job_id>'
  AND type = 'refund';
```

**If refund missing**:

```sql
-- Manually refund credits
SELECT refund_credits(
  '<user_id>',
  10,            -- amount to refund
  '<job_id>'
);
```

### Resolution Checklist

- [ ] Purchase verified in Stripe
- [ ] Webhook delivery confirmed
- [ ] Credit transaction in database
- [ ] User balance is correct
- [ ] Issue root cause identified
- [ ] Prevention steps documented

---

## Playbook: Upload Failures

**Symptoms**: File upload stuck, CORS errors, or 403 Forbidden

### Step 1: Identify Upload Stage

Upload has 3 stages:
1. Request presigned URL from API
2. Browser uploads directly to R2
3. Confirm upload in database

**Where does it fail?**

```javascript
// Browser DevTools Network tab
// Look for:
// 1. POST /api/upload → Should return presigned URL
// 2. PUT to R2 (long URL with signature) → Should return 200
// 3. POST /api/upload/confirm → Should return success
```

### Step 2: Check Presigned URL Generation

```bash
# Test presigned URL generation
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"filename": "test.png", "contentType": "image/png"}'

# Should return:
# {
#   "presignedUrl": "https://...",
#   "r2Key": "uploads/...",
#   "publicUrl": "https://..."
# }
```

**If fails**:
- Check R2 credentials in `.env.local`
- Verify R2 client initialization: `src/lib/r2/index.ts`

### Step 3: Test Direct R2 Upload

```bash
# Get presigned URL from Step 2
# Test upload with curl

curl -X PUT "<presigned-url>" \
  -H "Content-Type: image/png" \
  --data-binary "@test-image.png"

# Should return 200 OK
```

**If CORS error**:
- Check browser DevTools console for CORS details
- Verify CORS configuration:

```bash
npx wrangler r2 bucket cors list productpix-images
```

**Expected CORS**:
```json
{
  "AllowedOrigins": ["http://localhost:3000", "https://productpix.app"],
  "AllowedMethods": ["GET", "PUT", "HEAD"],
  "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

**If missing or wrong**:
```bash
# Apply CORS (requires r2-cors.json file)
npx wrangler r2 bucket cors put productpix-images --rules ./r2-cors.json
```

### Step 4: Check File Validation

```typescript
// In browser console or component
const file = document.querySelector('input[type="file"]').files[0]
console.log('File type:', file.type)
console.log('File size:', file.size)

// Allowed types: image/png, image/jpeg
// Max size: 10MB (10 * 1024 * 1024 bytes)
```

**If validation fails**:
- Check file type is image/png or image/jpeg
- Check file size < 10MB
- Update validation if needed: `src/lib/images/validation.ts`

### Step 5: Check Network Conditions

```bash
# Slow upload might timeout
# Check browser Network tab → Timing

# If upload takes > 60s, might need to:
# 1. Increase timeout
# 2. Implement multipart upload for large files
# 3. Add retry logic
```

### Resolution Checklist

- [ ] Presigned URL generated successfully
- [ ] CORS configured correctly
- [ ] Direct R2 upload works
- [ ] File validation passes
- [ ] Upload confirmation saved to DB

---

## Playbook: Authentication Issues

**Symptoms**: User logged out unexpectedly, session errors, or unauthorized access

### Step 1: Check Session Status

```typescript
// Browser console
// On any authenticated page

const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Error:', error)

// Or check cookies
document.cookie
// Should see sb-<project>-auth-token
```

**If no session**:
- User needs to log in again
- Check if session expired (default 1 hour)

### Step 2: Verify Supabase Configuration

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Should match Supabase Dashboard → Settings → API
```

**If mismatched**:
- Update `.env.local`
- Restart dev server: `bun dev`

### Step 3: Check RLS Policies

```sql
-- List RLS policies for a table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
```

**Common RLS issues**:
- Policy checks `auth.uid()` but user not authenticated
- Policy checks wrong user_id column
- Policy too restrictive

**Test RLS**:
```sql
-- Test as authenticated user
SET request.jwt.claims.sub = '<user_id>';
SELECT * FROM jobs WHERE user_id = '<user_id>';
```

### Step 4: Check Supabase Client Type

Different contexts require different clients:

```typescript
// Browser components → client.ts
import { createClient } from '@/lib/supabase/client'

// Server components/API routes → server.ts
import { createClient } from '@/lib/supabase/server'

// System operations → admin.ts
import { getAdminClient } from '@/lib/supabase/admin'
```

**Wrong client = auth errors**

### Step 5: Test Authentication Flow

```bash
# Create test script
# scripts/test-auth.ts

import { createClient } from '@/lib/supabase/server'

const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpassword123'
})

console.log('Auth result:', data, error)

# Run with:
bun run scripts/test-auth.ts
```

### Resolution Checklist

- [ ] Session exists and is valid
- [ ] Supabase config correct
- [ ] RLS policies appropriate
- [ ] Correct Supabase client used
- [ ] Authentication flow tested

---

## Playbook: Payment/Stripe Issues

**Symptoms**: Checkout fails, webhook not received, or payment confirmation missing

### Step 1: Test Checkout Session Creation

```bash
# Check Stripe API key
echo $STRIPE_SECRET_KEY
# Should start with "sk_test_" or "sk_live_"

# Test checkout session creation
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"priceId": "price_xxx"}'

# Should return:
# { "url": "https://checkout.stripe.com/..." }
```

**If fails**:
- Verify Stripe API key in `.env.local`
- Check price ID exists in Stripe Dashboard
- Review error message

### Step 2: Test Webhook Locally

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

**Check**:
- Webhook received by your endpoint
- Credits added to database
- No signature verification errors

### Step 3: Verify Webhook Configuration

```bash
# Stripe Dashboard → Developers → Webhooks
# Check:
# - Endpoint URL is correct
# - Events to send includes "checkout.session.completed"
# - Signing secret matches .env.local
```

### Step 4: Check Webhook Handler

Add logging to `src/app/api/webhooks/stripe/route.ts`:

```typescript
export async function POST(request: Request) {
  console.log('[Webhook] Received request')

  const signature = request.headers.get('stripe-signature')
  console.log('[Webhook] Signature:', signature)

  // ... rest of handler

  console.log('[Webhook] Event type:', event.type)
  console.log('[Webhook] Metadata:', event.data.object.metadata)

  // ... rest of handler

  console.log('[Webhook] Credits added successfully')
}
```

**Look for**:
- Where does processing fail?
- Any uncaught errors?

### Resolution Checklist

- [ ] Checkout session creates successfully
- [ ] Webhook endpoint configured
- [ ] Webhook signature verified
- [ ] Credits added to user account
- [ ] User receives confirmation

---

## Playbook: Batch Processing Stuck

**Symptoms**: Batch shows "processing" indefinitely, or some items never complete

### Step 1: Check Batch Status

```sql
-- Get batch overview
SELECT
  b.id,
  b.status,
  b.total_items,
  COUNT(CASE WHEN j.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN j.status = 'failed' THEN 1 END) as failed,
  COUNT(CASE WHEN j.status = 'pending' THEN 1 END) as pending
FROM batches b
LEFT JOIN jobs j ON j.batch_id = b.id
WHERE b.id = '<batch_id>'
GROUP BY b.id, b.status, b.total_items;
```

### Step 2: Find Stuck Jobs

```sql
-- Jobs that started but never completed
SELECT id, status, created_at, updated_at, error_message
FROM jobs
WHERE batch_id = '<batch_id>'
  AND status = 'pending'
  AND created_at < NOW() - INTERVAL '10 minutes';
```

**If jobs are stuck**:
- They may need manual retry or cancellation
- Check if processing logic has issues

### Step 3: Check Failed Jobs

```sql
-- Get error messages from failed jobs
SELECT id, error_message, metadata
FROM jobs
WHERE batch_id = '<batch_id>'
  AND status = 'failed'
ORDER BY created_at DESC;
```

**Common failure patterns**:
- Same error for all → System issue (Gemini API down)
- Different errors → Individual item issues (bad prompts)

### Step 4: Manual Job Retry

```bash
# Create retry script
# scripts/retry-batch-job.ts

import { createJob } from '@/lib/db/jobs'

// Get failed job details
const failedJob = await getJobById('<job_id>')

// Retry with same params
const newJob = await createJob({
  userId: failedJob.user_id,
  templateId: failedJob.template_id,
  params: failedJob.metadata.params
})

console.log('Retry job created:', newJob.id)
```

### Resolution Checklist

- [ ] Batch status understood
- [ ] Stuck jobs identified
- [ ] Failed jobs investigated
- [ ] Jobs retried if appropriate
- [ ] Batch completion tracked

---

## Playbook: prompt-bench Test Failures

**Symptoms**: `bun bench test` fails, evaluation errors, or score anomalies

### Step 1: Isolate Failure Stage

```bash
# Run each stage independently

# Stage 1: Generate images
bun bench run --template ecommerce-base --batch fixtures/test.json

# Stage 2: Evaluate images
bun bench evaluate --label ecommerce-base-test

# Stage 3: Generate report
bun bench report --label ecommerce-base-test
```

**Which stage fails?**

### Step 2: Check Template Compilation

```bash
# Test template in isolation
# Create: prompt-bench/debug-template.ts

import { compilePrompt } from './core/compiler'
import { templates } from './templates/registry'

const template = templates.find(t => t.slug === 'ecommerce-base')
const result = compilePrompt(template.template, {
  product: 'running shoes',
  background: 'white studio'
})

console.log('Compiled:', result)

# Run with:
bun run prompt-bench/debug-template.ts
```

### Step 3: Check Database Connection

```bash
# Test Supabase connection from prompt-bench
# Create: prompt-bench/test-db.ts

import { getAdminClient } from '../src/lib/supabase/admin'

const supabase = getAdminClient()
const { data, error } = await supabase
  .from('prompt_templates')
  .select('*')
  .limit(1)

console.log('DB test:', { data, error })

# Run with:
bun run prompt-bench/test-db.ts
```

### Step 4: Check Evaluation Model

```bash
# Verify evaluation model configured
cat prompt-bench.toml | grep evaluation_model

# Test evaluation model API
# Should have corresponding API key in .env
echo $ANTHROPIC_API_KEY  # For Claude models
echo $OPENAI_API_KEY     # For GPT models
```

### Step 5: Review Test Results

```sql
-- Check test records
SELECT *
FROM prompt_tests
WHERE batch_label = 'ecommerce-base-test'
ORDER BY created_at DESC;

-- Check evaluations
SELECT
  e.id,
  e.score,
  e.feedback,
  i.r2_url
FROM prompt_evaluations e
JOIN generated_images i ON i.id = e.image_id
WHERE e.test_id = '<test_id>'
ORDER BY e.score DESC;
```

### Resolution Checklist

- [ ] Failure stage identified
- [ ] Template compiles correctly
- [ ] Database connection works
- [ ] Evaluation model accessible
- [ ] Test results in database
- [ ] Issue documented

---

## General Debugging Tips

### Enable Verbose Logging

```bash
# Next.js dev mode
DEBUG=* bun dev

# Specific module
DEBUG=supabase:* bun dev

# prompt-bench
DEBUG=true bun bench test
```

### Use Supabase Logs

```bash
# Supabase Dashboard → Logs
# Filter by:
# - API logs (HTTP requests)
# - Postgres logs (database errors)
# - Auth logs (authentication events)
```

### Browser DevTools

```bash
# Network tab:
# - Check request/response payloads
# - Look for failed requests (red)
# - Check timing (slow requests)

# Console tab:
# - Error messages
# - Stack traces
# - Custom console.logs

# Application tab:
# - Cookies (session tokens)
# - Local storage
# - Session storage
```

### Database Query Performance

```sql
-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Explain query plan
EXPLAIN ANALYZE
SELECT * FROM jobs WHERE user_id = '<user_id>';
```
