# Database Foundation

## Files to Modify/Create
- `supabase/migrations/20251212000000_create_image_feedback.sql` (new)
- `src/types/database.ts` (auto-generated)

## Implementation Details

### Task 1.1: Create image_feedback migration

Create a comprehensive migration that establishes the feedback system database infrastructure.

**SQL Schema:**
```sql
CREATE TYPE public.feedback_type AS ENUM ('positive', 'negative');

CREATE TABLE public.image_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.generated_images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feedback_type public.feedback_type NOT NULL,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_image_feedback UNIQUE (user_id, image_id),
  CONSTRAINT comment_length_check CHECK (LENGTH(comment) <= 1000)
);

-- Indexes
CREATE INDEX idx_image_feedback_image_id ON public.image_feedback(image_id);
CREATE INDEX idx_image_feedback_user_id ON public.image_feedback(user_id);
CREATE INDEX idx_image_feedback_type ON public.image_feedback(feedback_type);
CREATE INDEX idx_image_feedback_created_at ON public.image_feedback(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_feedback_updated_at
  BEFORE UPDATE ON public.image_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE public.image_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback" ON public.image_feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own feedback" ON public.image_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own feedback" ON public.image_feedback
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own feedback" ON public.image_feedback
  FOR DELETE USING (auth.uid() = user_id);
```

### Task 1.2: Regenerate TypeScript types

After running the migration, regenerate TypeScript types to make the new schema available in the codebase.

**Command:**
```bash
npx supabase gen types ts --local > src/types/database.ts
```

## Acceptance Criteria
- [ ] Table `image_feedback` exists with correct schema
- [ ] RLS policies are active and enforced
- [ ] All indexes are created (image_id, user_id, type, created_at)
- [ ] `updated_at` trigger works (updates timestamp on row updates)
- [ ] `ImageFeedback` type is available in `src/types/database.ts`
- [ ] Comment length constraint (max 1000 chars) enforces at DB level
- [ ] Unique constraint on (user_id, image_id) enables UPSERT behavior

## Dependencies
None - this is the foundation task

## Technical Notes
- **Admin Analytics:** Use admin Supabase client to bypass RLS for analytics queries
- **Cascade Deletes:** If image or user is deleted, feedback is automatically removed
- **Unique Constraint:** Allows users to update their feedback (UPSERT pattern)
