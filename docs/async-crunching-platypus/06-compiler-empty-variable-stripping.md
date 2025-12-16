# Compiler Enhancement: Empty Variable Stripping

## Files to Modify
- `prompt-bench/core/compiler.ts` (add function, modify compileTemplate)

## Implementation Details

### 1. Add stripEmptyVariables Function
Insert after `substituteVariables` function (around line 88):

```typescript
/**
 * Strip empty variables and surrounding punctuation/whitespace
 * Handles cases where optional variables are empty strings:
 *   - "photo of bag, , material" → "photo of bag, material"
 *   - "bag,  , texture" → "bag, texture"
 *   - "bag, ," → "bag"
 */
export const stripEmptyVariables = (text: string): string => {
  let cleaned = text;

  // Pattern 1: ", , " → ", "
  // Handles middle empty variables
  cleaned = cleaned.replace(/,\s*,/g, ',');

  // Pattern 2: ", ," at end → ""
  // Handles trailing empty variables
  cleaned = cleaned.replace(/,\s*,\s*$/g, '');

  // Pattern 3: "start, ," → "start"
  // Handles leading empty variables after first element
  cleaned = cleaned.replace(/^(.*?),\s*,/g, '$1');

  // Pattern 4: Multiple consecutive spaces → single space
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  // Final trim
  return cleaned.trim();
};
```

### 2. Modify compileTemplate Function
Update line ~219 where the prompt is assembled:

**Before:**
```typescript
// Step 5: Assemble the final prompt
const prompt = assemblePrompt(substitutedData);
```

**After:**
```typescript
// Step 5: Assemble the final prompt
const rawPrompt = assemblePrompt(substitutedData);
const prompt = stripEmptyVariables(rawPrompt);
```

### 3. Apply Same Logic to Negative Prompt
Around line 229-236, also strip empty variables from negative prompt:

**Before:**
```typescript
// Also check negative prompt if it exists
if (substitutedData.negative) {
  const negativeError = validateCompiledPrompt(substitutedData.negative);
  if (negativeError) {
    return err({
      ...negativeError,
      message: `In negative prompt: ${negativeError.message}`,
    });
  }
}
```

**After:**
```typescript
// Also check negative prompt if it exists
if (substitutedData.negative) {
  substitutedData.negative = stripEmptyVariables(substitutedData.negative);
  const negativeError = validateCompiledPrompt(substitutedData.negative);
  if (negativeError) {
    return err({
      ...negativeError,
      message: `In negative prompt: ${negativeError.message}`,
    });
  }
}
```

### 4. Update CompiledPrompt Return
Ensure the stripped prompt is returned in the result (line 241-246):

```typescript
// Step 7: Build result
const result: CompiledPrompt = {
  prompt,  // Already stripped
  usedVariables: variables,
  defaultsApplied,
};

if (options.includeNegative && substitutedData.negative) {
  result.negative = substitutedData.negative;  // Already stripped
}
```

## Acceptance Criteria
- [ ] `stripEmptyVariables` function added and exported
- [ ] Function handles all comma/whitespace patterns
- [ ] Applied to main prompt in `compileTemplate`
- [ ] Applied to negative prompt if present
- [ ] Existing tests still pass
- [ ] New test cases added for empty variable scenarios

## Unit Tests
Add to `prompt-bench/__tests__/compiler.test.ts`:

```typescript
describe('stripEmptyVariables', () => {
  it('removes middle empty variables', () => {
    expect(stripEmptyVariables('photo of bag, , material')).toBe('photo of bag, material');
  });

  it('removes trailing empty variables', () => {
    expect(stripEmptyVariables('photo of bag, ,')).toBe('photo of bag');
  });

  it('removes leading empty variables after first element', () => {
    expect(stripEmptyVariables('bag, , texture')).toBe('bag, texture');
  });

  it('handles multiple consecutive spaces', () => {
    expect(stripEmptyVariables('bag,  ,  material')).toBe('bag, material');
  });

  it('preserves text with no empty variables', () => {
    expect(stripEmptyVariables('photo of red leather bag')).toBe('photo of red leather bag');
  });

  it('handles empty string', () => {
    expect(stripEmptyVariables('')).toBe('');
  });
});

describe('compileTemplate with empty variables', () => {
  it('strips empty color and material from prompt', () => {
    const template = {
      subject: 'Photo of {product}, {color}, {material}',
    };

    const schema = {
      product: { type: 'string', required: true },
      color: { type: 'string', required: false, default: '' },
      material: { type: 'string', required: false, default: '' }
    };

    const result = compileTemplate(template, schema, { product: 'bag' });

    expect(result.ok).toBe(true);
    expect(result.data.prompt).toBe('Photo of bag');
  });
});
```

## Dependencies
None - standalone enhancement to existing compiler
