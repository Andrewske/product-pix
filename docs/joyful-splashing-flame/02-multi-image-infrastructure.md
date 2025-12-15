# Multi-Image Test Infrastructure

## Files to Modify/Create
- `prompt-bench/core/types.ts` (modify - extend template types)
- `prompt-bench/core/category-classifier.ts` (new - product category detection)
- `prompt-bench/core/category-angles.ts` (new - research-backed angle mappings)
- `prompt-bench/templates/multi-angle-collection.ts` (new)
- `prompt-bench/core/orchestrator.ts` (modify - handle multi-image generation)
- `prompt-bench/fixtures/multi-image-batch.json` (new)

## Implementation Details

Extend the prompt-bench system to support multi-image input and collection output generation.

**Model:** Gemini 3 Pro Image (`gemini-3-pro-image-preview`) - supports up to 14 reference images per generation.

### 1. Extend Template Types (`types.ts`)

Add new fields to support collection templates:

```typescript
// Product categories (research-backed)
type ProductCategory =
  | 'apparel'
  | 'footwear'
  | 'electronics'
  | 'furniture'
  | 'beauty'
  | 'food'
  | 'tools'
  | 'jewelry'
  | 'generic';

interface CollectionTemplate extends BaseTemplate {
  type: 'collection';
  outputCount: number;  // how many images to generate
  varietyStrategy: 'category-based' | 'ai-decided' | 'hybrid';
  // Note: angles are now determined by detected category, not hardcoded in template
}

// Update TemplateDefinition union type
type TemplateDefinition = SingleTemplate | CollectionTemplate;
```

### 2. Category Classifier (`category-classifier.ts`)

Quick classification step to detect product category from input image(s). Minimal token cost (~100 tokens).

```typescript
const CATEGORY_PROMPT = `Classify this product into exactly ONE category:
- apparel (clothing, shirts, pants, dresses, jackets)
- footwear (shoes, boots, sandals, sneakers)
- electronics (phones, laptops, gadgets, cables, accessories)
- furniture (chairs, tables, sofas, storage, decor)
- beauty (cosmetics, skincare, haircare, fragrances)
- food (packaged food, beverages, supplements)
- tools (hand tools, power tools, hardware)
- jewelry (rings, necklaces, watches, earrings)
- generic (anything else)

Respond with ONLY the category name, nothing else.`;

async function classifyProduct(
  imageUrl: string,
  options?: { model?: string }
): Promise<Result<ProductCategory, ClassificationError>> {
  // Single vision API call with the first source image
  // Returns one of the ProductCategory values
}
```

### 3. Category → Angle Mapping (`category-angles.ts`)

Research-backed angle sets per product category. Based on e-commerce photography best practices from Amazon, Shopify, Etsy, and eBay guidelines.

```typescript
export const CATEGORY_ANGLES: Record<ProductCategory, string[]> = {
  apparel: [
    'front-on-model',      // Primary listing view
    '45-degree',           // Shows fit and drape
    'back',                // Back detail
    'detail-fabric',       // Texture/material close-up
    'flat-lay'             // Alternative clean view
  ],
  footwear: [
    '45-degree-left',      // Amazon standard main image
    'side-profile',        // Full side view
    'top-down',            // Toe shape and top
    'back-heel',           // Heel and back detail
    'outsole'              // Bottom tread (high return reducer)
  ],
  electronics: [
    'front-screen',        // Primary interface/screen
    '45-degree',           // Dimensional view
    'back-ports',          // Ports and connectivity
    'side-buttons',        // Side controls
    'detail-interface'     // Close-up of key feature
  ],
  furniture: [
    'front',               // Primary hero
    '45-degree',           // Shows depth
    'room-context',        // Lifestyle in setting
    'detail-material',     // Wood/fabric close-up
    'scale-reference'      // Size context
  ],
  beauty: [
    'front-label',         // Primary pack shot
    '45-degree',           // Dimensional view
    'back-ingredients',    // Ingredients/usage
    'texture-swatch',      // Product texture
    'lifestyle'            // In-use context
  ],
  food: [
    'front-label',         // Primary pack shot
    '45-degree',           // Angled view
    'back-nutrition',      // Nutrition facts
    'inside-texture',      // Product inside
    'serving-lifestyle'    // Prepared/serving context
  ],
  tools: [
    'front',               // Primary profile
    '45-degree',           // Dimensional view
    'working-end-detail',  // Bit/blade/head close-up
    'in-use',              // Action shot on material
    'scale-in-hand'        // Size reference
  ],
  jewelry: [
    'top-down',            // Editorial flat view
    '45-degree',           // Shows sparkle and dimension
    'profile',             // Band thickness/side view
    'macro-detail',        // Gemstone/engraving close-up
    'worn-scale'           // On model for size context
  ],
  generic: [
    'front',               // Primary hero
    '45-degree',           // Most versatile angle
    'back',                // Secondary view
    'detail',              // Close-up of key feature
    'scale'                // Size reference
  ]
};

export function getAnglesForCategory(category: ProductCategory): string[] {
  return CATEGORY_ANGLES[category];
}
```

