# Thinking Token Investigation Findings

## Date: 2025-12-17

## Problem
Test 1 in batch `multi-angle-hybrid-20251217-axdo1w` cost $0.76 with 6,342 output tokens, while Tests 2-5 cost ~$0.16 with ~1,260 output tokens each. The 5x cost difference suggested thinking tokens were involved.

## Investigation Process

### Discovery 1: Thinking Tokens ARE Being Used
Added debug logging to `GoogleConversationSession.extractUsage()` and discovered:
- `thoughtsTokenCount: ~150` tokens per generation
- Present even though documentation says `gemini-3-pro-image-preview` doesn't support thinking
- Google is using thinking tokens internally despite docs

### Discovery 2: The Real Problem - Multi-Image Generation
Added response structure logging and found Test 1 generated **5 images instead of 1**:

```
Response structure:
  candidateCount: 1
  partsCount: 10
  partTypes: [
    "text(220 chars)",
    "image(image/jpeg)",   ← Image 1
    "text(134 chars)",
    "image(image/jpeg)",   ← Image 2
    "text(152 chars)",
    "image(image/jpeg)",   ← Image 3
    "text(159 chars)",
    "image(image/jpeg)",   ← Image 4
    "text(162 chars)",
    "image(image/jpeg)"    ← Image 5
  ]
```

Token breakdown:
- 5 images × ~1,120 tokens = 5,600 output tokens
- Plus text parts and thinking tokens = 6,342 total

### Root Cause
The system prompt in `orchestrator.ts:836-841` was ambiguous:

**Before (caused issue):**
```
Generate 5 distinct professional e-commerce photos.
Each generation must be visually unique from previous outputs.
```

Gemini interpreted this as "generate all 5 images right now" on the first turn.

**After (fixed):**
```
You will be asked to generate 5 professional e-commerce photos, one at a time.
Each photo must be visually unique from previous outputs.
```

## Fix Applied

**File:** `prompt-bench/core/orchestrator.ts:839`

**Change:**
```diff
- Generate ${template.outputCount} distinct professional e-commerce photos.
+ You will be asked to generate ${template.outputCount} professional e-commerce photos, one at a time.
```

## Verification

Ran debug script with fixed prompt:
- Gen 1: 1,243 output tokens ✅ (was 6,368)
- Gen 2: 1,237 output tokens ✅ (unchanged)

Cost reduction: **$0.76 → $0.15** per first generation (~80% savings)

## Additional Findings

### Thinking Tokens Discovery
Even though not in our scope to fix immediately, we confirmed:
- Gemini uses ~150 thinking tokens per generation
- `thoughtsTokenCount` field exists in `usageMetadata`
- Currently discarded by `normalizeUsage()` function
- Not stored in database schema
- Not billed separately (likely included in output pricing)

### System Gaps Identified
1. **Type definition incomplete** - `GeminiUsageMetadata` missing `thoughtsTokenCount` field
2. **Normalization loses data** - `normalizeUsage()` doesn't return thinking tokens
3. **Database schema incomplete** - No `thinking_tokens` column
4. **Cost calculation incomplete** - No separate accounting for thinking tokens

## Future Work

If thinking tokens need to be tracked separately:
1. Update `GeminiUsageMetadata` interface in `usage-types.ts`
2. Update `normalizeUsage()` to return `thinkingTokens` field
3. Add database migration for `thinking_tokens` column
4. Update cost calculator to handle thinking tokens
5. Update reports to display thinking token counts

## Files Modified
- `prompt-bench/core/orchestrator.ts` - Fixed system prompt (line 839)

## Test Scripts Created
- `prompt-bench/scripts/debug-thinking-tokens.ts` - Reproduces multi-turn generation
- `prompt-bench/scripts/check-test-data.ts` - Queries database for test data
- `prompt-bench/scripts/check-test-1-detail.ts` - Detailed test record inspection

## Key Takeaway
**Ambiguous prompts can cause LLMs to generate unexpected outputs.** Always be explicit about single vs. batch operations in system prompts, especially for multi-turn conversations.
