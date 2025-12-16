# Refactor Remaining Pages - Search and Replace Studio Effects

## Files to Modify
- `src/app/success/success-display.tsx` (modify)
- `src/components/auth/auth-layout.tsx` (modify)
- `src/components/batch/csv-upload-form.tsx` (modify)
- `src/components/pricing/pricing-card.tsx` (modify)
- Any other files found via grep search

## Implementation Details

### Objective
Systematically find and replace all remaining studio effects across the codebase.

### Search Strategy

Run comprehensive searches to find all usage:

```bash
# Studio CSS classes
grep -r "studio-spotlight" src/
grep -r "matte-card" src/
grep -r "gradient-text-studio" src/
grep -r "ambient-wash" src/
grep -r "button-studio" src/
grep -r "soft-glow-text" src/

# Removed variants
grep -r 'variant="studio"' src/
grep -r 'variant="teal"' src/
grep -r 'variant="success"' src/
grep -r 'variant="info"' src/

# Hardcoded colors
grep -r "bg-green-" src/
grep -r "bg-teal-" src/
grep -r "text-accent" src/ | grep className
grep -r "text-teal" src/ | grep className
```

### Replacement Patterns

Apply these replacements systematically:

| Find | Replace With | Notes |
|------|-------------|-------|
| `.studio-spotlight` | Remove or `bg-gradient-to-b from-muted/50 to-background` | Subtle gradient background |
| `.matte-card` | `<Card>` component | Use shadcn Card component |
| `.matte-card-hover` | `hover:border-primary/50 transition-colors` | Add to Card className |
| `.gradient-text-studio` | `text-primary` | Solid primary color |
| `.ambient-wash*` | Remove entirely | No replacement needed |
| `.button-studio` | Remove | Button animations removed |
| `variant="studio"` | `variant="default"` | Use default button variant |
| `variant="teal"` | `variant="outline"` | Use outline variant |
| `variant="success"` | `variant="default"` | Green primary is success |
| `variant="info"` | `variant="secondary"` | Use secondary variant |
| Hardcoded `bg-green-*` | `bg-primary` or remove | Use semantic token |
| Hardcoded `text-teal` | `text-muted-foreground` | Use semantic token |
| `.text-accent` (utility) | `text-primary` | Use semantic token |

### Known Files to Update

#### 1. `src/app/success/success-display.tsx`
- Remove studio effects from success page
- Update button variants if needed
- Replace custom gradients with semantic tokens

#### 2. `src/components/auth/auth-layout.tsx`
- Remove spotlight effects from auth pages
- Update card styling if using matte-card
- Ensure clean minimal auth flow

#### 3. `src/components/batch/csv-upload-form.tsx`
- Update button variants
- Remove studio effects from upload UI
- Ensure drag-drop area uses semantic colors

#### 4. `src/components/pricing/pricing-card.tsx`
- Update featured card styling (likely uses hardcoded colors)
- Replace custom shadows with semantic approach
- Update badge variants if present

### File-by-File Process

For each file found:

1. **Read the file** to understand current usage
2. **Apply replacements** following the table above
3. **Test the file** - ensure no broken styling
4. **Commit incrementally** (optional but recommended)

### Example Replacement

**Before**:
```tsx
<div className="matte-card matte-card-hover p-6">
  <h2 className="gradient-text-studio text-2xl mb-4">
    Success!
  </h2>
  <Button variant="studio" className="button-studio">
    Continue
  </Button>
</div>
```

**After**:
```tsx
<Card className="p-6 hover:border-primary/50 transition-colors">
  <h2 className="text-primary text-2xl mb-4">
    Success!
  </h2>
  <Button variant="default">
    Continue
  </Button>
</Card>
```

## Acceptance Criteria

**Search Results**:
- [ ] All grep searches return 0 results (all studio effects removed)
- [ ] No hardcoded color classes remain
- [ ] No removed variants in use

**Visual**:
- [ ] All pages render without console errors
- [ ] No broken styling from missing CSS classes
- [ ] Consistent design across all pages
- [ ] Dark/light mode works on all pages

**Functional**:
- [ ] All interactive elements work
- [ ] Auth flow functional
- [ ] Batch upload functional
- [ ] Pricing display functional
- [ ] Success page functional

**Manual Checks**:
- [ ] Visit `/success` page
- [ ] Visit `/auth/login` and `/auth/signup`
- [ ] Test batch upload flow
- [ ] Review pricing cards
- [ ] Check all remaining pages in sitemap

## Dependencies
- Depends on: `01-replace-globals-css.md` (CSS classes removed)
- Depends on: `02-update-ui-components.md` (components updated)

## Validation Commands
```bash
# Verify no studio effects remain
grep -r "studio-spotlight" src/ || echo "✓ No studio-spotlight found"
grep -r "matte-card" src/ || echo "✓ No matte-card found"
grep -r "gradient-text-studio" src/ || echo "✓ No gradient-text-studio found"
grep -r 'variant="teal"' src/ || echo "✓ No teal variant found"

# Build check
bun run build

# Full app test
bun run dev
# Navigate through all pages
```

## Risk Assessment
**Medium Risk**: Multiple files affected, but changes are mechanical.

**Mitigation**:
- Use search-replace carefully
- Test each page after changes
- Keep track of files modified
- Can rollback file-by-file if needed

## Rollback Checkpoint
After this task, test all affected pages. If widespread issues, rollback to before this task.
