#!/usr/bin/env bun
/**
 * Test analysis prompt only - see what scale detection produces
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { analyzeProductImages } from '@bench/core/product-analyzer';

const INPUT_IMAGES = [
  'prompt-bench/fixtures/images/bag/bag-back.jpg',
  'prompt-bench/fixtures/images/bag/bag-front.jpg'
];

const MODELS_TO_TEST = [
  // 'gemini-2.0-flash'
  'gemini-2.5-pro',
  // 'gemini-3-flash-preview',
  // 'gemini-3-pro-preview'
];

async function testAnalysis() {
  console.log('🔬 Testing Analysis Prompt Only\n');
  console.log('Images:');
  INPUT_IMAGES.forEach((path, idx) => {
    console.log(`  ${idx + 1}. ${path}`);
  });
  console.log();

  // Load images
  const images = INPUT_IMAGES.map(path => {
    const fullPath = resolve(process.cwd(), path);
    const buffer = readFileSync(fullPath);
    return { buffer, mimeType: 'image/jpeg' as const };
  });

  // Test each model
  for (const model of MODELS_TO_TEST) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 Model: ${model}`);
    console.log('='.repeat(60));

    const result = await analyzeProductImages(images, {
      model,
      cacheEnabled: false
    });

    if (!result.ok) {
      console.error(`❌ Error: ${result.error.message}`);
      continue;
    }

    const { individual, merged } = result.data;

    // Show individual results
    individual.forEach((analysis, idx) => {
      console.log(`\n📸 Image ${idx + 1}: ${INPUT_IMAGES[idx].split('/').pop()}`);
      console.log('─'.repeat(60));
      console.log(`Product:           ${analysis.product}`);
      console.log(`Color:             ${analysis.color}`);
      console.log(`Material:          ${analysis.material}`);
      console.log(`Shape:             ${analysis.shape}`);
      console.log(`Features:          ${analysis.features.join(', ')}`);
      console.log(`\n🔍 Scale Detection:`);
      console.log(`  Has Reference:   ${analysis.hasScaleReference ? '✅ YES' : '❌ NO'}`);
      if (analysis.scaleDescription) {
        console.log(`  Description:     "${analysis.scaleDescription}"`);
      }
      console.log(`\n🏷️  Brand:`);
      console.log(`  Brand Name:      ${analysis.brand || 'Not detected'}`);
      if (analysis.brandingDetails) {
        console.log(`  Details:         "${analysis.brandingDetails}"`);
      }
    });

    // Show merged result
    console.log(`\n🔀 Merged Analysis:`);
    console.log('─'.repeat(60));
    console.log(`Product:           ${merged.product}`);
    console.log(`Has Scale Ref:     ${merged.hasScaleReference ? '✅ YES' : '❌ NO'}`);
    if (merged.scaleDescription) {
      console.log(`Scale Description: "${merged.scaleDescription}"`);
    }
    console.log(`Brand:             ${merged.brand || 'Not detected'}`);
    if (merged.brandingDetails) {
      console.log(`Branding Details:  "${merged.brandingDetails}"`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Analysis test complete');
}

testAnalysis().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
