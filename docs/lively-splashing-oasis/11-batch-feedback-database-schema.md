# Database Schema: Batch Feedback (Future)

## Files to Create
- `supabase/migrations/[timestamp]_create_batch_feedback.sql` (new)

## Implementation Details

**Note**: This is a future feature (Phase 4). UX flow to be designed when implementing.

### Batch Feedback Tables

```sql
-- Main batch feedback table
CREATE TABLE batch_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  comment TEXT CHECK (LENGTH(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_batch_feedback UNIQUE (user_id, batch_id)
);

-- Junction table for problem images (normalized, not array)
CREATE TABLE batch_feedback_images (
  batch_feedback_id UUID NOT NULL REFERENCES batch_feedback(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES generated_images(id) ON DELETE CASCADE,
  PRIMARY KEY (batch_feedback_id, image_id)
);

-- Indexes
CREATE INDEX idx_batch_feedback_batch_id ON batch_feedback(batch_id);
CREATE INDEX idx_batch_feedback_user_id ON batch_feedback(user_id);
CREATE INDEX idx_batch_feedback_rating ON batch_feedback(rating);
CREATE INDEX idx_batch_feedback_images_image_id ON batch_feedback_images(image_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_batch_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batch_feedback_updated_at
  BEFORE UPDATE ON batch_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_batch_feedback_updated_at();

-- RLS Policies
ALTER TABLE batch_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own batch feedback" ON batch_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own batch feedback" ON batch_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own batch feedback" ON batch_feedback
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own batch feedback" ON batch_feedback
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE batch_feedback_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own batch feedback images" ON batch_feedback_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM batch_feedback
      WHERE id = batch_feedback_id
      AND user_id = auth.uid()
    )
  );
```

## Design Notes

### Junction Table Pattern
- **Why**: Normalized design allows efficient querying in both directions:
  - "Which batches had problems with image X?"
  - "Which images had problems in batch Y?"
- **Alternative avoided**: UUID[] array column (no referential integrity, hard to query)

### Rating System
- 1-5 star rating (integer check constraint)
- Reasons array (similar to image_feedback pattern)
- Optional comment (max 1000 chars)
- Problem images via junction table

### UX Flow (To Be Designed)
When implementing, decide:
1. Rating first, then reasons? Or vice versa?
2. Can user rate positively but still mark problem images?
3. Multi-step wizard vs single form?
4. Show batch thumbnails for image selection?

## Reference Patterns
- `image_feedback` table - Similar structure
- Junction table pattern - Standard relational design

## Acceptance Criteria (When Implemented)
- ✅ Migration runs successfully
- ✅ RLS policies prevent cross-user access
- ✅ Junction table enforces referential integrity
- ✅ Can query problem images efficiently
- ✅ Rating constraint enforces 1-5 range
- ✅ Unique constraint prevents duplicate feedback per batch
