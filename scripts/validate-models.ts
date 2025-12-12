import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from '@iarna/toml';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Extract all model references from the codebase that should be validated
 */
function getRequiredModels(): { critical: string[]; environmentDefaults: Record<string, string> } {
  return {
    // Models that must be configured for the app to function
    critical: [
      'gemini-3-pro-image-preview', // GEMINI_MODEL default
      'gemini-2.0-flash',          // ANALYSIS_MODEL default
      'claude-sonnet-4-20250514',  // prompt-bench evaluation default
    ],
    // Environment variable defaults that should match pricing config
    environmentDefaults: {
      GEMINI_MODEL: 'gemini-3-pro-image-preview',
      ANALYSIS_MODEL: 'gemini-2.0-flash',
    },
  };
}

/**
 * Load and parse pricing configuration from TOML file
 */
function loadFullConfig(): { pricing: Record<string, Record<string, any>>; defaults: Record<string, any> } {
  const configPath = resolve(process.cwd(), 'prompt-bench.toml');

  try {
    const fileContent = readFileSync(configPath, 'utf-8');
    const parsed = parse(fileContent) as any;

    if (!parsed.pricing) {
      throw new Error('Missing [pricing] section in config file');
    }

    return {
      pricing: parsed.pricing,
      defaults: parsed.defaults || {},
    };
  } catch (error) {
    throw new Error(`Failed to load pricing config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract all configured models from pricing config
 */
function getConfiguredModels(pricingConfig: Record<string, Record<string, any>>): Set<string> {
  const configuredModels = new Set<string>();

  ['anthropic', 'openai', 'google'].forEach(provider => {
    if (pricingConfig[provider]) {
      Object.keys(pricingConfig[provider]).forEach(model => {
        configuredModels.add(model);
      });
    }
  });

  return configuredModels;
}

/**
 * Check if a model is configured, including version-stripped variants
 */
function isModelConfigured(modelId: string, configuredModels: Set<string>): boolean {
  // Exact match
  if (configuredModels.has(modelId)) {
    return true;
  }

  // Check base model (strip version suffixes)
  const baseModel = modelId.replace(/-\d{8}$|-\d+\.\d+$|-\d+$/, '');
  return configuredModels.has(baseModel);
}

/**
 * Validate that all required models are properly configured
 */
export function validateModelConfiguration(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const fullConfig = loadFullConfig();
    const pricingConfig = fullConfig.pricing;
    const defaultsConfig = fullConfig.defaults;
    const configuredModels = getConfiguredModels(pricingConfig);
    const { critical, environmentDefaults } = getRequiredModels();

    // Check critical models
    critical.forEach(model => {
      if (!isModelConfigured(model, configuredModels)) {
        errors.push(`Critical model '${model}' is not configured in pricing. Add it to [pricing.*] section in prompt-bench.toml`);
      }
    });

    // Check environment variable defaults
    Object.entries(environmentDefaults).forEach(([envVar, defaultModel]) => {
      if (!isModelConfigured(defaultModel, configuredModels)) {
        errors.push(`Environment variable ${envVar} default '${defaultModel}' is not in pricing config`);
      }
    });

    // Check that improvement_model is configured
    if (!defaultsConfig?.improvement_model) {
      errors.push(`defaults.improvement_model is not set in prompt-bench.toml. This is required for the improve command.`);
    } else if (!isModelConfigured(defaultsConfig.improvement_model, configuredModels)) {
      errors.push(`defaults.improvement_model '${defaultsConfig.improvement_model}' is not in pricing config`);
    }

    // No remaining hardcoded models - all are now configurable

  } catch (error) {
    errors.push(`Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// CLI usage
if (require.main === module) {
  const result = validateModelConfiguration();

  if (!result.isValid) {
    console.error('❌ Model validation failed:');
    result.errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Model validation warnings:');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  console.log('✅ All models are properly configured');
}