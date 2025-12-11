# Error Patterns - Catalog & Diagnosis

Common errors, root causes, and resolution steps for ProductPix.

## Quick Diagnosis Table

| Error Contains | Likely Cause | First Check | File Location |
|----------------|--------------|-------------|---------------|
| `CREDIT` or `InsufficientCredits` | Credit system | User balance | `src/lib/db/credits.ts` |
| `AUTH` or `Unauthorized` | Authentication | Session/token | `src/lib/auth/*` |
| `TIMEOUT` | External service | Service status | `src/lib/ai/providers/*` |
| `PRISMA` or database error | Database | Connection/schema | `src/lib/supabase/*` |
| `R2` or `S3` or `UploadError` | Storage | Bucket permissions | `src/lib/r2/*` |
| `GEMINI` or image generation | Gemini API | API key/quota | `src/lib/ai/providers/gemini.ts` |
| `STRIPE` | Payment processing | Webhook config | `src/lib/stripe/*` |
| `RLS` or Row Level Security | Supabase RLS | Client type | `src/lib/supabase/*` |

## Credit System Errors

### CreditError: Insufficient credits

**Symptom**: User sees "Not enough credits" error when attempting generation

**Error Location**: `src/lib/db/jobs.ts` → `createJob()` → `consume_credits` RPC

**Root Cause**: User's credit balance < required cost

**Investigation**:
```bash
# Check user's credit balance (Supabase Dashboard or direct query)
SELECT id, email, credits FROM users WHERE email = 'user@example.com';

# Check recent credit transactions
SELECT * FROM credit_transactions
WHERE user_id = '<user_id>'
ORDER BY created_at DESC
LIMIT 10;
```

**Resolution**:
1. User needs to purchase more credits
2. Check if credits were incorrectly deducted (refund if needed)
3. Verify pricing calculation is correct in `src/lib/pricing/`

**Prevention**:
- Frontend shows credit balance before generation
- Disable generate button when insufficient credits
- Add credit warnings at < 10 credits remaining

---

### CreditError: Refund failed

**Symptom**: Generation failed but credits weren't refunded

**Error Location**: `src/app/api/generate/route.ts` → `refund_credits` RPC

**Root Cause**:
- RPC call failed
- Database transaction rolled back
- Network error during refund

**Investigation**:
```bash
# Check job status
SELECT * FROM jobs
WHERE id = '<job_id>';

# Check if refund transaction exists
SELECT * FROM credit_transactions
WHERE job_id = '<job_id>' AND type = 'refund';
```

**Resolution**:
1. Manually refund credits:
```sql
-- In Supabase SQL Editor
SELECT refund_credits('<user_id>', <amount>, '<job_id>');
```

2. Investigate why refund RPC failed (check Supabase logs)

---

## Authentication Errors

### Unauthorized: No session

**Symptom**: API returns 401 Unauthorized

**Error Location**: Any protected API route

**Root Cause**:
- User not logged in
- Session expired
- Cookie not sent (CORS issue)

**Investigation**:
```typescript
// In API route
const supabase = createClient()
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session, 'Error:', error)
```

**Resolution**:
1. Check if user is logged in on frontend
2. Verify session cookie is being sent
3. Check Supabase auth configuration
4. Ensure correct Supabase client (client vs server)

**Code Location**: `src/lib/auth/hooks.ts` for session management

---

### RLS Error: Row Level Security policy violation

**Symptom**: Database query returns empty or fails with "permission denied"

**Error Location**: Any Supabase query

**Root Cause**:
- Using wrong Supabase client (client when admin needed)
- RLS policy doesn't allow the operation
- User ID mismatch in query

**Investigation**:
```typescript
// Check which client is being used
import { createClient } from '@/lib/supabase/client'    // RLS enforced
import { createClient } from '@/lib/supabase/server'    // RLS enforced
import { getAdminClient } from '@/lib/supabase/admin'   // BYPASSES RLS

// Verify user ID in query matches authenticated user
const { data: { user } } = await supabase.auth.getUser()
console.log('Authenticated user:', user?.id)
console.log('Query user_id:', queryUserId)
```

**Resolution**:
1. Use admin client for system operations: `getAdminClient()`
2. Verify RLS policies in Supabase Dashboard
3. Ensure user_id in query matches authenticated user

**Critical Files**:
- `src/lib/supabase/client.ts` - Browser client (RLS enforced)
- `src/lib/supabase/server.ts` - Server client (RLS enforced)
- `src/lib/supabase/admin.ts` - Admin client (bypasses RLS)

