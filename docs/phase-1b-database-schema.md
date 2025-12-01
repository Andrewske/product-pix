# Phase 1B: Database Schema

**ProductPix.app — AI-Powered Product Photo Generator**

---

## Overview

This document covers the database schema design for ProductPix. We're using Supabase (Postgres) with Row Level Security (RLS) to ensure proper data isolation between users.

### Why This Phase Matters

The database schema is the foundation of your application's data model. Getting it right early prevents painful migrations later. Key considerations:

- **Atomic credit operations** — Prevent race conditions when deducting credits
- **Audit trail** — Track all credit transactions for billing disputes
- **Job lifecycle** — Support pending → processing → completed/failed states
- **Soft deletes** — Allow data recovery and maintain referential integrity

### Schema Overview

```
┌─────────────────┐     ┌──────────────────────┐
│     users       │────▶│  credit_transactions │
└────────┬────────┘     └──────────────────────┘
         │
         ├──────────────┬──────────────────┐
         ▼              ▼                  ▼
┌─────────────┐  ┌─────────────┐  ┌──────────────────┐
│   uploads   │  │    jobs     │  │ generated_images │
└─────────────┘  └──────┬──────┘  └──────────────────┘
                        │
                        └──────────▶ (references uploads)
```

---

## Prerequisites

- [ ] Supabase project created (Phase 1A.5)
- [ ] Supabase CLI installed and linked
- [ ] Local Supabase running (`npx supabase start`)

---

## Task 1B.1: Design Schema

**Estimated Time:** 30 minutes

### Core Tables

#### 1. `users` — User profiles (extends auth.users)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, references auth.users |
| email | TEXT | User's email (denormalized for queries) |
| display_name | TEXT | Optional display name |
| credit_balance | INTEGER | Current credit balance (denormalized) |
| tier | TEXT | Subscription tier: free, pro, business |
| preferences | JSONB | User preferences (theme, defaults) |
| created_at | TIMESTAMPTZ | Account creation time |
| updated_at | TIMESTAMPTZ | Last profile update |

#### 2. `credit_transactions` — Immutable credit ledger

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References users |
| amount | INTEGER | Positive = credit, negative = debit |
| balance_after | INTEGER | Balance after this transaction |
| transaction_type | TEXT | purchase, generation, refund, bonus |
| reference_id | UUID | Links to job_id or external reference |
| description | TEXT | Human-readable description |
| idempotency_key | TEXT | Prevents duplicate transactions |
| created_at | TIMESTAMPTZ | Transaction time |

#### 3. `uploads` — Source images uploaded by users

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References users |
| filename | TEXT | Original filename |
| file_key | TEXT | R2 object key |
| file_size | INTEGER | Size in bytes |
| mime_type | TEXT | image/jpeg, image/png, etc. |
| width | INTEGER | Image width in pixels |
| height | INTEGER | Image height in pixels |
| created_at | TIMESTAMPTZ | Upload time |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |

#### 4. `jobs` — Generation job tracking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References users |
| upload_id | UUID | References uploads (source image) |
| status | TEXT | pending, processing, completed, failed, cancelled |
| prompt | TEXT | Generation prompt |
| parameters | JSONB | Aspect ratio, resolution, etc. |
| credits_charged | INTEGER | Credits consumed |
| error_message | TEXT | Error details if failed |
| retry_count | INTEGER | Number of retry attempts |
| started_at | TIMESTAMPTZ | When processing began |
| completed_at | TIMESTAMPTZ | When job finished |
| created_at | TIMESTAMPTZ | Job creation time |

#### 5. `generated_images` — AI-generated results

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| job_id | UUID | References jobs |
| user_id | UUID | References users (denormalized) |
| file_key | TEXT | R2 object key |
| public_url | TEXT | Public URL for the image |
| width | INTEGER | Image width |
| height | INTEGER | Image height |
| file_size | INTEGER | Size in bytes |
| is_favorite | BOOLEAN | User marked as favorite |
| created_at | TIMESTAMPTZ | Generation time |
| deleted_at | TIMESTAMPTZ | Soft delete timestamp |

