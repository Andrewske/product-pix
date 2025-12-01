// scripts/test-ai.ts
// Run with: npx tsx scripts/test-ai.ts

import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

async function testAI() {
  console.log('Testing AI SDK connection...');

  try {
    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: 'Say "Hello ProductPix!"',
    });

    console.log('Response:', result.text);
    console.log('✓ AI SDK is working!');
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

testAI();
