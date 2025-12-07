/**
 * Shared utilities for prompt bench commands
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';

interface PromptBenchConfig {
  defaults: {
    template?: string;
    batch_file?: string;
    label_prefix?: string;
    evaluation_model?: string;
    baseline_label?: string;
    report?: {
      insights?: boolean;
      show_urls?: boolean;
    };
  };
}

/**
 * Load configuration from prompt-bench.toml
 */
export const loadConfig = (): PromptBenchConfig | null => {
  const configPath = resolve(process.cwd(), 'prompt-bench.toml');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    // Simple TOML-like parser (basic key=value format)
    const config: PromptBenchConfig = { defaults: {} };

    const lines = content.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));

    let currentSection = 'defaults';

    for (const line of lines) {
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
        if (currentSection === 'defaults.report') {
          config.defaults.report = config.defaults.report || {};
        }
        continue;
      }

      const [key, ...valueParts] = line.split('=');
      if (!key || valueParts.length === 0) continue;

      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, ''); // Remove quotes

      if (currentSection === 'defaults') {
        (config.defaults as any)[key.trim()] = value;
      } else if (currentSection === 'defaults.report') {
        config.defaults.report = config.defaults.report || {};
        (config.defaults.report as any)[key.trim()] = value === 'true';
      }
    }

    return config;
  } catch (error) {
    console.warn(`Warning: Failed to load config file: ${error}`);
    return null;
  }
};

/**
 * Fetch evaluation scores for a batch by label
 */
export const fetchBatchScores = async (
  supabase: ReturnType<typeof createAdminClient>,
  label: string
): Promise<number[]> => {
  const { data, error } = await supabase
    .from('prompt_tests')
    .select(`
      id,
      prompt_evaluations (
        score_overall
      )
    `)
    .eq('batch_label', label)
    .eq('status', 'completed');

  if (error) {
    throw new Error(`Failed to fetch scores for ${label}: ${error.message}`);
  }

  return (data || [])
    .map((t) => {
      const evals = t.prompt_evaluations as Array<{ score_overall: number }> | null;
      return evals?.[0]?.score_overall;
    })
    .filter((score): score is number => score !== undefined && score !== null);
};

/**
 * Sleep utility for rate limiting
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