### Acceptance Criteria

- [ ] All tables documented with columns and types
- [ ] Relationships clearly defined
- [ ] Decision made on soft deletes vs hard deletes

---

## Task 1B.2: Create Migrations

**Estimated Time:** 45 minutes

### Steps

1. **Create extensions migration**
   ```bash
   touch supabase/migrations/00001_create_extensions.sql
   ```

   ```sql
   -- supabase/migrations/00001_create_extensions.sql
   -- Enable required extensions

   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Text search
   ```

2. **Create enum types migration**
   ```bash
   touch supabase/migrations/00002_create_types.sql
   ```

   ```sql
   -- supabase/migrations/00002_create_types.sql
   -- Define enum types for type safety

   CREATE TYPE job_status AS ENUM (
     'pending',
     'processing',
     'completed',
     'failed',
     'cancelled'
   );

   CREATE TYPE transaction_type AS ENUM (
     'purchase',
     'generation',
     'refund',
     'bonus',
     'expiration'
   );

   CREATE TYPE user_tier AS ENUM (
     'free',
     'pro',
     'business'
   );
   ```

3. **Create users table migration**
   ```bash
   touch supabase/migrations/00003_create_users_table.sql
   ```

   ```sql
   -- supabase/migrations/00003_create_users_table.sql
   -- User profiles extending auth.users

   CREATE TABLE public.users (
     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
     email TEXT NOT NULL,
     display_name TEXT,
     credit_balance INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
     tier user_tier NOT NULL DEFAULT 'free',
     preferences JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Index for email lookups
   CREATE INDEX idx_users_email ON public.users(email);

   -- Auto-update updated_at
   CREATE OR REPLACE FUNCTION update_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER users_updated_at
     BEFORE UPDATE ON public.users
     FOR EACH ROW
     EXECUTE FUNCTION update_updated_at();

   -- Auto-create user profile on auth signup
   CREATE OR REPLACE FUNCTION handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.users (id, email)
     VALUES (NEW.id, NEW.email);
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION handle_new_user();

   -- Enable RLS
   ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
   ```

