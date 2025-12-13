# Fix Upload Form Image Preview Display

## Files to Modify
- `src/components/forms/upload-form.tsx` (line 159)

## Problem Context
When users upload a product image on `/generate`, the preview doesn't display - instead showing a "black box". The upload succeeds (generation works), but the preview image is invisible.

## Root Cause
The preview container at line 159 uses Next.js `Image` component with `fill` prop but lacks explicit dimensions:

```tsx
<div className="relative max-h-64 mx-auto rounded-lg overflow-hidden">
  <Image src={preview} alt="Preview" fill className="object-contain" />
</div>
```

**Issue:** `fill` requires a positioned parent with explicit width/height. The container only has `max-h-64` (maximum, not actual) and no width, causing it to collapse to undefined dimensions.

## Implementation Details

**Change line 159 from:**
```tsx
<div className="relative max-h-64 mx-auto rounded-lg overflow-hidden">
```

**To:**
```tsx
<div className="relative w-full max-w-md h-64 mx-auto rounded-lg overflow-hidden">
```

**CSS Classes Added:**
- `w-full` - Full width within container
- `max-w-md` - Maximum width constraint (keeps it reasonable at 28rem)
- `h-64` - Explicit height (16rem, matching existing `max-h-64`)

**Classes Preserved:**
- `mx-auto` - Horizontal centering
- `relative` - Required for `fill` positioning
- `rounded-lg overflow-hidden` - Visual styling

The existing `object-contain` class on the Image component ensures the uploaded image maintains aspect ratio and fits within the container.

## Pattern Reference
This matches the pattern used elsewhere in the codebase:
- `src/components/generation-result.tsx:24` - `<div className="relative w-full h-64">`
- `src/components/image-card.tsx:30` - `<div className="relative w-full aspect-square">`

## Acceptance Criteria

### Manual Testing
1. Navigate to `/generate`
2. Upload a product image (JPEG, PNG, or WebP)
3. ✓ Preview displays correctly in the upload area (not a black box)
4. ✓ Test with various aspect ratios (portrait, landscape, square)
5. ✓ Upload succeeds and generation works
6. ✓ Drag-and-drop upload shows preview
7. ✓ Click-to-upload shows preview

### Edge Cases Verified
- **Various aspect ratios**: `object-contain` maintains proportions
- **Large images**: Container constrains size while preserving quality
- **Small images**: Won't be stretched beyond original size
- **Loading state**: Already handled by existing `uploading` state

## Dependencies
None - this is a standalone CSS fix.
