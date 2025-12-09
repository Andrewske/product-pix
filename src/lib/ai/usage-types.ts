// =============================================================================
// Gemini-Specific Usage Metadata
// =============================================================================

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

// =============================================================================
// Type Guards
// =============================================================================

function isGeminiUsage(usage: unknown): usage is GeminiUsageMetadata {
  if (!usage || typeof usage !== 'object') return false;
  const u = usage as Record<string, unknown>;
  return (
    typeof u.promptTokenCount === 'number' ||
    typeof u.candidatesTokenCount === 'number' ||
    typeof u.totalTokenCount === 'number'
  );
}

// =============================================================================
// Usage Normalization
// =============================================================================

export function normalizeUsage(usage: unknown): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  if (!usage || typeof usage !== 'object') {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  const u = usage as Record<string, unknown>;

  // Try Gemini-specific fields first
  if (isGeminiUsage(usage)) {
    return {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0,
    };
  }

  // Fall back to standard AI SDK fields
  return {
    promptTokens:
      (typeof u.promptTokens === 'number' ? u.promptTokens : 0) ||
      (typeof u.inputTokens === 'number' ? u.inputTokens : 0),
    completionTokens:
      (typeof u.completionTokens === 'number' ? u.completionTokens : 0) ||
      (typeof u.outputTokens === 'number' ? u.outputTokens : 0),
    totalTokens: typeof u.totalTokens === 'number' ? u.totalTokens : 0,
  };
}
