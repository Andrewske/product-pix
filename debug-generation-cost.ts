/**
 * Debug script to investigate why generation costs show as $0.0000
 *
 * Makes a single Gemini image generation call and saves the complete
 * raw response to JSON for inspection.
 *
 * Usage: bun run debug-generation-cost.ts
 */

import { config } from 'dotenv';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { normalizeUsage } from '@/lib/ai/usage-types';
import { calculateCost } from '@bench/core/cost';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

const debugGeneration = async (): Promise<void> => {
  console.log('\n🔍 Debug: Gemini Image Generation Cost\n');
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`─────────────────────────────────────\n`);

  const model = google(GEMINI_MODEL);
  const testPrompt = 'Generate a professional product photo of a red coffee mug on a white background';

  console.log('📤 Sending generation request...');
  console.log(`Prompt: ${testPrompt}\n`);

  try {
    const startTime = Date.now();

    const result = await generateText({
      model,
      providerOptions: {
        google: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      },
      prompt: testPrompt,
    });

    const duration = Date.now() - startTime;

    console.log(`✅ Generation completed in ${duration}ms\n`);

    // Extract all available data
    const debugData = {
      timestamp: new Date().toISOString(),
      model: GEMINI_MODEL,
      prompt: testPrompt,
      duration_ms: duration,
      response: {
        // Text response (if any)
        text: result.text,

        // Usage metadata (THIS IS WHAT WE'RE INVESTIGATING)
        usage: result.usage,

        // Raw usage object (in case there's extra data)
        usage_raw: JSON.parse(JSON.stringify(result.usage || {})),

        // Files (images)
        files: result.files?.map((file) => ({
          mediaType: file.mediaType,
          hasBase64: !!file.base64,
          base64Length: file.base64?.length || 0,
        })),

        // Full result keys (to see what else is available)
        available_keys: Object.keys(result),

        // COMPLETE RAW RESULT (excluding base64 data for readability)
        full_result_structure: JSON.parse(JSON.stringify(result, (key, value) => {
          // Exclude base64 data to keep file size manageable
          if (key === 'base64' && typeof value === 'string' && value.length > 100) {
            return `[BASE64_DATA_${value.length}_chars]`;
          }
          return value;
        })),
      },
      analysis: {
        has_usage: !!result.usage,
        has_files: !!result.files && result.files.length > 0,
        usage_fields: result.usage ? Object.keys(result.usage) : [],
      },
    };

    // Save to JSON
    const outputPath = resolve(process.cwd(), 'debug-generation-response.json');
    writeFileSync(outputPath, JSON.stringify(debugData, null, 2), 'utf-8');

    console.log('📋 Response Analysis:');
    console.log(`───────────────────────────────────\n`);
    console.log(`Has usage data: ${debugData.analysis.has_usage ? '✅' : '❌'}`);
    console.log(`Has image files: ${debugData.analysis.has_files ? '✅' : '❌'}`);

    if (debugData.analysis.has_usage) {
      console.log(`\nUsage fields found:`);
      for (const field of debugData.analysis.usage_fields) {
        const value = (result.usage as Record<string, unknown>)[field];
        console.log(`  - ${field}: ${value}`);
      }
    } else {
      console.log(`\n⚠️  NO USAGE DATA FOUND`);
      console.log(`This explains why generation costs show as $0.0000`);
    }

    if (debugData.analysis.has_files) {
      console.log(`\nGenerated ${result.files?.length} file(s):`);
      result.files?.forEach((file, i) => {
        console.log(`  ${i + 1}. ${file.mediaType} (${file.base64?.length || 0} chars)`);
      });
    }

    // Test the normalization and cost calculation
    if (result.usage) {
      console.log(`\n🔬 Testing normalization and cost calculation:\n`);

      const normalized = normalizeUsage(result.usage);
      console.log(`Normalized usage:`);
      console.log(`  - promptTokens: ${normalized.promptTokens}`);
      console.log(`  - completionTokens: ${normalized.completionTokens}`);
      console.log(`  - totalTokens: ${normalized.totalTokens}`);

      const costResult = calculateCost('gemini-3-pro-image-preview', {
        input: normalized.promptTokens,
        output: normalized.completionTokens,
      });

      console.log(`\nCost calculation result:`);
      console.log(`  - ok: ${costResult.ok}`);
      console.log(`  - data: ${JSON.stringify(costResult.ok ? costResult.data : null)}`);
      console.log(`  - error: ${!costResult.ok ? costResult.error.message : 'none'}`);

      if (costResult.ok && costResult.data) {
        console.log(`\n💰 Final costs:`);
        console.log(`  - Input cost: $${costResult.data.inputCost.toFixed(6)}`);
        console.log(`  - Output cost: $${costResult.data.outputCost.toFixed(6)}`);
        console.log(`  - Total cost: $${costResult.data.total.toFixed(6)}`);
        console.log(`  - Model: ${costResult.data.modelId}`);
        console.log(`  - Provider: ${costResult.data.provider}`);
      } else if (!costResult.ok) {
        console.log(`\n❌ Cost calculation failed:`);
        console.log(`   ${costResult.error.message}`);
      } else {
        console.log(`\n⚠️  Cost result is OK but data is missing!`);
      }
    }

    console.log(`\n📁 Full response saved to:`);
    console.log(`   ${outputPath}\n`);

  } catch (error) {
    console.error('\n❌ Generation failed:\n');

    const errorData = {
      timestamp: new Date().toISOString(),
      model: GEMINI_MODEL,
      prompt: testPrompt,
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        raw: JSON.parse(JSON.stringify(error)),
      },
    };

    const outputPath = resolve(process.cwd(), 'debug-generation-error.json');
    writeFileSync(outputPath, JSON.stringify(errorData, null, 2), 'utf-8');

    console.error(errorData.error.message);
    console.log(`\n📁 Error details saved to:`);
    console.log(`   ${outputPath}\n`);

    process.exit(1);
  }
};

// Run the debug script
debugGeneration();
