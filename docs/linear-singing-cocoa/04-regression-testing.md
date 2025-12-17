# Regression Testing

## Goal
Ensure no breakage in existing functionality after introducing Google SDK for conversation sessions.

## Files to Verify
- `src/lib/ai/providers/gemini.ts` (both AI SDK and Google SDK code)
- `src/lib/ai/providers/__tests__/` (unit tests if they exist)
- `prompt-bench/__tests__/` (integration tests)

## Test Suite Execution

### 1. Unit Tests
```bash
# Run AI provider unit tests
bun test src/lib/ai/providers/__tests__/

# If no tests exist yet, create basic smoke tests for:
# - createGeminiProvider().generateFromText()
# - createGeminiProvider().generateFromImage()
# - createConversationSession()
```

**Expected**: All tests pass

### 2. Integration Tests
```bash
# Run all prompt-bench tests
bun test prompt-bench/__tests__/
```

**Expected**: No new failures introduced

### 3. Manual Functional Tests

#### Test A: Single-Shot Text-to-Image (AI SDK)
```bash
# Find a template that uses text-to-image (no conversation)
bun bench run --template <single-shot-template> --batch <batch-file>
```

**Verify**:
- Images generated successfully
- No errors in console
- Cost tracking works
- Uses Vercel AI SDK (not Google SDK)

#### Test B: Single-Shot Image-to-Image (AI SDK)
```bash
# Find a template that uses image-to-image (single turn)
bun bench run --template <image-to-image-template> --batch <batch-file>
```

**Verify**:
- Source images processed correctly
- Generated images reflect transformations
- No errors related to thought signatures
- Uses Vercel AI SDK (not Google SDK)

#### Test C: Multi-Turn Conversation (Google SDK)
```bash
# Already tested in Task 03, but re-verify here
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json
```

**Verify**:
- Uses GoogleConversationSession
- Thought signatures work automatically
- No manual signature handling visible

## Error Handling Verification

### Test Error Scenarios

1. **Rate Limiting**
   - If you hit rate limits during testing, verify error message is clear
   - Should return `RATE_LIMITED` error code
   - Should be retryable

2. **Content Filtering**
   - Test with prompt that might trigger safety filters
   - Should return `CONTENT_FILTERED` error code
   - Should not be retryable

3. **Invalid Input**
   - Test with invalid aspect ratio or malformed config
   - Should return `INVALID_INPUT` error code
   - Should have clear error message

## TypeScript Compilation

```bash
# Verify no type errors
bunx tsc --noEmit

# Check specifically for AI provider module
bunx tsc --noEmit src/lib/ai/providers/gemini.ts
```

**Expected**: No errors, no warnings

## Performance Check

Compare before/after performance (optional):
- Time to generate single image (should be similar)
- Time to generate multi-turn conversation (may be slightly different)
- Token usage accuracy (verify thoughtsTokenCount is tracked)

## Success Criteria
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Single-shot text-to-image works (AI SDK)
- [ ] Single-shot image-to-image works (AI SDK)
- [ ] Multi-turn conversations work (Google SDK)
- [ ] Error handling produces correct error codes
- [ ] TypeScript compiles without errors
- [ ] Cost tracking accurate for both SDKs
- [ ] No performance regressions

## Dependencies
- Task 03: Multi-turn pipeline must be working first
