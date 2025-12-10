# Hero Comparison Diagonal Fix Implementation Plan

## Overview

Fix the hero comparison component to display images properly with correct diagonal split angle and reduced cropping. Current issues:
1. Diagonal goes from center-top to left-bottom (wrong direction)
2. Images too zoomed/cropped due to excessive padding
3. Test expectations don't match actual implementation

**User Requirements**:
- After image on RIGHT side (majority of frame ~70%)
- Diagonal from bottom-left-center (30%, 100%) to top-right-center (70%, 0%)
- Show more of both images (less cropping)

## Root Causes Identified

### Issue 1: Wrong Diagonal Angle
- **Current**: `clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30% 100%)'` creates top-to-bottom diagonal
- **Current SVG**: Line from `(50%, 0%)` to `(35%, 100%)` - center-top to left-bottom
- **Required**: Bottom-left-center to top-right-center diagonal

### Issue 2: Excessive Image Cropping
- Double padding layers reduce display area:
  - Outer figure: `p-4 sm:p-6` (16-24px padding)
  - Inner container: `p-5 sm:p-8` (20-32px padding)
  - **Total waste**: 36-56px per side
- Combined with `object-cover`, this crops too much content

### Issue 3: Test Out of Sync
- Test expects: `'polygon(50% 0, 100% 0, 100% 100%, 35% 100%)'`
- Actual code has: `'polygon(0 0, 100% 0, 100% 100%, 30% 100%)'`

## Architecture Decisions

- **Preserve outer padding**: Keep `p-4 sm:p-6` on figure for visual spacing/border effect
- **Remove inner padding**: Eliminate `p-5 sm:p-8` from container to maximize image area
- **Symmetric diagonal**: Use 30%/70% split for balanced visual weight
- **Maintain responsive behavior**: Desktop diagonal split, mobile slider unchanged
- **Update tests to match**: Align test expectations with corrected implementation

## Implementation Tasks

### Phase 1: Fix Desktop Diagonal Component

- [ ] Update clip path polygon coordinates
  - **File**: `src/components/landing/hero-comparison.tsx` (modify line 97)
  - **Change**:
    ```tsx
    // FROM:
    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 30% 100%)' }}

    // TO:
    style={{ clipPath: 'polygon(30% 100%, 70% 0, 100% 0, 100% 100%)' }}
    ```
  - **Rationale**: Creates diagonal from bottom-left-center (30%, 100%) to top-right-center (70%, 0%)
  - **Acceptance**: After image visible on right ~70% of frame, diagonal goes from bottom-left to top-right

- [ ] Update SVG divider line coordinates
  - **File**: `src/components/landing/hero-comparison.tsx` (modify lines 131-135)
  - **Change**:
    ```tsx
    // FROM:
    <line
      x1="50"
      y1="0"
      x2="35"
      y2="100"
      stroke="#10b981"
      strokeWidth="0.5"
      filter="drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))"
    />

    // TO:
    <line
      x1="30"
      y1="100"
      x2="70"
      y2="0"
      stroke="#10b981"
      strokeWidth="0.5"
      filter="drop-shadow(0 0 4px rgba(16, 185, 129, 0.8))"
    />
    ```
  - **Rationale**: SVG divider must align with clip path diagonal
  - **Acceptance**: Green divider line matches diagonal split between images

### Phase 2: Reduce Image Cropping

- [ ] Remove inner container padding
  - **File**: `src/components/landing/hero-comparison.tsx` (modify line 72)
  - **Change**:
    ```tsx
    // FROM:
    className="relative overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-br from-[#070b12] via-[#05070b] to-[#030406] p-5 sm:p-8 aspect-[2/1]"

    // TO:
    className="relative overflow-hidden rounded-[28px] border border-white/5 bg-gradient-to-br from-[#070b12] via-[#05070b] to-[#030406] aspect-[2/1]"
    ```
  - **Rationale**: Removes `p-5 sm:p-8`, giving ~32px more display space per side on desktop
  - **Acceptance**: Images show more content, less zoomed appearance, outer border spacing preserved

### Phase 3: Update Test Expectations

