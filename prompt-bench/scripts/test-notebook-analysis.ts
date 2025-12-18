#!/usr/bin/env bun
import { runAnalysisPhase } from '../core/notebook-orchestrator';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

// Test with fixture IDs from database (get these from earlier fixture sync)
const result = await runAnalysisPhase({
  sessionId: `test-${Date.now()}`,
  fixtureImageIds: ['<paste-fixture-id-here>'], // Replace with actual ID
  model: 'gemini-2.0-flash',
  cacheEnabled: false
});

if (result.ok) {
  console.log('✓ Analysis succeeded');
  console.log('Run ID:', result.data.runId);
  console.log('Tokens:', result.data.tokens);
  console.log('Analysis:', JSON.stringify(result.data.analysis, null, 2));
} else {
  console.error('✗ Analysis failed:', result.error.message);
  process.exit(1);
}