4. **Create credit_transactions table migration**
   ```bash
   touch supabase/migrations/00004_create_credit_transactions.sql
   ```

   ```sql
   -- supabase/migrations/00004_create_credit_transactions.sql
   -- Immutable credit transaction ledger

   CREATE TABLE public.credit_transactions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     amount INTEGER NOT NULL,
     balance_after INTEGER NOT NULL,
     transaction_type transaction_type NOT NULL,
     reference_id UUID,
     description TEXT,
     idempotency_key TEXT UNIQUE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Indexes
   CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
   CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
   CREATE INDEX idx_credit_transactions_type ON public.credit_transactions(transaction_type);

   -- Enable RLS
   ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

   -- Atomic credit addition function
   CREATE OR REPLACE FUNCTION add_credits(
     p_user_id UUID,
     p_amount INTEGER,
     p_type transaction_type,
     p_description TEXT DEFAULT NULL,
     p_reference_id UUID DEFAULT NULL,
     p_idempotency_key TEXT DEFAULT NULL
   )
   RETURNS TABLE(success BOOLEAN, new_balance INTEGER, transaction_id UUID)
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_current_balance INTEGER;
     v_new_balance INTEGER;
     v_transaction_id UUID;
   BEGIN
     -- Check idempotency
     IF p_idempotency_key IS NOT NULL THEN
       SELECT ct.id INTO v_transaction_id
       FROM public.credit_transactions ct
       WHERE ct.idempotency_key = p_idempotency_key;

       IF v_transaction_id IS NOT NULL THEN
         SELECT u.credit_balance INTO v_current_balance
         FROM public.users u WHERE u.id = p_user_id;

         RETURN QUERY SELECT TRUE, v_current_balance, v_transaction_id;
         RETURN;
       END IF;
     END IF;

     -- Lock user row for atomic update
     SELECT credit_balance INTO v_current_balance
     FROM public.users
     WHERE id = p_user_id
     FOR UPDATE;

     IF v_current_balance IS NULL THEN
       RETURN QUERY SELECT FALSE, 0, NULL::UUID;
       RETURN;
     END IF;

     v_new_balance := v_current_balance + p_amount;

     -- Update balance
     UPDATE public.users
     SET credit_balance = v_new_balance
     WHERE id = p_user_id;

     -- Record transaction
     INSERT INTO public.credit_transactions (
       user_id, amount, balance_after, transaction_type,
       description, reference_id, idempotency_key
     )
     VALUES (
       p_user_id, p_amount, v_new_balance, p_type,
       p_description, p_reference_id, p_idempotency_key
     )
     RETURNING id INTO v_transaction_id;

     RETURN QUERY SELECT TRUE, v_new_balance, v_transaction_id;
   END;
   $$;

   -- Atomic credit consumption function
   CREATE OR REPLACE FUNCTION consume_credits(
     p_user_id UUID,
     p_amount INTEGER,
     p_job_id UUID,
     p_description TEXT DEFAULT 'Image generation'
   )
   RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_current_balance INTEGER;
     v_new_balance INTEGER;
   BEGIN
     -- Lock user row
     SELECT credit_balance INTO v_current_balance
     FROM public.users
     WHERE id = p_user_id
     FOR UPDATE;

     IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
       RETURN QUERY SELECT FALSE, COALESCE(v_current_balance, 0);
       RETURN;
     END IF;

     v_new_balance := v_current_balance - p_amount;

     -- Update balance
     UPDATE public.users
     SET credit_balance = v_new_balance
     WHERE id = p_user_id;

     -- Record transaction
     INSERT INTO public.credit_transactions (
       user_id, amount, balance_after, transaction_type,
       description, reference_id
     )
     VALUES (
       p_user_id, -p_amount, v_new_balance, 'generation',
       p_description, p_job_id
     );

     RETURN QUERY SELECT TRUE, v_new_balance;
   END;
   $$;

   -- Refund credits function
   CREATE OR REPLACE FUNCTION refund_credits(
     p_user_id UUID,
     p_amount INTEGER,
     p_job_id UUID,
     p_description TEXT DEFAULT 'Refund for failed generation'
   )
   RETURNS TABLE(success BOOLEAN, new_balance INTEGER)
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_result RECORD;
   BEGIN
     SELECT * INTO v_result FROM add_credits(
       p_user_id,
       p_amount,
       'refund',
       p_description,
       p_job_id
     );

     RETURN QUERY SELECT v_result.success, v_result.new_balance;
   END;
   $$;
   ```

5. **Create uploads table migration**
   ```bash
   touch supabase/migrations/00005_create_uploads.sql
   ```

   ```sql
   -- supabase/migrations/00005_create_uploads.sql
   -- Source images uploaded by users

   CREATE TABLE public.uploads (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     filename TEXT NOT NULL,
     file_key TEXT NOT NULL UNIQUE,
     file_size INTEGER NOT NULL CHECK (file_size > 0),
     mime_type TEXT NOT NULL,
     width INTEGER,
     height INTEGER,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     deleted_at TIMESTAMPTZ
   );

   -- Indexes
   CREATE INDEX idx_uploads_user_id ON public.uploads(user_id) WHERE deleted_at IS NULL;
   CREATE INDEX idx_uploads_created_at ON public.uploads(created_at DESC);

   -- Enable RLS
   ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
   ```