---

## External Service Errors

### TimeoutError: Gemini API timeout

**Symptom**: Generation spinner indefinitely, then timeout error

**Error Location**: `src/lib/ai/providers/gemini.ts`

**Root Cause**:
- Gemini API took > 30s to respond
- Network connectivity issue
- Gemini service degradation

**Investigation**:
```bash
# Check Gemini API status
curl -I https://generativelanguage.googleapis.com/

# Check if API key is valid
echo $GEMINI_API_KEY

# Review API logs
grep "TimeoutError" logs/api.log | tail -20
```

**Resolution**:
1. Retry generation (usually works)
2. Check Google Cloud status page
3. Increase timeout if needed (currently 30s)
4. Verify API key is valid and has quota

**Code Location**: `src/lib/ai/providers/gemini.ts` - timeout configuration

---

### GeminiError: Content policy violation

**Symptom**: Generation fails with "Content policy violation" error

**Error Location**: `src/lib/ai/providers/gemini.ts`

**Root Cause**: Prompt or source image violates Google's content policies

**Investigation**:
```bash
# Check the prompt that triggered the violation
SELECT prompt, source_image_url FROM jobs WHERE id = '<job_id>';
```

**Resolution**:
1. Review prompt for policy violations
2. Modify prompt to comply with policies
3. Credits should be automatically refunded
4. User should see helpful error message

**Prevention**:
- Add content policy guidelines to UI
- Implement client-side prompt validation
- Add warning for sensitive keywords

---

## Storage (R2) Errors

### UploadError: R2 presigned URL expired

**Symptom**: Upload fails with 403 Forbidden after delay

**Error Location**: Frontend upload to presigned URL

**Root Cause**: Presigned URL expired (default 1 hour)

**Investigation**:
```typescript
// Check presigned URL expiration
const url = new URL(presignedUrl)
const expiresParam = url.searchParams.get('X-Amz-Expires')
console.log('URL expires in:', expiresParam, 'seconds')
```

**Resolution**:
1. Request new presigned URL
2. Retry upload immediately
3. Don't cache presigned URLs

**Code Location**: `src/lib/r2/index.ts` → `getPresignedUrl()`

---

### UploadError: CORS error

**Symptom**: Browser upload fails with CORS error in console

**Error Location**: Browser PUT request to R2

**Root Cause**: R2 bucket missing CORS configuration

**Investigation**:
```bash
# Check CORS configuration
npx wrangler r2 bucket cors list productpix-images
```

**Resolution**:
1. Apply CORS configuration (see docs/r2-cors-setup.md)
```bash
npx wrangler r2 bucket cors put productpix-images --rules ./r2-cors.json
```

2. Verify CORS includes:
   - AllowedOrigins: localhost:3000, productpix.app
   - AllowedMethods: GET, PUT, HEAD
   - AllowedHeaders: Content-Type, x-amz-*

**Critical**: NEVER use `"*"` for AllowedOrigins in production

---

### UploadError: Multipart upload incomplete

**Symptom**: Upload stuck at 99%, then times out

**Error Location**: R2 multipart upload

**Root Cause**: R2 multipart upload didn't complete (network interruption)

**Investigation**:
```bash
# Check for incomplete uploads in R2
# (would need custom script or Wrangler extension)
```

**Resolution**:
1. Abort incomplete upload
2. Retry with new presigned URL
3. Consider smaller chunk sizes for large files

---

## Database Errors

### Supabase Connection Error

**Symptom**: "Could not connect to database" or timeout

**Error Location**: Any database query

**Root Cause**:
- Invalid Supabase URL or key
- Network connectivity issue
- Supabase project paused/deleted

