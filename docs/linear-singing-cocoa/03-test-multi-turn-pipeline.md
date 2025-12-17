# Test Multi-Turn Pipeline

## Goal
Verify that thought signatures work correctly with Google SDK and multi-angle image generation succeeds.

## Files to Verify
- `src/lib/ai/providers/gemini.ts` (GoogleConversationSession)
- `prompt-bench/core/orchestrator.ts` (uses conversation sessions)

---

## Test Commands

### Primary Test: Multi-Angle Pipeline

```bash
bun bench test --template multi-angle-hybrid --batch prompt-bench/fixtures/min-multi-image.json
```

**Expected outcome**:
- No "Image part is missing a thought_signature" error
- Multiple images generated in sequence (one per angle)
- Conversation context preserved across angles
- Cost tracking accurate with `thoughtsTokenCount` included
- HTML report generated successfully

**Watch for**:
- Error messages in console
- Generation failures (check `err` vs `ok` results)
- Usage data in report (verify `thoughtsTokenCount` is tracked)
- Structured log messages from `GoogleConversationSession`

---

## Debugging Steps (If Tests Fail)

### 1. Check Google SDK Version

```bash
bun pm ls | grep @google/genai
```

Should show: `@google/genai@1.31.0` or higher

### 2. Verify Environment Variable

```bash
echo $GEMINI_MODEL
```

Should be a thinking-capable model (e.g., `gemini-3-pro-image-preview`)

### 3. Check API Response Structure

Add temporary logging in `GoogleConversationSession.generateNext()`:

```typescript
logger.debug('GoogleSDK response', {
  candidateCount: response.candidates?.length,
  hasParts: response.candidates?.[0]?.content?.parts?.length,
  hasInlineData: !!response.candidates?.[0]?.content?.parts?.[0]?.inlineData,
});
```

### 4. Validate Thought Signatures

- Thought signatures should be transparent (handled by SDK)
- No errors about missing signatures
- If errors persist: Check Google SDK changelog for breaking changes

### 5. Check Aspect Ratio

If generation fails with "Unsupported aspect ratio" error:
- Verify batch file uses supported ratios: `1:1`, `3:4`, `4:3`, `9:16`, `16:9`
- Update batch file if using unsupported ratios like `21:9`

---

## Manual Verification

After successful run:

1. Open generated HTML report: `bun bench open-last-report`
2. Verify all angles were generated
3. Check that images show visual progression (angle variations)
4. Confirm cost data looks reasonable
5. Verify `thoughtsTokenCount` appears in usage breakdown

---

## Success Criteria

- [ ] Pipeline completes without "thought_signature" errors
- [ ] All angles in batch file generate successfully
- [ ] No runtime exceptions in console
- [ ] Usage data (`thoughtsTokenCount`, `promptTokenCount`) populated correctly
- [ ] Generated images viewable in HTML report
- [ ] Conversation context evident (later angles reference earlier ones)
- [ ] Structured logs appear showing session lifecycle

---

## Rollback Plan (If Tests Fail)

If Google SDK doesn't work:

1. **Temporary revert**:
   ```typescript
   // In gemini.ts
   export const createConversationSession = (): ImageConversationSession => {
     return new GeminiConversationSession(); // Revert to AI SDK
   };
   ```

2. **Investigate alternatives**:
   - Wait for AI SDK v6 stable
   - Check if newer `@google/genai` version available
   - Consider manual thought signature extraction from raw API

---

## Dependencies

- Task 02: Factory must be updated to use `GoogleConversationSession`
