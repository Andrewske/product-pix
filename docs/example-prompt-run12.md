# Example Generation Prompt - Run 12 (With Latest Fixes)

This shows the complete prompt that would be generated with the current orchestrator code, using the same inputs as Run 11.

## Session Context

**Product:** Short-sleeved floral mini dress
**Category:** apparel
**Template:** clothing-model-white
**Output Count:** 3 images
**Reference Images:** 7 (2 label close-ups filtered out from original 9)

## Analysis Inputs

```json
{
  "brand": "Danelle Karen",
  "color": "Black background with multi-color floral print in shades of pink, red, blue, and green",
  "shape": "Fit and flare mini dress with puff sleeves",
  "product": "Short-sleeved floral mini dress",
  "category": "apparel",
  "material": "Lightweight woven fabric",
  "hasScaleReference": true,
  "scaleDescription": "The garment is displayed hanging on a standard black plastic clothes hanger.",
  "features": [
    "Allover small-scale floral print",
    "Short puff sleeves with elastic cuffs",
    "Scoop neckline",
    "Ruffled or tiered hemline",
    "Fitted waist"
  ]
}
```

## Complete Generated Prompt (Image 1/3)

```
Generate image 1/3 (Run 12): three-quarter view.
SCALE REQUIREMENT: Source shows scale reference (The garment is displayed hanging on a standard black plastic clothes hanger.). Maintain exact same physical product dimensions in all generated images.
CRITICAL: The garment structure, cut, neckline, sleeves, and all design details must match the reference images exactly. Reproduce the exact silhouette and fit shown.
IMPORTANT DETAILS: Color: Black background with multi-color floral print in shades of pink, red, blue, and green; Material: Lightweight woven fabric; Shape/Cut: Fit and flare mini dress with puff sleeves; Key features: Allover small-scale floral print, Short puff sleeves with elastic cuffs, Scoop neckline, Ruffled or tiered hemline, Fitted waist.
This must be distinctly different from any previous images.
Professional fashion photography of Short-sleeved floral mini dress on a female model from three-quarter view, on pure white seamless background, soft diffused studio lighting with even fill, no harsh shadows, shot on DSLR with 85mm lens f/2.8 for natural depth, commercial fashion catalog photography, natural model pose, color-accurate garment reproduction, 4K resolution, sharp focus on garment details, model centered in frame, single subject only, no collages or grids
```

## Key Differences from Run 4 (Perfect) vs Run 11 (Broken)

### Run 4 (Had interior label but correct dress structure):
```
CRITICAL: The product MUST display "Danelle Karen" branding exactly as shown...
(No features instruction)
```

### Run 11 (No interior label but wrong dress):
```
(No CRITICAL instruction - removed to prevent labels)
IMPORTANT DETAILS: (with newlines that may have broken parsing)
```

### Run 12 (Current - should have both fixes):
```
CRITICAL: The garment structure, cut, neckline, sleeves, and all design details must match...
IMPORTANT DETAILS: (single line with semicolons)
```

## What Changed

1. **Label filtering:** Images with "label" in detected angle are removed (7 sent instead of 9)
2. **Branding instruction replaced:** Instead of "display Danelle Karen branding," now says "match reference images exactly" for apparel
3. **Features added:** Color, material, shape, and top 5 features now included
4. **Format simplified:** Semicolons instead of newlines in IMPORTANT DETAILS

## Expected Result

- ✅ No interior labels visible (no branding instruction mentioning them)
- ✅ Correct scoop neckline (specified in features + CRITICAL instruction)
- ✅ Correct puff sleeves (specified in shape + features)
- ✅ Correct fit and flare silhouette (specified in shape)
- ✅ Accurate floral pattern colors (specified in color)
- ✅ Professional model on white background (from template)