### 4. Create Collection Template (`multi-angle-collection.ts`)

Create three template variants for testing variety strategies:

```typescript
// Strategy A: Category-based angles (RECOMMENDED)
// Detects product category, then uses research-backed angles for that category
export const multiAngleCategoryBased: CollectionTemplate = {
  slug: 'multi-angle-category-based',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'category-based',
  templateData: {
    subject: 'Professional e-commerce photo of {product} from {angle} view',
    background: 'on pure white seamless background',
    // ... rest of template
  },
  variablesSchema: {
    product: { type: 'string', required: true },
    angle: { type: 'string', required: true }  // injected from category angles
  }
};

// Strategy B: AI-decided
// No angle guidance - let AI choose all angles
export const multiAngleAiDecided: CollectionTemplate = {
  slug: 'multi-angle-ai-decided',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'ai-decided',
  templateData: {
    subject: 'Generate a unique angle of {product} for e-commerce. Create diverse, professional angles showing the product from different perspectives.',
    // ...
  }
};

// Strategy C: Hybrid
// Uses first 2 angles from category, AI decides remaining 3
export const multiAngleHybrid: CollectionTemplate = {
  slug: 'multi-angle-hybrid',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'hybrid',
  templateData: {
    subject: 'Professional photo of {product}. Required: {angle}. For remaining images, choose creative angles appropriate for this product type.',
    // ...
  }
};
```

### 5. Extend Orchestrator (`orchestrator.ts`)

Modify the run pipeline to handle collection templates with category detection:

```typescript
// In runTests or similar function:
if (template.type === 'collection') {
  return runCollectionTest(template, test, options);
}

async function runCollectionTest(
  template: CollectionTemplate,
  test: MultiImageTest,
  options: RunOptions
): Promise<Result<CollectionTestResult, RunError>> {
  const results: GeneratedImage[] = [];

  // STEP 1: Detect product category (if using category-based or hybrid strategy)
  let category: ProductCategory = 'generic';
  let angles: string[] = [];

  if (template.varietyStrategy === 'category-based' || template.varietyStrategy === 'hybrid') {
    const categoryResult = await classifyProduct(test.sourceImages[0], options);
    if (!categoryResult.ok) {
      console.warn('Category detection failed, falling back to generic');
      category = 'generic';
    } else {
      category = categoryResult.value;
    }
    angles = getAnglesForCategory(category);
    console.log(`Detected category: ${category}, using angles: ${angles.join(', ')}`);
  }

  // STEP 2: Generate each image in the collection
  for (let i = 0; i < template.outputCount; i++) {
    let angle: string | undefined;

    if (template.varietyStrategy === 'category-based') {
      // Use all angles from category
      angle = angles[i];
    } else if (template.varietyStrategy === 'hybrid') {
      // First 2 from category, rest AI-decided
      angle = i < 2 ? angles[i] : undefined;
    }
    // ai-decided: angle stays undefined, AI chooses

    // Compile prompt with angle if specified
    const compiledPrompt = compileTemplate(template, {
      ...test.variables,
      angle,
      category,  // Include detected category for context
      outputIndex: i,
      totalOutputs: template.outputCount
    });

    // Generate with ALL source images as context
    const result = await generateWithMultipleInputs(
      test.sourceImages,  // array of image paths/URLs
      compiledPrompt,
      options
    );

    results.push(result);
  }

  return ok({
    images: results,
    template,
    test,
    detectedCategory: category,  // Include for analysis
    anglesUsed: angles
  });
}
```

### 6. Create Multi-Image Batch Format (`multi-image-batch.json`)

```json
{
  "label": "stage1-multi-input-test",
  "description": "Test whether multiple input images improve output quality",
  "tests": [
    {
      "sourceImages": [
        "fixtures/images/suitcase-front.jpg",
        "fixtures/images/suitcase-back.jpg",
        "fixtures/images/suitcase-side.jpg"
      ],
      "variables": {
        "product": "monos suitcase"
      },
      "notes": "Suitcase - 3 angles provided"
    },
    {
      "sourceImages": [
        "fixtures/images/suitcase-front.jpg"
      ],
      "variables": {
        "product": "monos suitcase"
      },
      "notes": "Suitcase - single angle (control)"
    }
  ]
}
```

## Acceptance Criteria

- [ ] `types.ts` exports `CollectionTemplate` and `ProductCategory` types
- [ ] `category-classifier.ts` detects product category from image (~100 tokens)
- [ ] `category-angles.ts` exports research-backed angle mappings for all 9 categories
- [ ] Three template variants created (category-based, ai-decided, hybrid)
- [ ] Orchestrator handles `type: 'collection'` templates with category detection
- [ ] Batch format supports `sourceImages` array
- [ ] All source images passed to Gemini for each output generation
- [ ] Templates registered in registry and exported from index
- [ ] Results include `detectedCategory` and `anglesUsed` for analysis

## Dependencies

- Task 01 (Collection Evaluator) - needed to evaluate results
