#!/usr/bin/env bun
import { createAdminClient } from '@/lib/supabase/admin';

const NEW_PROMPT = `Analyze this product image and extract detailed information about the product.

## Scale Detection (IMPORTANT)
Look for visual references that indicate the product's size:
- Is the product being held or worn by a person?
- Are there body parts visible (fingers, arms, torso, etc.)?
- Are there common objects nearby for scale (table, floor, etc.)?
- Can you see how the product relates to the person's body proportions?

If you find a scale reference:
1. Compare the product size to the reference
2. Estimate the product's size category:
   - "compact" or "small": Easily held in one or two hands, under 12 inches in largest dimension
   - "medium": Requires two hands or one arm, 12-18 inches in largest dimension
   - "large": Requires both arms or full body to hold/wear, over 18 inches in largest dimension
3. Provide a specific size description (e.g., "compact bag about 10-12 inches wide", "small item fits in palm", "large bag requiring both arms")

## Product Information
Extract these details:
- Product type and name
- Primary color and finish
- Material composition
- Overall shape and form
- Key distinguishing features

Be specific and accurate. If something cannot be determined, use a reasonable inference based on what's visible.`;

const supabase = createAdminClient();

console.log('Updating analysis prompt...\n');
console.log('New Prompt:');
console.log('='.repeat(80));
console.log(NEW_PROMPT);
console.log('='.repeat(80));
console.log();

// Get current version
const { data: current } = await supabase
  .from('analysis_prompts')
  .select('version')
  .eq('slug', 'product-analysis')
  .order('version', { ascending: false })
  .limit(1)
  .single();

const newVersion = (current?.version || 0) + 1;

console.log(`Creating version ${newVersion}...`);

// Insert new version
const { error } = await supabase
  .from('analysis_prompts')
  .insert({
    slug: 'product-analysis',
    version: newVersion,
    status: 'active',
    prompt_text: NEW_PROMPT,
    response_schema: {} // Schema is defined in code
  });

if (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}

// Mark old versions as archived
await supabase
  .from('analysis_prompts')
  .update({ status: 'archived' })
  .eq('slug', 'product-analysis')
  .lt('version', newVersion);

console.log(`✅ Created version ${newVersion} and archived previous versions`);
