#!/usr/bin/env bun
/**
 * Standalone scale testing script
 *
 * Tests different prompt variations for maintaining product scale
 * Outputs HTML file with input images, prompt, and result
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { createConversationSession } from '@/lib/ai/providers/gemini';
import { analyzeProductImages } from '@bench/core/product-analyzer';
import type { ProductAnalysis } from '@/types/analysis';

// Configuration
const INPUT_IMAGES = [
  'prompt-bench/fixtures/images/bag/bag-back.jpg',
  'prompt-bench/fixtures/images/bag/bag-front.jpg'
];

const OUTPUT_DIR = 'reports/scale-tests';

// Model configuration
// Analysis Model Options:
// - 'gemini-2.0-flash': Fast, cheap (~$0.075 per 1M tokens input) - BEST at detecting "compact" size!
// - 'gemini-2.5-pro': More accurate reasoning (~$1.25 per 1M tokens input) - tends to say "medium"
// - 'gemini-3-flash-preview': Latest flash model
// - 'gemini-3-pro-preview': Latest pro model
//
// Testing shows gemini-2.0-flash is best at correctly identifying compact/small products.
const ANALYSIS_MODEL = 'gemini-2.0-flash'; // Best for scale detection
const GENERATION_MODEL = 'gemini-3-pro-image-preview'; // Model used for image generation

// Test prompts to try
const TEST_PROMPTS = {
  emphatic: `CRITICAL SCALE REQUIREMENT: This is a compact, hand-held tote bag approximately 10-12 inches wide, as shown in the reference images with hand for scale. DO NOT enlarge it to fill the frame.

Generate a professional e-commerce photo showing a model holding this exact same compact bag. The bag MUST maintain its actual small size - it should look hand-holdable, NOT like a large tote.

Technical specs:
- White seamless background
- Soft studio lighting
- Shot on DSLR with 85mm lens f/8
- Product at authentic scale (not scaled to fill frame)
- Model holds bag naturally in one hand or over shoulder
- Bag appears compact and hand-sized relative to model

IMPORTANT: The bag in your output must be the SAME SMALL SIZE as shown in the reference images. Do not make it larger.`,

  measurements: `Generate a professional e-commerce photo with model holding this tote bag.

SCALE SPECIFICATION: The reference images show the actual product size with hand for scale. This is a COMPACT bag, approximately:
- Width: 10-12 inches (25-30cm)
- Height: 8-10 inches (20-25cm)
- Depth: 3-4 inches (8-10cm)
- Can be held comfortably in one hand

Your generated image must show the bag at this exact compact size. The model should be able to hold it easily in one hand or tucked under one arm. It should NOT appear as a large tote bag.

Technical: White background, studio lighting, DSLR 85mm f/8, authentic product scale maintained.`,

  negative: `Professional model photo of this tote bag on white background with studio lighting.

CRITICAL: Reference images show actual product size with hand - this is a compact, hand-holdable bag about 10-12 inches wide.

Generate the model holding this bag at its true compact size. DO NOT make it larger.

Negative: oversized bag, enlarged bag, giant bag, large tote, bag scaled to fill frame, exaggerated proportions`,

  simple: `Professional photo: model holding this compact tote bag (shown with hand for scale in reference images - about 10-12 inches wide).

The bag must appear small and hand-holdable on the model. White background, studio lighting.

Key: Maintain the exact compact size shown in reference images. This is a small bag, not a large tote.`
};

interface TestResult {
  promptName: string;
  prompt: string;
  imageData: string;
  timestamp: string;
  analysisResults?: ProductAnalysis[];
  scaleInstruction?: string;
  analysisModel?: string;
  error?: string;
}

async function runTest(promptName: string, prompt: string): Promise<TestResult> {
  console.log(`\n🧪 Testing: ${promptName}`);
  console.log(`Prompt length: ${prompt.length} chars`);

  const timestamp = new Date().toISOString();

  try {
    // Load input images
    const images = INPUT_IMAGES.map(path => {
      const fullPath = resolve(process.cwd(), path);
      const buffer = readFileSync(fullPath);
      return {
        buffer,
        mimeType: 'image/jpeg',
        label: path.split('/').pop() || path
      };
    });

    console.log(`📸 Loaded ${images.length} reference images`);

    // Analyze images to detect scale information
    console.log(`🔍 Analyzing images for scale detection (${ANALYSIS_MODEL})...`);
    const analysisResult = await analyzeProductImages(
      images.map(img => ({ buffer: img.buffer, mimeType: img.mimeType })),
      {
        model: ANALYSIS_MODEL,
        cacheEnabled: false // Disable cache for fresh analysis
      }
    );

    if (!analysisResult.ok) {
      throw new Error(`Analysis failed: ${analysisResult.error.message}`);
    }

    const { individual: analysisResults } = analysisResult.data;
    console.log('✅ Analysis complete');

    // Build scale instruction from analysis
    const imagesWithScale = analysisResults
      .map((analysis, idx) => ({
        index: idx,
        hasScale: analysis.hasScaleReference,
        description: analysis.scaleDescription
      }))
      .filter(x => x.hasScale);

    let scaleInstruction = '';
    if (imagesWithScale.length > 0) {
      const scaleImage = imagesWithScale[0];
      scaleInstruction = `SCALE REQUIREMENT: Image ${scaleImage.index + 1} shows scale reference${scaleImage.description ? ` (${scaleImage.description})` : ''}. Maintain exact same physical product dimensions in all generated images.`;
      console.log(`📏 Scale detected: ${scaleImage.description || 'yes'}`);
    } else {
      scaleInstruction = 'SCALE REQUIREMENT: Maintain consistent realistic product dimensions across all generated images.';
      console.log('⚠️  No scale reference detected');
    }

    // Create session
    const session = createConversationSession();

    // Initialize with reference images
    await session.initialize(
      images,
      `You are generating a professional e-commerce photo. The reference images show the actual product with hand for scale. Maintain this exact size in your output.`
    );

    console.log('🤖 Generating image...');

    // Generate
    const result = await session.generateNext(prompt, {
      rawPrompt: true,
      aspectRatio: '3:4',
      resolution: '1k'
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    console.log('✅ Generation successful');

    return {
      promptName,
      prompt,
      imageData: result.imageData,
      timestamp,
      analysisResults,
      scaleInstruction,
      analysisModel: ANALYSIS_MODEL
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error: ${message}`);

    return {
      promptName,
      prompt,
      imageData: '',
      timestamp,
      error: message
    };
  }
}

function generateHTML(results: TestResult[]): string {
  const inputImagesHTML = INPUT_IMAGES.map(path => {
    const buffer = readFileSync(resolve(process.cwd(), path));
    const base64 = buffer.toString('base64');
    const filename = path.split('/').pop();
    return `
      <div class="input-image">
        <h3>${filename}</h3>
        <img src="data:image/jpeg;base64,${base64}" alt="${filename}">
      </div>
    `;
  }).join('');

  const resultsHTML = results.map((result, index) => {
    const analysisHTML = result.analysisResults ? `
      <div class="analysis-section">
        <h3>🔍 Analysis Results</h3>
        ${result.analysisModel ? `<div class="model-badge">Model: ${result.analysisModel}</div>` : ''}
        ${result.analysisResults.map((analysis, idx) => `
          <div class="analysis-item">
            <h4>Image ${idx + 1}: ${INPUT_IMAGES[idx].split('/').pop()}</h4>
            <div class="analysis-details">
              <div class="detail-row">
                <span class="label">Product:</span>
                <span class="value">${analysis.product}</span>
              </div>
              <div class="detail-row">
                <span class="label">Color:</span>
                <span class="value">${analysis.color}</span>
              </div>
              <div class="detail-row">
                <span class="label">Material:</span>
                <span class="value">${analysis.material}</span>
              </div>
              <div class="detail-row">
                <span class="label">Shape:</span>
                <span class="value">${analysis.shape}</span>
              </div>
              <div class="detail-row">
                <span class="label">Features:</span>
                <span class="value">${analysis.features.join(', ')}</span>
              </div>
              <div class="detail-row ${analysis.hasScaleReference ? 'scale-detected' : ''}">
                <span class="label">Scale Reference:</span>
                <span class="value">${analysis.hasScaleReference ? '✅ YES' : '❌ NO'}</span>
              </div>
              ${analysis.scaleDescription ? `
                <div class="detail-row scale-description">
                  <span class="label">Scale Description:</span>
                  <span class="value">${analysis.scaleDescription}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
        ${result.scaleInstruction ? `
          <div class="scale-instruction-box">
            <h4>📏 Generated Scale Instruction</h4>
            <p>${result.scaleInstruction}</p>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
    <div class="test-result">
      <h2>Test ${index + 1}: ${result.promptName}</h2>
      <div class="timestamp">${result.timestamp}</div>

      ${analysisHTML}

      <div class="prompt-section">
        <h3>Prompt</h3>
        <pre class="prompt">${result.prompt}</pre>
      </div>

      ${result.error ? `
        <div class="error">
          <h3>Error</h3>
          <p>${result.error}</p>
        </div>
      ` : `
        <div class="output-section">
          <h3>Generated Image</h3>
          <img src="data:image/png;base64,${result.imageData}" alt="Generated ${result.promptName}">
        </div>
      `}
    </div>
  `}).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Scale Prompt Testing - ${new Date().toISOString()}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2em;
    }

    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }

    .input-images {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 6px;
    }

    .input-image h3 {
      margin-bottom: 10px;
      color: #555;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-image img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 2px solid #ddd;
    }

    .test-result {
      margin-bottom: 60px;
      padding-bottom: 40px;
      border-bottom: 2px solid #eee;
    }

    .test-result:last-child {
      border-bottom: none;
    }

    .test-result h2 {
      color: #2563eb;
      margin-bottom: 5px;
    }

    .timestamp {
      color: #999;
      font-size: 0.85em;
      margin-bottom: 20px;
    }

    .prompt-section {
      margin-bottom: 30px;
    }

    .prompt-section h3,
    .output-section h3 {
      color: #333;
      margin-bottom: 10px;
      font-size: 1.1em;
    }

    .prompt {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #2563eb;
      white-space: pre-wrap;
      font-size: 0.9em;
      line-height: 1.5;
      overflow-x: auto;
    }

    .output-section img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      border: 2px solid #ddd;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .error {
      background: #fee;
      border: 2px solid #fcc;
      border-radius: 6px;
      padding: 20px;
      color: #c00;
    }

    .error h3 {
      margin-bottom: 10px;
    }

    .analysis-section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 6px;
      border: 2px solid #e5e7eb;
    }

    .analysis-section h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.1em;
    }

    .model-badge {
      display: inline-block;
      background: #6366f1;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
      margin-bottom: 15px;
    }

    .analysis-item {
      background: white;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 15px;
      border: 1px solid #e5e7eb;
    }

    .analysis-item:last-child {
      margin-bottom: 0;
    }

    .analysis-item h4 {
      color: #555;
      margin-bottom: 10px;
      font-size: 0.95em;
    }

    .analysis-details {
      display: grid;
      gap: 8px;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row .label {
      font-weight: 600;
      color: #666;
      font-size: 0.9em;
    }

    .detail-row .value {
      color: #333;
      font-size: 0.9em;
    }

    .detail-row.scale-detected {
      background: #ecfdf5;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #10b981;
    }

    .detail-row.scale-description {
      background: #eff6ff;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #3b82f6;
    }

    .detail-row.scale-description .value {
      font-weight: 500;
      color: #1e40af;
    }

    .scale-instruction-box {
      margin-top: 15px;
      padding: 15px;
      background: white;
      border: 2px solid #10b981;
      border-radius: 4px;
    }

    .scale-instruction-box h4 {
      color: #059669;
      margin-bottom: 8px;
      font-size: 0.95em;
    }

    .scale-instruction-box p {
      color: #333;
      font-size: 0.9em;
      line-height: 1.5;
      margin: 0;
    }

    @media (max-width: 768px) {
      body {
        padding: 10px;
      }

      .container {
        padding: 20px;
      }

      .input-images {
        grid-template-columns: 1fr;
      }

      .detail-row {
        grid-template-columns: 1fr;
        gap: 4px;
      }

      .detail-row .label {
        font-weight: 700;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Scale Prompt Testing</h1>
    <div class="subtitle">Testing different prompt variations for maintaining product scale</div>

    <section>
      <h2>📸 Reference Images (Input)</h2>
      <div class="input-images">
        ${inputImagesHTML}
      </div>
    </section>

    <section>
      <h2>🧪 Test Results</h2>
      ${resultsHTML}
    </section>
  </div>
</body>
</html>`;
}

// Main execution
async function main() {
  console.log('🚀 Scale Prompt Testing Script');
  console.log('================================\n');

  const results: TestResult[] = [];

  // Run all tests
  for (const [name, prompt] of Object.entries(TEST_PROMPTS)) {
    const result = await runTest(name, prompt);
    results.push(result);
  }

  // Generate HTML report
  console.log('\n📝 Generating HTML report...');
  const html = generateHTML(results);

  // Ensure output directory exists
  const outputPath = resolve(process.cwd(), OUTPUT_DIR);
  const { mkdirSync } = await import('fs');
  mkdirSync(outputPath, { recursive: true });

  // Write HTML file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `scale-test-${timestamp}.html`;
  const filepath = resolve(outputPath, filename);

  writeFileSync(filepath, html);

  console.log(`✅ Report saved: ${filepath}`);
  console.log(`\n🌐 Open in browser: file://${filepath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