6. **Create jobs table migration**
   ```bash
   touch supabase/migrations/00006_create_jobs.sql
   ```

   ```sql
   -- supabase/migrations/00006_create_jobs.sql
   -- Generation job tracking

   CREATE TABLE public.jobs (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     upload_id UUID REFERENCES public.uploads(id) ON DELETE SET NULL,
     status job_status NOT NULL DEFAULT 'pending',
     prompt TEXT NOT NULL,
     parameters JSONB DEFAULT '{}',
     credits_charged INTEGER NOT NULL DEFAULT 1,
     error_message TEXT,
     retry_count INTEGER NOT NULL DEFAULT 0,
     max_retries INTEGER NOT NULL DEFAULT 3,
     started_at TIMESTAMPTZ,
     completed_at TIMESTAMPTZ,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   -- Indexes
   CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
   CREATE INDEX idx_jobs_status ON public.jobs(status);
   CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
   CREATE INDEX idx_jobs_pending ON public.jobs(created_at) WHERE status = 'pending';

   -- Enable RLS
   ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

   -- Function to create job with credit consumption
   CREATE OR REPLACE FUNCTION create_generation_job(
     p_user_id UUID,
     p_upload_id UUID,
     p_prompt TEXT,
     p_parameters JSONB DEFAULT '{}',
     p_credits INTEGER DEFAULT 1
   )
   RETURNS TABLE(success BOOLEAN, job_id UUID, message TEXT)
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     v_new_job_id UUID;
     v_credit_result RECORD;
   BEGIN
     -- Generate job ID first
     v_new_job_id := uuid_generate_v4();

     -- Try to consume credits
     SELECT * INTO v_credit_result FROM consume_credits(
       p_user_id,
       p_credits,
       v_new_job_id,
       'Generation: ' || LEFT(p_prompt, 50)
     );

     IF NOT v_credit_result.success THEN
       RETURN QUERY SELECT FALSE, NULL::UUID, 'Insufficient credits';
       RETURN;
     END IF;

     -- Create the job
     INSERT INTO public.jobs (
       id, user_id, upload_id, prompt, parameters, credits_charged
     )
     VALUES (
       v_new_job_id, p_user_id, p_upload_id, p_prompt, p_parameters, p_credits
     );

     RETURN QUERY SELECT TRUE, v_new_job_id, 'Job created successfully';
   END;
   $$;
   ```

7. **Create generated_images table migration**
   ```bash
   touch supabase/migrations/00007_create_generated_images.sql
   ```

   ```sql
   -- supabase/migrations/00007_create_generated_images.sql
   -- AI-generated image results

   CREATE TABLE public.generated_images (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
     file_key TEXT NOT NULL UNIQUE,
     public_url TEXT NOT NULL,
     width INTEGER,
     height INTEGER,
     file_size INTEGER,
     is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     deleted_at TIMESTAMPTZ
   );

   -- Indexes
   CREATE INDEX idx_generated_images_user_id ON public.generated_images(user_id) WHERE deleted_at IS NULL;
   CREATE INDEX idx_generated_images_job_id ON public.generated_images(job_id);
   CREATE INDEX idx_generated_images_favorites ON public.generated_images(user_id, is_favorite) WHERE deleted_at IS NULL AND is_favorite = TRUE;
   CREATE INDEX idx_generated_images_created_at ON public.generated_images(created_at DESC);

   -- Enable RLS
   ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
   ```

### Acceptance Criteria

- [ ] All migration files created
- [ ] Migrations run successfully: `npx supabase db reset`
- [ ] Tables visible in Supabase dashboard
- [ ] Functions created for atomic credit operations

---

## Task 1B.3: Row Level Security Policies

**Estimated Time:** 30 minutes

### Steps

