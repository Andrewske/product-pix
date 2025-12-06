# Step 06: Create Compiler Module for Template Variable Substitution

## Objective

Create the compiler module that handles template variable substitution, validation, and prompt assembly from template components.

## Prerequisites

- Step 04 completed (types module exists)
- Step 05 completed (errors module exists)

## Files to Create

### `src/lib/prompts/compiler.ts`

```typescript
import {
  TemplateData,
  VariablesSchema,
  VariableDef,
} from './types';
import {
  Result,
  PromptTestError,
  ok,
  err,
  createError,
  validateCompiledPrompt,
  validateRequiredVariables,
  validateEnumValues,
} from './errors';

// =============================================================================
// Types
// =============================================================================

export interface CompileOptions {
  /** Skip validation (for dry-run testing) */
  skipValidation?: boolean;
  /** Include negative prompt in output */
  includeNegative?: boolean;
}

export interface CompiledPrompt {
  /** The final assembled prompt */
  prompt: string;
  /** Negative prompt (if included) */
  negative?: string;
  /** Variables that were used */
  usedVariables: Record<string, string>;
  /** Variables with default values applied */
  defaultsApplied: string[];
}

// =============================================================================
// Variable Resolution
// =============================================================================

/**
 * Apply default values to missing optional variables
 */
export const applyDefaults = (
  variablesSchema: VariablesSchema,
  providedVariables: Record<string, unknown>
): { variables: Record<string, string>; defaultsApplied: string[] } => {
  const variables: Record<string, string> = {};
  const defaultsApplied: string[] = [];

  for (const [name, def] of Object.entries(variablesSchema)) {
    if (name in providedVariables) {
      // Use provided value
      variables[name] = String(providedVariables[name]);
    } else if (def.default !== undefined) {
      // Apply default
      variables[name] = def.default;
      defaultsApplied.push(name);
    } else if (!def.required) {
      // Optional without default - use empty string
      variables[name] = '';
    }
    // Required without value will be caught by validation
  }

  return { variables, defaultsApplied };
};

/**
 * Substitute variables in a template string
 * Replaces {variable} patterns with their values
 */
export const substituteVariables = (
  template: string,
  variables: Record<string, string>
): string => {
  return template.replace(
    /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
    (match, varName) => {
      if (varName in variables) {
        return variables[varName];
      }
      // Leave unmatched variables for validation to catch
      return match;
    }
  );
};

// =============================================================================
// Prompt Assembly
// =============================================================================

/**
 * Assemble template components into a single prompt
 * Joins non-empty components with proper formatting
 */
export const assemblePrompt = (templateData: TemplateData): string => {
  const parts: string[] = [];

  // Required component
  parts.push(templateData.subject);

  // Optional components - only include if non-empty
  const optionalComponents = [
    templateData.background,
    templateData.lighting,
    templateData.camera,
    templateData.style,
    templateData.quality,
  ];

  for (const component of optionalComponents) {
    if (component && component.trim()) {
      parts.push(component.trim());
    }
  }

  return parts.join(', ');
};

// =============================================================================
// Main Compiler
// =============================================================================

/**
 * Compile a template with variables into a final prompt
 *
 * @param templateData - The template components (subject, lighting, etc.)
 * @param variablesSchema - Schema defining expected variables
 * @param providedVariables - User-provided variable values
 * @param options - Compilation options
 * @returns Result with compiled prompt or error
 */
export const compileTemplate = (
  templateData: TemplateData,
  variablesSchema: VariablesSchema,
  providedVariables: Record<string, unknown>,
  options: CompileOptions = {}
): Result<CompiledPrompt> => {
  // Step 1: Validate required variables
  if (!options.skipValidation) {
    const requiredError = validateRequiredVariables(variablesSchema, providedVariables);
    if (requiredError) {
      return err(requiredError);
    }

    // Step 2: Validate enum values
    const enumError = validateEnumValues(variablesSchema, providedVariables);
    if (enumError) {
      return err(enumError);
    }
  }

  // Step 3: Apply defaults and resolve variables
  const { variables, defaultsApplied } = applyDefaults(variablesSchema, providedVariables);

  // Step 4: Create a mutable copy of template data with substitutions
  const substitutedData: TemplateData = {
    subject: substituteVariables(templateData.subject, variables),
    background: templateData.background
      ? substituteVariables(templateData.background, variables)
      : undefined,
    lighting: templateData.lighting
      ? substituteVariables(templateData.lighting, variables)
      : undefined,
    camera: templateData.camera
      ? substituteVariables(templateData.camera, variables)
      : undefined,
    style: templateData.style
      ? substituteVariables(templateData.style, variables)
      : undefined,
    quality: templateData.quality
      ? substituteVariables(templateData.quality, variables)
      : undefined,
    negative: templateData.negative
      ? substituteVariables(templateData.negative, variables)
      : undefined,
  };

  // Step 5: Assemble the final prompt
  const prompt = assemblePrompt(substitutedData);

  // Step 6: Validate no unresolved variables remain
  if (!options.skipValidation) {
    const promptError = validateCompiledPrompt(prompt);
    if (promptError) {
      return err(promptError);
    }

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
  }

  // Step 7: Build result
  const result: CompiledPrompt = {
    prompt,
    usedVariables: variables,
    defaultsApplied,
  };

  if (options.includeNegative && substitutedData.negative) {
    result.negative = substitutedData.negative;
  }

  return ok(result);
};

// =============================================================================
// Idempotency Key Generation
// =============================================================================

/**
 * Generate an idempotency key for a test
 * Combines template slug, version, and sorted variable values
 */
export const generateIdempotencyKey = (
  templateSlug: string,
  templateVersion: number,
  variables: Record<string, unknown>,
  batchLabel?: string
): string => {
  const sortedVars = Object.keys(variables)
    .sort()
    .map((k) => `${k}=${String(variables[k])}`)
    .join('|');

  const parts = [
    templateSlug,
    `v${templateVersion}`,
    sortedVars,
  ];

  if (batchLabel) {
    parts.push(batchLabel);
  }

  return parts.join('::');
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extract variable names from a template string
 */
export const extractVariableNames = (template: string): string[] => {
  const matches = template.match(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(1, -1)))];
};

/**
 * Get all variable names used across all template components
 */
export const getTemplateVariables = (templateData: TemplateData): string[] => {
  const allText = [
    templateData.subject,
    templateData.background,
    templateData.lighting,
    templateData.camera,
    templateData.style,
    templateData.quality,
    templateData.negative,
  ]
    .filter(Boolean)
    .join(' ');

  return extractVariableNames(allText);
};

/**
 * Validate that all template variables are defined in the schema
 */
export const validateTemplateVariables = (
  templateData: TemplateData,
  variablesSchema: VariablesSchema
): PromptTestError | null => {
  const templateVars = getTemplateVariables(templateData);
  const schemaVars = Object.keys(variablesSchema);
  const undefined = templateVars.filter((v) => !schemaVars.includes(v));

  if (undefined.length > 0) {
    return createError(
      'VALIDATION_ERROR',
      `Template uses undefined variables: ${undefined.join(', ')}`
    );
  }

  return null;
};
```

## Implementation Steps

1. Create the file at `src/lib/prompts/compiler.ts`
2. Copy the content exactly as shown
3. Verify there are no TypeScript errors: `npx tsc --noEmit`

## Acceptance Criteria

- [ ] File exists at `src/lib/prompts/compiler.ts`
- [ ] All code compiles without TypeScript errors
- [ ] `applyDefaults` correctly applies default values for missing optional variables
- [ ] `substituteVariables` replaces `{variable}` patterns with values
- [ ] `assemblePrompt` joins template components with proper formatting
- [ ] `compileTemplate` validates inputs and produces a compiled prompt
- [ ] `compileTemplate` returns errors for missing required variables
- [ ] `compileTemplate` returns errors for invalid enum values
- [ ] `compileTemplate` returns errors for unresolved variables in output
- [ ] `generateIdempotencyKey` creates deterministic keys from inputs
- [ ] `extractVariableNames` finds all `{variable}` patterns in text
- [ ] `validateTemplateVariables` catches undefined template variables

## Notes

- The compiler is the core of the template system, handling all variable resolution
- Idempotency keys prevent duplicate tests when scripts are re-run
- The `skipValidation` option allows dry-run testing without full validation
- Variable names must start with a letter or underscore, followed by alphanumeric characters
