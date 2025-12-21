# Implement Paperwork Detection in Gemini Analyzer

## Files to Modify
- `prompt-bench/core/product-analyzer.ts` (lines 190-200) - modify
- `prompt-bench/ui/components/notebook/AnalysisPhase.tsx` (lines 61-108) - modify

## Implementation Details

### Part 1: Update Zod Schema (product-analyzer.ts)

Add paperwork detection fields to the Gemini analysis Zod schema:

```typescript
const schema = customSchema
  ? jsonSchemaToZod(customSchema)
  : z.object({
      product: z.string().describe('The main product name/type'),
      color: z.string().describe('Primary color and finish'),
      material: z.string().describe('Primary material composition'),
      shape: z.string().describe('Overall shape and form'),
      features: z.array(z.string()).describe('Key distinguishing features'),
      hasScaleReference: z.boolean().describe('True if human hand/body part or common object visible for scale comparison'),
      scaleDescription: z.string().optional().describe('Natural language description of scale if reference visible (e.g., "fits in palm", "hand-holdable size", "about 12 inches wide")'),
      brand: z.string().optional().describe('Brand name EXACTLY as shown on product (read character by character, do not guess)'),
      brandingDetails: z.string().optional().describe('Description of where/how branding appears (e.g., "metal plaque on front")'),
      // NEW FIELDS
      hasPaperwork: z.boolean().describe(
        'True if image contains packaging materials, instruction manuals, ' +
        'receipts, barcodes, warranty cards, or shipping labels'
      ),
      paperworkDetails: z.string().optional().describe(
        'Specific description of what paperwork is visible (e.g., ' +
        '"cardboard box with barcode", "instruction manual visible behind product")'
      )
    });
```

### Part 2: Update Default Analysis Prompt (AnalysisPhase.tsx)

Add a new "Paperwork Detection" section to the default analysis prompt (after the Brand Detection section):

```typescript
React.useEffect(() => {
  setAnalysisPrompt(
    `Analyze this product image carefully. Be specific and descriptive.

## Brand Detection (CRITICAL)
Look for brand identifiers on:
- Metal plaques or badges
- Embossed or debossed text
- Tags, labels, or hang tags
- Logos or emblems

**IMPORTANT**: Read brand text CHARACTER BY CHARACTER. Do not guess or infer brand names.
- If text is partially obscured or unclear, report only the letters you can clearly see
- Report EXACTLY what is written, preserving spacing and capitalization
- If you cannot read the text clearly, leave brand empty rather than guessing

## Paperwork Detection (CRITICAL)
Look for any non-product items in the image:
- Packaging materials (boxes, bubble wrap, plastic bags)
- Instruction manuals or quick start guides
- Barcodes, QR codes, or product tags
- Receipts, invoices, or price stickers
- Warranty cards or registration forms
- Shipping labels or packing slips

**IMPORTANT**: If ANY paperwork is visible, set hasPaperwork to true and describe what you see.

## Product Analysis
Extract product details accurately. If you cannot determine a field, use an empty string.`
  );

  // Update schema definition to include paperwork fields
  setAnalysisSchema({
    product: { type: 'string', description: 'The main product name/type' },
    color: { type: 'string', description: 'Primary color and finish' },
    material: { type: 'string', description: 'Primary material composition' },
    shape: { type: 'string', description: 'Overall shape and form' },
    features: {
      type: 'array',
      items: 'string',
      description: 'Key distinguishing features',
    },
    hasScaleReference: {
      type: 'boolean',
      description: 'True if human hand/body part or common object visible for scale comparison',
    },
    scaleDescription: {
      type: 'string',
      optional: true,
      description: 'Natural language description of scale if reference visible',
    },
    brand: {
      type: 'string',
      optional: true,
      description: 'Brand name EXACTLY as shown on product',
    },
    brandingDetails: {
      type: 'string',
      optional: true,
      description: 'Description of where/how branding appears',
    },
    // NEW FIELDS
    hasPaperwork: {
      type: 'boolean',
      description: 'True if image contains packaging materials, instruction manuals, receipts, barcodes, warranty cards, or shipping labels',
    },
    paperworkDetails: {
      type: 'string',
      optional: true,
      description: 'Specific description of what paperwork is visible',
    },
  });
}, []);
```

## Acceptance Criteria
- [ ] Zod schema in `product-analyzer.ts` includes `hasPaperwork` and `paperworkDetails`
- [ ] Schema descriptions clearly define what constitutes "paperwork"
- [ ] Default prompt in `AnalysisPhase.tsx` includes paperwork detection section
- [ ] Prompt instructions are clear and specific (packaging, manuals, barcodes, etc.)
- [ ] TypeScript compilation passes
- [ ] Analysis can run without errors (test with sample images)

## Dependencies
- Task 01 (schema extension) must be completed first