1. **Create RLS policies migration**
   ```bash
   touch supabase/migrations/00008_create_rls_policies.sql
   ```

   ```sql
   -- supabase/migrations/00008_create_rls_policies.sql
   -- Row Level Security policies for user data isolation

   -- Users table policies
   CREATE POLICY "Users can view own profile"
     ON public.users FOR SELECT
     USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
     ON public.users FOR UPDATE
     USING (auth.uid() = id)
     WITH CHECK (auth.uid() = id);

   -- Credit transactions policies
   CREATE POLICY "Users can view own transactions"
     ON public.credit_transactions FOR SELECT
     USING (auth.uid() = user_id);

   -- Uploads policies
   CREATE POLICY "Users can view own uploads"
     ON public.uploads FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can create own uploads"
     ON public.uploads FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can soft delete own uploads"
     ON public.uploads FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- Jobs policies
   CREATE POLICY "Users can view own jobs"
     ON public.jobs FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can create own jobs"
     ON public.jobs FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   -- Note: Job status updates happen via SECURITY DEFINER functions

   -- Generated images policies
   CREATE POLICY "Users can view own images"
     ON public.generated_images FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can update own images"
     ON public.generated_images FOR UPDATE
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);

   -- Service role bypass (for background jobs)
   -- Note: service_role key bypasses RLS automatically
   ```

### Testing RLS

After applying migrations, test RLS policies:

```sql
-- In Supabase SQL Editor, test as a specific user
SET request.jwt.claim.sub = 'user-uuid-here';

-- Try to select another user's data (should return empty)
SELECT * FROM public.uploads WHERE user_id != 'user-uuid-here';

-- Reset
RESET request.jwt.claim.sub;
```

### Acceptance Criteria

- [ ] All RLS policies created
- [ ] Users can only access their own data
- [ ] Service role can access all data (for background jobs)

---

## Task 1B.4: TypeScript Types

**Estimated Time:** 20 minutes

### Steps

1. **Generate types from database**
   ```bash
   npx supabase gen types typescript --local > src/types/database.ts
   ```

2. **Create helper types**
   ```typescript
   // src/types/database.helpers.ts
   import type { Database } from './database';

   // Table row types
   export type User = Database['public']['Tables']['users']['Row'];
   export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];
   export type Upload = Database['public']['Tables']['uploads']['Row'];
   export type Job = Database['public']['Tables']['jobs']['Row'];
   export type GeneratedImage = Database['public']['Tables']['generated_images']['Row'];

   // Insert types
   export type UserInsert = Database['public']['Tables']['users']['Insert'];
   export type UploadInsert = Database['public']['Tables']['uploads']['Insert'];
   export type JobInsert = Database['public']['Tables']['jobs']['Insert'];

   // Update types
   export type UserUpdate = Database['public']['Tables']['users']['Update'];
   export type JobUpdate = Database['public']['Tables']['jobs']['Update'];

   // Enum types
   export type JobStatus = Database['public']['Enums']['job_status'];
   export type TransactionType = Database['public']['Enums']['transaction_type'];
   export type UserTier = Database['public']['Enums']['user_tier'];

   // Function return types
   export type CreateJobResult = {
     success: boolean;
     job_id: string | null;
     message: string;
   };

   export type CreditOperationResult = {
     success: boolean;
     new_balance: number;
   };
   ```

3. **Add to index**
   ```typescript
   // src/types/index.ts
   export * from './database';
   export * from './database.helpers';
   ```

### Acceptance Criteria

- [ ] Types generated from database schema
- [ ] Helper types created for common operations
- [ ] Types properly exported

---

## Task 1B.5: Database Utility Functions

**Estimated Time:** 45 minutes

### Steps

1. **Create user utilities**
   ```typescript
   // src/lib/db/users.ts
   import { createClient } from '@/lib/supabase/server';
   import type { User, UserUpdate } from '@/types';

   export const getCurrentUser = async (): Promise<User | null> => {
     const supabase = await createClient();
     const { data: { user: authUser } } = await supabase.auth.getUser();

     if (!authUser) return null;

     const { data, error } = await supabase
       .from('users')
       .select('*')
       .eq('id', authUser.id)
       .single();

     if (error) {
       console.error('Error fetching user:', error);
       return null;
     }

     return data;
   };

   export const updateUser = async (
     userId: string,
     updates: UserUpdate
   ): Promise<User | null> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('users')
       .update(updates)
       .eq('id', userId)
       .select()
       .single();

     if (error) {
       console.error('Error updating user:', error);
       return null;
     }

     return data;
   };

   export const getUserCredits = async (userId: string): Promise<number> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('users')
       .select('credit_balance')
       .eq('id', userId)
       .single();

     if (error) {
       console.error('Error fetching credits:', error);
       return 0;
     }

     return data?.credit_balance ?? 0;
   };
   ```

