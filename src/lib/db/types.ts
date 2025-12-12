import type { Database } from '@/lib/supabase/database.types';

type Json = Database['public']['Tables']['batch_jobs']['Row']['parameters'];

// =============================================================================
// Batch Parameter Types
// =============================================================================

export interface BatchJobParameters {
  defaultPrompt?: string;
  [key: string]: Json | undefined;
}

export interface BatchItemParameters {
  aspect_ratio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution: '1k' | '2k' | '4k';
  [key: string]: Json | undefined;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isBatchItemParameters(json: Json): json is BatchItemParameters {
  if (!json || typeof json !== 'object') return false;
  const obj = json as Record<string, unknown>;

  const validAspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
  const validResolutions = ['1k', '2k', '4k'];

  return (
    typeof obj.aspect_ratio === 'string' &&
    validAspectRatios.includes(obj.aspect_ratio) &&
    typeof obj.resolution === 'string' &&
    validResolutions.includes(obj.resolution)
  );
}

export function isBatchJobParameters(json: Json): json is BatchJobParameters {
  if (!json || typeof json !== 'object') return false;
  const obj = json as Record<string, unknown>;
  return obj.defaultPrompt === undefined || typeof obj.defaultPrompt === 'string';
}

// =============================================================================
// Safe Accessors with Defaults
// =============================================================================

export function getBatchItemParameters(json: Json): BatchItemParameters {
  if (isBatchItemParameters(json)) return json;
  return { aspect_ratio: '1:1', resolution: '1k' };
}

export function getBatchJobParameters(json: Json): BatchJobParameters {
  if (isBatchJobParameters(json)) return json;
  return {};
}