**Investigation**:
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/
```

**Resolution**:
1. Verify `.env.local` has correct Supabase credentials
2. Check Supabase project status in dashboard
3. Restart dev server after env changes

---

### RPC Error: Function not found

**Symptom**: `FunctionNotFoundError: create_generation_job`

**Error Location**: RPC call in `src/lib/db/*.ts`

**Root Cause**:
- RPC function not deployed to Supabase
- Function name typo
- Migration not run

**Investigation**:
```bash
# Check if function exists in Supabase
# Dashboard → Database → Functions

# Or query pg_proc
SELECT proname FROM pg_proc WHERE proname LIKE '%create_generation_job%';
```

**Resolution**:
1. Run database migrations:
```bash
npx supabase db push
```

2. Verify function exists in Supabase Dashboard
3. Check function name spelling

**Migration Files**: `supabase/migrations/*.sql`

---

## Payment (Stripe) Errors

### Stripe Webhook Signature Verification Failed

**Symptom**: Webhook returns 400, credits not added

**Error Location**: `src/app/api/webhooks/stripe/route.ts`

**Root Cause**:
- Wrong webhook secret
- Request body already consumed
- Clock skew

**Investigation**:
```typescript
// Log webhook signature verification
console.log('Stripe signature:', request.headers.get('stripe-signature'))
console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET)
```

**Resolution**:
1. Verify webhook secret in `.env.local` matches Stripe Dashboard
2. Ensure raw request body is used (not parsed JSON)
3. Check Stripe webhook logs in Dashboard

**Code Location**: `src/app/api/webhooks/stripe/route.ts`

---

### Stripe Checkout Session Creation Failed

**Symptom**: "Buy Credits" button fails

**Error Location**: `src/app/api/stripe/checkout/route.ts`

**Root Cause**:
- Invalid Stripe price ID
- Stripe API key invalid
- Network error

**Investigation**:
```bash
# Verify Stripe API key
echo $STRIPE_SECRET_KEY

# Test Stripe connection
stripe prices list --limit 5
```

**Resolution**:
1. Verify Stripe API keys in `.env.local`
2. Check price IDs exist in Stripe Dashboard
3. Review Stripe API logs

---

## prompt-bench Errors

### Template Not Found

**Symptom**: `bun bench test --template foo` fails with "Template not found"

**Error Location**: `prompt-bench/templates/registry.ts`

**Root Cause**:
- Template not registered in registry
- Template file missing
- Typo in template slug

**Investigation**:
```bash
# List available templates
ls prompt-bench/templates/*.ts

# Check registry
grep "slug:" prompt-bench/templates/registry.ts
```

**Resolution**:
1. Create template file in `prompt-bench/templates/`
2. Register in `prompt-bench/templates/registry.ts`
3. Run `bun bench sync` to sync to database

---

### Evaluation Model Error

**Symptom**: `bun bench evaluate` fails with model error

**Error Location**: `prompt-bench/core/evaluator.ts`

**Root Cause**:
- Invalid evaluation model in config
- API key missing for model provider
- Model not available

**Investigation**:
```bash
# Check config
cat prompt-bench.toml | grep evaluation_model

# Verify API key for provider
echo $ANTHROPIC_API_KEY  # For Claude models
```

**Resolution**:
1. Update `prompt-bench.toml` with valid model
2. Set required API key in `.env`
3. Restart CLI after env changes

---

### Idempotency Key Collision

**Symptom**: Re-running test doesn't create new records

**Error Location**: `prompt-bench/commands/run.ts`

**Root Cause**: This is expected behavior! Tests use hash keys for idempotency.

**Investigation**:
```bash
# Check if test already exists
# Hash = SHA256(template_slug + batch_label + variables)
```

**Resolution**:
1. This is intentional - prevents duplicate tests
2. To create new test, change batch_label:
```bash
bun bench test --template foo --label new-batch-1
```

---

## Pricing Errors

### Unknown Model Error

**Symptom**: Generation fails with "Unknown model: xyz"

**Error Location**: `src/lib/pricing/models.ts`

**Root Cause**: Model not defined in `prompt-bench.toml`

**Investigation**:
```bash
# Check pricing config
cat prompt-bench.toml | grep -A 5 "[models"
```

**Resolution**:
1. Add model to `prompt-bench.toml`:
```toml
[models.google."imagen-3.0-generate-001"]
input_price_per_million = 0.04
output_price_per_million = 0.0
```

2. Restart server/CLI

**Critical**: Never guess provider - always throw error for unknown models

---

## General Debugging Commands

```bash
# Check all environment variables are loaded
bun dev 2>&1 | grep -i "env\|config"

# Tail API logs in development
tail -f .next/server/app-paths-manifest.json

# Check Supabase connection
npx supabase db remote commit

# Test R2 connectivity
npx wrangler r2 bucket list

# Verify Stripe webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Check prompt-bench database connection
bun bench sync --dry-run
```

## Error Recovery Checklist

When encountering any error:

1. **Identify error type** (use Quick Diagnosis Table above)
2. **Check logs** (browser console, server logs, external service dashboards)
3. **Verify environment** (API keys, database connection, service status)
4. **Reproduce locally** (can you trigger the error in dev?)
5. **Check recent changes** (git log, recent deploys)
6. **Consult error-specific section** (above)
7. **Document solution** (add to this file if new pattern)