2. **Create credit utilities**
   ```typescript
   // src/lib/db/credits.ts
   import { createAdminClient } from '@/lib/supabase/admin';
   import type { CreditOperationResult, CreditTransaction, TransactionType } from '@/types';

   export const addCredits = async (
     userId: string,
     amount: number,
     type: TransactionType,
     description?: string,
     referenceId?: string,
     idempotencyKey?: string
   ): Promise<CreditOperationResult & { transactionId?: string }> => {
     const supabase = createAdminClient();

     const { data, error } = await supabase.rpc('add_credits', {
       p_user_id: userId,
       p_amount: amount,
       p_type: type,
       p_description: description ?? null,
       p_reference_id: referenceId ?? null,
       p_idempotency_key: idempotencyKey ?? null,
     });

     if (error) {
       console.error('Error adding credits:', error);
       return { success: false, new_balance: 0 };
     }

     const result = data[0];
     return {
       success: result.success,
       new_balance: result.new_balance,
       transactionId: result.transaction_id,
     };
   };

   export const consumeCredits = async (
     userId: string,
     amount: number,
     jobId: string,
     description?: string
   ): Promise<CreditOperationResult> => {
     const supabase = createAdminClient();

     const { data, error } = await supabase.rpc('consume_credits', {
       p_user_id: userId,
       p_amount: amount,
       p_job_id: jobId,
       p_description: description ?? 'Image generation',
     });

     if (error) {
       console.error('Error consuming credits:', error);
       return { success: false, new_balance: 0 };
     }

     const result = data[0];
     return {
       success: result.success,
       new_balance: result.new_balance,
     };
   };

   export const refundCredits = async (
     userId: string,
     amount: number,
     jobId: string,
     description?: string
   ): Promise<CreditOperationResult> => {
     const supabase = createAdminClient();

     const { data, error } = await supabase.rpc('refund_credits', {
       p_user_id: userId,
       p_amount: amount,
       p_job_id: jobId,
       p_description: description ?? 'Refund for failed generation',
     });

     if (error) {
       console.error('Error refunding credits:', error);
       return { success: false, new_balance: 0 };
     }

     const result = data[0];
     return {
       success: result.success,
       new_balance: result.new_balance,
     };
   };

   export const getCreditHistory = async (
     userId: string,
     limit = 50
   ): Promise<CreditTransaction[]> => {
     const supabase = createAdminClient();

     const { data, error } = await supabase
       .from('credit_transactions')
       .select('*')
       .eq('user_id', userId)
       .order('created_at', { ascending: false })
       .limit(limit);

     if (error) {
       console.error('Error fetching credit history:', error);
       return [];
     }

     return data;
   };
   ```

