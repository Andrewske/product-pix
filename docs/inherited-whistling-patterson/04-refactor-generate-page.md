# Refactor Generate Page - Fix Hardcoded Colors

## Files to Modify
- `src/app/generate/page.tsx` (modify)

## Implementation Details

### Objective
Fix critical hardcoded color issue and update badge variants on the main generation page.

### Changes

#### 1. CRITICAL FIX: Hardcoded Green Button (line ~259)

This is the **highest priority** fix - hardcoded colors bypass the theme system.

**REMOVE**:
```tsx
<Button
  variant="accent"
  className="w-full border-none shadow-2xl !text-black bg-green-600 opacity-90 hover:opacity-100 hover:scale-105 transition-all"
>
  Generate Product Photos
</Button>
```

**REPLACE WITH**:
```tsx
<Button
  variant="default"
  size="lg"
  className="w-full"
  disabled={generating || credits < 1}
>
  Generate Product Photos
</Button>
```

**Why**:
- `bg-green-600` hardcodes a specific green shade that bypasses theme tokens
- `!text-black` forces black text regardless of theme
- These prevent proper dark/light mode switching
- Custom shadows and transforms add visual inconsistency

---

#### 2. Badge Variant Update (line ~222)

**REMOVE**:
```tsx
<Badge variant="teal">AI studio for ecommerce sellers</Badge>
```

**REPLACE WITH**:
```tsx
<Badge variant="outline">AI studio for ecommerce sellers</Badge>
```

**Why**: `teal` variant was deleted (used removed `--teal` token)

---

#### 3. Search for Additional Issues

Run comprehensive search:
```bash
# Find all hardcoded color classes
grep -n "bg-green-" src/app/generate/page.tsx
grep -n "bg-\[" src/app/generate/page.tsx
grep -n "text-\[" src/app/generate/page.tsx
grep -n "!text-" src/app/generate/page.tsx
grep -n "!bg-" src/app/generate/page.tsx

# Find removed variant usage
grep -n 'variant="teal"' src/app/generate/page.tsx
grep -n 'variant="studio"' src/app/generate/page.tsx
grep -n 'variant="success"' src/app/generate/page.tsx
grep -n 'variant="info"' src/app/generate/page.tsx

# Find removed CSS classes
grep -n "studio-spotlight" src/app/generate/page.tsx
grep -n "matte-card" src/app/generate/page.tsx
grep -n "ambient-wash" src/app/generate/page.tsx
```

**Replace all findings**:
- Hardcoded colors → Semantic tokens or remove
- `variant="teal"` → `variant="outline"`
- `variant="studio"` → `variant="default"`
- Studio CSS classes → Remove or replace with semantic equivalents

## Acceptance Criteria

**Critical Fixes**:
- [ ] No `bg-green-600` or other hardcoded color classes
- [ ] No `!important` text color overrides
- [ ] Generate button uses `variant="default"` with proper disabled state
- [ ] All badges use valid variants (no `teal`, `studio`, `success`, `info`)

**Visual**:
- [ ] Generate button renders correctly in both dark/light modes
- [ ] Button respects theme colors (green primary)
- [ ] Badge styling consistent with design system
- [ ] No broken styling or console errors

**Functional**:
- [ ] Generate button click works
- [ ] Disabled state works when credits < 1
- [ ] Form submission unaffected
- [ ] Page functionality unchanged

**Manual Checks**:
- [ ] Visit `/generate` in browser
- [ ] Test button in dark mode
- [ ] Test button in light mode
- [ ] Verify button disabled state renders correctly
- [ ] Check badge rendering

## Dependencies
- Depends on: `01-replace-globals-css.md` (theme tokens available)
- Depends on: `02-update-ui-components.md` (button/badge variants updated)

## Validation Commands
```bash
# Build check
bun run build

# Visual test
bun run dev
# Navigate to http://localhost:3000/generate and test button
```

## Risk Assessment
**High Risk**: This page is the core user flow - any breakage affects primary functionality.

**Mitigation**:
- Test thoroughly before proceeding
- Verify disabled states work
- Check credit balance displays correctly
- Test generation flow end-to-end

## Rollback Checkpoint
After this task, test the entire generation flow. If the main CTA is broken, this is a critical rollback point.
