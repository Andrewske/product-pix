// =============================================================================
import type { TemplateData } from '@bench/core/types';

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
  | 'NETWORK_ERROR'       // Network request failed (retryable)
  | 'PIPELINE_ERROR'      // Pipeline orchestration failed
  | 'SOURCE_IMAGE_ERROR'  // Source image processing failed
  | 'UPLOAD_ERROR'        // File upload failed
  | 'RUN_PHASE_ERROR'     // Run phase failed
  | 'NO_DATA_ERROR'       // No data available for operation
  | 'ANALYSIS_ERROR'       // Product analysis failed
  | 'ANGLE_PLANNING_ERROR'; // Angle planning failed

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
  templateData: TemplateData,
  variablesSchema: Record<string, { required: boolean; default?: unknown }>,
  providedVariables: Record<string, unknown>
): PromptTestError | null => {
  const missing: string[] = [];

  // Import getUsedVariables here to avoid circular dependency
  const getUsedVariables = (templateData: TemplateData): Set<string> => {
    const usedVars = new Set<string>();
    const placeholderRegex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;

    const components = [
      templateData.subject,
      templateData.background,
      templateData.lighting,
      templateData.camera,
      templateData.style,
      templateData.quality,
      templateData.negative,
    ];

    for (const component of components) {
      if (!component) continue;

      let match;
      while ((match = placeholderRegex.exec(component)) !== null) {
        usedVars.add(match[1]);
      }
    }

    return usedVars;
  };

  const usedVars = getUsedVariables(templateData);

  for (const [name, def] of Object.entries(variablesSchema)) {
    // Only validate if variable is actually used in template AND required AND no default AND not provided
    if (usedVars.has(name) && def.required && !def.default && !(name in providedVariables)) {
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