3. **Create job utilities**
   ```typescript
   // src/lib/db/jobs.ts
   import { createClient } from '@/lib/supabase/server';
   import { createAdminClient } from '@/lib/supabase/admin';
   import type { Job, JobStatus, CreateJobResult } from '@/types';

   export const createGenerationJob = async (
     userId: string,
     uploadId: string | null,
     prompt: string,
     parameters: Record<string, unknown> = {},
     credits = 1
   ): Promise<CreateJobResult> => {
     const supabase = createAdminClient();

     const { data, error } = await supabase.rpc('create_generation_job', {
       p_user_id: userId,
       p_upload_id: uploadId,
       p_prompt: prompt,
       p_parameters: parameters,
       p_credits: credits,
     });

     if (error) {
       console.error('Error creating job:', error);
       return { success: false, job_id: null, message: error.message };
     }

     const result = data[0];
     return {
       success: result.success,
       job_id: result.job_id,
       message: result.message,
     };
   };

   export const getJob = async (jobId: string): Promise<Job | null> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('jobs')
       .select('*')
       .eq('id', jobId)
       .single();

     if (error) {
       console.error('Error fetching job:', error);
       return null;
     }

     return data;
   };

   export const getUserJobs = async (
     userId: string,
     status?: JobStatus,
     limit = 50
   ): Promise<Job[]> => {
     const supabase = await createClient();

     let query = supabase
       .from('jobs')
       .select('*')
       .eq('user_id', userId)
       .order('created_at', { ascending: false })
       .limit(limit);

     if (status) {
       query = query.eq('status', status);
     }

     const { data, error } = await query;

     if (error) {
       console.error('Error fetching jobs:', error);
       return [];
     }

     return data;
   };

   export const updateJobStatus = async (
     jobId: string,
     status: JobStatus,
     errorMessage?: string
   ): Promise<boolean> => {
     const supabase = createAdminClient();

     const updates: Partial<Job> = { status };

     if (status === 'processing') {
       updates.started_at = new Date().toISOString();
     } else if (status === 'completed' || status === 'failed') {
       updates.completed_at = new Date().toISOString();
     }

     if (errorMessage) {
       updates.error_message = errorMessage;
     }

     const { error } = await supabase
       .from('jobs')
       .update(updates)
       .eq('id', jobId);

     if (error) {
       console.error('Error updating job status:', error);
       return false;
     }

     return true;
   };
   ```

4. **Create upload utilities**
   ```typescript
   // src/lib/db/uploads.ts
   import { createClient } from '@/lib/supabase/server';
   import type { Upload, UploadInsert } from '@/types';

   export const createUpload = async (
     upload: UploadInsert
   ): Promise<Upload | null> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('uploads')
       .insert(upload)
       .select()
       .single();

     if (error) {
       console.error('Error creating upload:', error);
       return null;
     }

     return data;
   };

   export const getUpload = async (uploadId: string): Promise<Upload | null> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('uploads')
       .select('*')
       .eq('id', uploadId)
       .is('deleted_at', null)
       .single();

     if (error) {
       console.error('Error fetching upload:', error);
       return null;
     }

     return data;
   };

   export const getUserUploads = async (
     userId: string,
     limit = 50
   ): Promise<Upload[]> => {
     const supabase = await createClient();

     const { data, error } = await supabase
       .from('uploads')
       .select('*')
       .eq('user_id', userId)
       .is('deleted_at', null)
       .order('created_at', { ascending: false })
       .limit(limit);

     if (error) {
       console.error('Error fetching uploads:', error);
       return [];
     }

     return data;
   };

   export const softDeleteUpload = async (uploadId: string): Promise<boolean> => {
     const supabase = await createClient();

     const { error } = await supabase
       .from('uploads')
       .update({ deleted_at: new Date().toISOString() })
       .eq('id', uploadId);

     if (error) {
       console.error('Error deleting upload:', error);
       return false;
     }

     return true;
   };
   ```

5. **Create index export**
   ```typescript
   // src/lib/db/index.ts
   export * from './users';
   export * from './credits';
   export * from './jobs';
   export * from './uploads';
   ```

### Acceptance Criteria

- [ ] All utility functions created
- [ ] Functions properly typed
- [ ] Error handling in place
- [ ] Atomic operations use admin client

---

## Phase 1B Checklist

| Task | Status | Notes |
|------|--------|-------|
| 1B.1 Design schema | ⬜ | |
| 1B.2 Create migrations | ⬜ | |
| 1B.3 RLS policies | ⬜ | |
| 1B.4 TypeScript types | ⬜ | |
| 1B.5 DB utility functions | ⬜ | |

---

## Verification Commands

```bash
# Reset database and apply all migrations
npx supabase db reset

# Generate fresh types
npx supabase gen types typescript --local > src/types/database.ts

# Check migration status
npx supabase migration list
```

---

## Next Phase

Once all tasks are complete, proceed to **Phase 1C: Authentication**.
