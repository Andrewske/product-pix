// scripts/test-aspect-ratios.ts
// Run with: npx tsx scripts/test-aspect-ratios.ts
import { getImageProvider, type ImageConfig } from '../src/lib/ai';

const aspectRatios: ImageConfig['aspectRatio'][] = [
  '1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'
];

async function testAspectRatios() {
  const provider = getImageProvider();

  for (const ratio of aspectRatios) {
    console.log(`Testing ${ratio}...`);

    const result = await provider.generateFromText(
      'A simple red circle on white background',
      { aspectRatio: ratio, resolution: '1k' }
    );

    if (result.success) {
      console.log(`  ✓ ${ratio}: ${result.width}x${result.height}`);
    } else {
      console.log(`  ✗ ${ratio}: ${result.error}`);
    }

    // Rate limit protection
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testAspectRatios().catch(console.error);
