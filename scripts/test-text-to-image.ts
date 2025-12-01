// scripts/test-text-to-image.ts
// Run with: npx tsx scripts/test-text-to-image.ts

import { getImageProvider } from '../src/lib/ai';
import * as fs from 'fs';

async function testTextToImage() {
  console.log('Testing text-to-image generation...');

  const provider = getImageProvider();

  const result = await provider.generateFromText(
    'A professional product photo of a red leather handbag on a clean white background with soft shadows',
    {
      aspectRatio: '1:1',
      resolution: '1k',
    }
  );

  if (result.success) {
    console.log('✓ Generation successful!');
    console.log(`  Size: ${result.width}x${result.height}`);
    console.log(`  Type: ${result.mimeType}`);

    // Save to file for inspection
    const buffer = Buffer.from(result.imageData, 'base64');
    fs.writeFileSync('test-output.png', buffer);
    console.log('  Saved to test-output.png');
  } else {
    console.error('✗ Generation failed:', result.error);
    console.error('  Code:', result.code);
    console.error('  Retryable:', result.retryable);
    process.exit(1);
  }
}

testTextToImage().catch(console.error);
