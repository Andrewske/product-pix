# API Endpoints

## Files to Modify
- `prompt-bench/ui/server.ts` (modify)

## Implementation Details

Add two API endpoints for the human review feature:

### 1. GET /api/review/pending

Returns images needing human review (have LLM eval, no human eval).

**Query Logic:**
```sql
SELECT pt.id, pt.image_url, pt.final_prompt, pt.parent_run_id,
       pt.debug_metadata,
       pe.score_overall as llm_score, pe.details as llm_details,
       parent.source_image_url
FROM prompt_tests pt
INNER JOIN prompt_evaluations pe
  ON pe.test_id = pt.id AND pe.evaluator_type = 'llm'
LEFT JOIN prompt_tests parent
  ON parent.id = pt.parent_run_id
WHERE pt.phase = 'generation'
  AND pt.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM prompt_evaluations pe2
    WHERE pe2.test_id = pt.id AND pe2.evaluator_type = 'human'
  )
ORDER BY pt.created_at DESC
LIMIT 50
```

**Handler Implementation:**
- Query prompt_tests with INNER JOIN to prompt_evaluations (llm type)
- LEFT JOIN to parent analysis run for source_image_url
- Filter out tests that already have human evaluations
- Extract image URLs: use `debug_metadata.image_urls` if present, otherwise fall back to `image_url`
- Transform snake_case → camelCase before returning (e.g., `llm_score` → `llmScore`)
- Limit results to 50 most recent

**Response Shape:**
```typescript
{
  pending: UnreviewedImage[]
}
```

### 2. POST /api/review/rate

Submit a human rating for an image.

**Request Body:**
```typescript
{
  testId: string;
  score: number;  // 1-10
  imageIndex?: number;  // For multi-image runs
  notes?: string;
}
```

**Handler Implementation:**
- Validate score is 1-10
- UPSERT into prompt_evaluations with evaluator_type = 'human'
  - Use `ON CONFLICT (test_id, evaluator_type) DO UPDATE` to allow re-rating
  - Note: Requires unique constraint on (test_id, evaluator_type) or use Supabase `.upsert()` with `onConflict`
- Fetch the corresponding LLM evaluation for comparison
- Return both evaluations

**Response Shape:**
```typescript
{
  humanEvaluation: { id, score_overall, ... },
  llmEvaluation: { score_overall, details }
}
```

**Database Insert:**
```typescript
{
  test_id: testId,
  score_overall: score,
  details: { imageIndex, notes },
  evaluator_type: 'human',
  evaluator_model: null,
  cost_usd: 0,
  tokens_used: 0
}
```

### Route Registration

Add to the server's route handler (near other /api/* routes):
```typescript
if (url.pathname === '/api/review/pending') return handleReviewPending(req);
if (url.pathname === '/api/review/rate' && req.method === 'POST') return handleReviewRate(req);
```

## Acceptance Criteria
- [ ] GET /api/review/pending returns images with AI eval but no human eval
- [ ] POST /api/review/rate validates score 1-10
- [ ] Human ratings are stored with evaluator_type = 'human'
- [ ] Response includes both human and LLM evaluations for comparison
- [ ] Source image URL is resolved from parent analysis run

## Dependencies
- Task 01: Types and Interfaces (for type definitions)
