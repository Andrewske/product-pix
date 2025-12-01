// scripts/test-image-to-image.ts
// Run with: npx tsx scripts/test-image-to-image.ts <input-image-path>

import { getImageProvider } from '../src/lib/ai';
import { validateImage, getMimeTypeFromBuffer } from '../src/lib/images';
import * as fs from 'fs';

async function testImageToImage() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: npx tsx scripts/test-image-to-image.ts <input-image-path>');
    process.exit(1);
  }

  console.log('Testing image-to-image generation...');
  console.log('Input:', inputPath);

  // Read source image
  const sourceBuffer = fs.readFileSync(inputPath);
  const mimeType = getMimeTypeFromBuffer(sourceBuffer);

  if (!mimeType) {
    console.error('✗ Could not determine image type');
    process.exit(1);
  }

  // Validate
  const validation = validateImage(sourceBuffer, mimeType);
  if (!validation.valid) {
    console.error('✗ Validation failed:', validation.error);
    process.exit(1);
  }

  console.log(`Source: ${mimeType}, ${sourceBuffer.length} bytes`);

  const provider = getImageProvider();

  const result = await provider.generateFromImage(
    sourceBuffer,
    mimeType,
    'Professional product photo with clean white background, soft shadows, studio lighting',
    {
      aspectRatio: '1:1',
      resolution: '1k',
    }
  );

  if (result.success) {
    console.log('✓ Generation successful!');
    console.log(`  Output: ${result.width}x${result.height}, ${result.mimeType}`);

    const buffer = Buffer.from(result.imageData, 'base64');
    fs.writeFileSync('test-output-transformed.png', buffer);
    console.log('  Saved to test-output-transformed.png');
  } else {
    console.error('✗ Generation failed:', result.error);
    console.error('  Code:', result.code);
    process.exit(1);
  }
}

testImageToImage().catch(console.error);
