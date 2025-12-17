import { createConversationSession } from '@/lib/ai/providers/gemini';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

async function debugThinkingTokens(): Promise<void> {
  console.log('=== Debugging Thinking Tokens ===\n');

  // Create conversation session (same as multi-angle template)
  const session = createConversationSession();

  // Load TWO reference images (like the original test)
  const image1Path = resolve(__dirname, '../fixtures/images/bag/bag-front.jpg');
  const image2Path = resolve(__dirname, '../fixtures/images/bag/bag-back.jpg');
  const image1Buffer = await readFile(image1Path);
  const image2Buffer = await readFile(image2Path);

  // Initialize with reference images (matching orchestrator's FIXED pattern)
  await session.initialize(
    [
      { buffer: image1Buffer, mimeType: 'image/jpeg', label: 'front view' },
      { buffer: image2Buffer, mimeType: 'image/jpeg', label: 'back view' }
    ],
    `Product: bag
Category: bags and luggage
You have 2 reference images of this product from different angles.
You will be asked to generate 5 professional e-commerce photos, one at a time.
Each photo must be visually unique from previous outputs.`
  );

  console.log('Session initialized with 2 reference images\n');

  // Generate first image (this is where thinking might appear)
  console.log('Generating image 1/2...');
  const result1 = await session.generateNext(
    'Generate a professional product photo from the front',
    { aspectRatio: '1:1', resolution: '1k', rawPrompt: false }
  );

  console.log('Result 1:', {
    success: result1.success,
    usage: result1.success ? result1.usage : null,
    error: !result1.success ? result1.error : undefined,
  });

  if (!result1.success) {
    console.error('Generation 1 failed, stopping test');
    return;
  }

  // Generate second image (to compare)
  console.log('\nGenerating image 2/2...');
  const result2 = await session.generateNext(
    'Generate a professional product photo from the side',
    { aspectRatio: '1:1', resolution: '1k', rawPrompt: false }
  );

  console.log('Result 2:', {
    success: result2.success,
    usage: result2.success ? result2.usage : null,
    error: !result2.success ? result2.error : undefined,
  });

  console.log('\n=== Analysis ===');
  if (result1.success && result2.success && result1.usage && result2.usage) {
    console.log('Token comparison:');
    console.log('Gen 1 input:', result1.usage.promptTokens);
    console.log('Gen 1 output:', result1.usage.completionTokens);
    console.log('Gen 2 input:', result2.usage.promptTokens);
    console.log('Gen 2 output:', result2.usage.completionTokens);
    console.log('\nOutput token ratio:', (result1.usage.completionTokens / result2.usage.completionTokens).toFixed(2) + 'x');
  }

  console.log('\n=== Done ===');
}

debugThinkingTokens().catch(console.error);