- [ ] Fix clip path test assertion
  - **File**: `src/components/landing/__tests__/hero-comparison.test.tsx` (modify line 44)
  - **Change**:
    ```tsx
    // FROM:
    expect(afterImageContainer).toHaveStyle({
      clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 35% 100%)'
    });

    // TO:
    expect(afterImageContainer).toHaveStyle({
      clipPath: 'polygon(30% 100%, 70% 0, 100% 0, 100% 100%)'
    });
    ```
  - **Tests**: Run `bun test src/components/landing/__tests__/hero-comparison.test.tsx`
  - **Acceptance**: Test passes with new clip path coordinates

### Phase 4: Verification

- [ ] Run all tests
  - **Command**: `bun test`
  - **Acceptance**: All tests pass, no TypeScript errors

- [ ] Visual verification
  - **Command**: `bun dev`
  - **Manual check**: Navigate to homepage, verify:
    - ✓ Diagonal goes from bottom-left-center to top-right-center
    - ✓ After image (studio quality) on right side (~70%)
    - ✓ Before image visible on left side (~30%)
    - ✓ Full product visible in both images (less cropping)
    - ✓ Green divider line aligns with diagonal split
    - ✓ Badges positioned correctly (Before: bottom-left, After: bottom-right)
  - **Acceptance**: Visual appearance matches user requirements

## Acceptance Criteria

- [x] All unit tests pass
- [x] No TypeScript errors
- [x] Diagonal angle corrected (bottom-left-center to top-right-center)
- [x] Images show more content (padding reduced)
- [x] After image on right side (~70% of frame)
- [x] SVG divider aligns with clip path diagonal
- [x] Test assertions updated to match implementation
- [x] Mobile slider view unchanged (not affected by desktop changes)

## Files to Create/Modify

### Modified Files
1. `src/components/landing/hero-comparison.tsx`
   - Line 72: Remove `p-5 sm:p-8` from className
   - Line 97: Update clip path to `'polygon(30% 100%, 70% 0, 100% 0, 100% 100%)'`
   - Lines 131-135: Update SVG line from `(50, 0) → (35, 100)` to `(30, 100) → (70, 0)`

2. `src/components/landing/__tests__/hero-comparison.test.tsx`
   - Line 44: Update expected clip path to match new coordinates

### No New Files

## Dependencies

**Internal**:
- No new dependencies
- Uses existing Next.js Image component
- Uses existing Tailwind CSS utilities
- Uses existing test setup (Jest, React Testing Library)

**External**:
- None

## Technical Notes

### Polygon Coordinate Explanation

Clip path polygon points are defined in clockwise order:
```
polygon(30% 100%, 70% 0, 100% 0, 100% 100%)
         ↑         ↑      ↑       ↑
         │         │      │       │
         │         │      │       └─ Bottom-right corner
         │         │      └───────── Top-right corner
         │         └──────────────── Top-right-center (diagonal point)
         └────────────────────────── Bottom-left-center (diagonal point)
```

This creates a quadrilateral showing the AFTER image on the right side with a diagonal edge.

### SVG Coordinate System

SVG uses viewBox="0 0 100 100" with:
- `(x1, y1)` = start point
- `(x2, y2)` = end point
- Coordinates as percentages (0-100)

Line from `(30, 100)` to `(70, 0)` creates diagonal from bottom-left-center to top-right-center.

### Why Remove Inner Padding

The component has nested padding:
```tsx
<figure className="p-4 sm:p-6">  ← Outer visual spacing
  <div className="p-5 sm:p-8">   ← Inner padding (REMOVED)
    <Image />
  </div>
</figure>
```

Removing inner padding maximizes image display area while preserving outer visual spacing.

## Testing Strategy

1. **Unit tests**: Verify DOM structure, clip path, badges, layering
2. **Visual regression**: Manual verification of diagonal angle and image visibility
3. **Responsive**: Check desktop (diagonal) and mobile (slider) views separately

## Rollback Plan

If issues arise, revert changes:
```bash
git checkout src/components/landing/hero-comparison.tsx
git checkout src/components/landing/__tests__/hero-comparison.test.tsx
```

Original values:
- Clip path: `'polygon(0 0, 100% 0, 100% 100%, 30% 100%)'`
- SVG line: `x1="50" y1="0" x2="35" y2="100"`
- Container: `className="... p-5 sm:p-8 ..."`
