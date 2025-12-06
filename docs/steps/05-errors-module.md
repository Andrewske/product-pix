# Step 05: Create Errors Module with Structured Error Handling

## Objective

Create the errors module that provides structured error types and a Result pattern for handling errors throughout the prompt testing framework.

## Prerequisites

- Step 04 completed (types module exists)

## Files to Create

### `src/lib/prompts/errors.ts`

```typescript
// =============================================================================
// Error Code Types
// =============================================================================

/**
 * Structured error codes for categorizing errors
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'    // Input validation failed (Zod, schema)
  | 'COMPILATION_ERROR'   // Template compilation failed (missing variables)
  | 'GENERATION_ERROR'    // Image generation failed (Gemini API)
  | 'EVALUATION_ERROR'    // Image evaluation failed (Claude API)
  | 'DATABASE_ERROR'      // Database operation failed
  | 'STORAGE_ERROR'       // R2 storage operation failed
  | 'NETWORK_ERROR';      // Network request failed (retryable)

// =============================================================================
// Error Interface
// =============================================================================

/**
 * Structured error for prompt testing operations
 */
export interface PromptTestError {
  code: ErrorCode;
  message: string;
  testId?: string;
  retryable: boolean;
  cause?: Error;
}

// =============================================================================
// Result Type (Railway-Oriented Programming)
// =============================================================================

/**
 * Success result
 */
export interface Ok<T> {
  ok: true;
  data: T;
}

/**
 * Failure result
 */
export interface Err {
  ok: false;
  error: PromptTestError;
}

/**
 * Result type - either success with data or failure with error
 */
export type Result<T> = Ok<T> | Err;

// =============================================================================
// Error Factory Functions
// =============================================================================

/**
 * Create a structured error with consistent shape
 */
export const createError = (
  code: ErrorCode,
  message: string,
  opts: { testId?: string; retryable?: boolean; cause?: Error } = {}
): PromptTestError => ({
  code,
  message,
  testId: opts.testId,
  retryable: opts.retryable ?? false,
  cause: opts.cause,
});

/**
 * Create a success result
 */
export const ok = <T>(data: T): Ok<T> => ({
  ok: true,
  data,
});

/**
 * Create a failure result
 */
export const err = (error: PromptTestError): Err => ({
  ok: false,
  error,
});

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Check for unresolved template variables in compiled prompt
 * Returns error if any {variable} patterns remain
 */
export const validateCompiledPrompt = (prompt: string): PromptTestError | null => {
  const unresolved = prompt.match(/\{[a-zA-Z_][a-zA-Z0-9_]*\}/g);
  if (unresolved) {
    return createError(
      'COMPILATION_ERROR',
      `Unresolved variables in prompt: ${unresolved.join(', ')}`
    );
  }
  return null;
};

/**
 * Validate that all required variables are provided
 */
export const validateRequiredVariables = (
  variablesSchema: Record<string, { required: boolean }>,
  providedVariables: Record<string, unknown>
): PromptTestError | null => {
  const missing: string[] = [];

  for (const [name, def] of Object.entries(variablesSchema)) {
    if (def.required && !(name in providedVariables)) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    return createError(
      'VALIDATION_ERROR',
      `Missing required variables: ${missing.join(', ')}`
    );
  }

  return null;
};

/**
 * Validate enum variable values against allowed options
 */
export const validateEnumValues = (
  variablesSchema: Record<string, { type: string; options?: string[] }>,
  providedVariables: Record<string, unknown>
): PromptTestError | null => {
  for (const [name, def] of Object.entries(variablesSchema)) {
    if (def.type === 'enum' && def.options && name in providedVariables) {
      const value = providedVariables[name];
      if (typeof value === 'string' && !def.options.includes(value)) {
        return createError(
          'VALIDATION_ERROR',
          `Invalid value for "${name}": "${value}". Must be one of: ${def.options.join(', ')}`
        );
      }
    }
  }

  return null;
};

// =============================================================================
// Error Formatting
// =============================================================================

/**
 * Format error for CLI output
 */
export const formatError = (error: PromptTestError): string => {
  let output = `[${error.code}] ${error.message}`;

  if (error.testId) {
    output += `\n  Test ID: ${error.testId}`;
  }

  if (error.retryable) {
    output += `\n  (retryable)`;
  }

  if (error.cause) {
    output += `\n  Cause: ${error.cause.message}`;
  }

  return output;
};

// =============================================================================
// Error Type Guards
// =============================================================================

/**
 * Check if a result is successful
 */
export const isOk = <T>(result: Result<T>): result is Ok<T> => result.ok;

/**
 * Check if a result is a failure
 */
export const isErr = <T>(result: Result<T>): result is Err => !result.ok;

/**
 * Check if an error is retryable
 */
export const isRetryable = (error: PromptTestError): boolean => error.retryable;

/**
 * Check if an error is of a specific code
 */
export const isErrorCode = (error: PromptTestError, code: ErrorCode): boolean =>
  error.code === code;
```

## Implementation Steps

1. Create the file at `src/lib/prompts/errors.ts`
2. Copy the content exactly as shown
3. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] File exists at `src/lib/prompts/errors.ts`
- [ ] All code compiles without TypeScript errors
- [ ] `ErrorCode` type includes all required codes: VALIDATION_ERROR, COMPILATION_ERROR, GENERATION_ERROR, EVALUATION_ERROR, DATABASE_ERROR, STORAGE_ERROR, NETWORK_ERROR
- [ ] `Result<T>` type correctly represents success/failure states
- [ ] `createError` function creates properly shaped errors
- [ ] `ok` and `err` helper functions work correctly
- [ ] `validateCompiledPrompt` detects unresolved `{variable}` patterns
- [ ] `validateRequiredVariables` validates required variables
- [ ] `validateEnumValues` validates enum options
- [ ] `formatError` produces readable CLI output
- [ ] Type guards `isOk`, `isErr`, `isRetryable` work correctly

## Notes

- The Result pattern (Railway-Oriented Programming) allows for explicit error handling without exceptions
- All errors include a `retryable` flag to help the CLI decide whether to retry failed operations
- The `cause` field preserves the original error for debugging
- Validation helpers return `null` on success, making them easy to compose
