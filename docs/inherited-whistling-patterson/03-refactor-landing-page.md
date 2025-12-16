# Refactor Landing Page - Remove Studio Effects

## Files to Modify
- `src/app/page.tsx` (modify)

## Implementation Details

### Objective
Remove all custom studio visual effects from the landing page and replace with shadcn semantic tokens.

### Changes

#### 1. Hero Section Background Effects (lines ~47-51)

**REMOVE these 4 divs**:
```tsx
<div className="absolute inset-0 studio-spotlight pointer-events-none" />
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
<div className="absolute top-20 left-10 w-96 h-96 ambient-wash ambient-wash-green opacity-20" />
<div className="absolute bottom-20 right-10 w-80 h-80 ambient-wash ambient-wash-green opacity-15" />
```

**REPLACE WITH**:
```tsx
{/* Subtle background gradient - shadcn approach */}
<div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background pointer-events-none" />
```

---

#### 2. Gradient Text (line ~64)

**REMOVE**:
```tsx
<span className="gradient-text-studio">in Seconds</span>
```

**REPLACE WITH**:
```tsx
<span className="text-primary">in Seconds</span>
```

---

#### 3. Matte Cards (line ~125 in gallery section)

**REMOVE**:
```tsx
<div className="matte-card rounded-2xl overflow-hidden mb-6 aspect-[4/5] flex items-center justify-center relative matte-card-hover">
```

**REPLACE WITH**:
```tsx
<Card className="rounded-2xl overflow-hidden mb-6 aspect-[4/5] flex items-center justify-center relative hover:border-primary/50 transition-colors">
```

**Note**: Ensure `Card` is imported from `@/components/ui/card`

---

#### 4. Button Variants (lines ~37, ~77)

**REMOVE hardcoded background classes**:

Line ~37:
```tsx
// OLD:
<Button
  variant="default"
  className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl"
>
  Get Started
</Button>

// NEW:
<Button variant="default">
  Get Started
</Button>
```

Line ~77:
```tsx
// OLD:
<Button
  size="lg"
  variant="accent"
  className="h-14 px-8 text-lg shadow-xl hover:shadow-2xl transition-all"
  showArrow
>
  Start Creating Free
</Button>

// NEW:
<Button
  size="xl"
  variant="default"
  showArrow
>
  Start Creating Free
</Button>
```

---

#### 5. Search for Additional Studio Classes

Run search to find any remaining instances:
```bash
grep -n "studio-" src/app/page.tsx
grep -n "matte-card" src/app/page.tsx
grep -n "ambient-wash" src/app/page.tsx
grep -n "gradient-text-studio" src/app/page.tsx
```

Remove all found instances.

## Acceptance Criteria

**Visual Changes**:
- [ ] No more dramatic lighting effects (studio-spotlight, ambient-wash)
- [ ] Subtle muted gradient background instead
- [ ] Text uses `text-primary` instead of gradient effects
- [ ] Cards use standard `<Card>` component with hover effects
- [ ] Buttons use semantic variants without custom shadows

**Technical**:
- [ ] No references to removed CSS classes
- [ ] Page renders without console errors
- [ ] Dark mode still works
- [ ] All interactive elements functional
- [ ] No TypeScript errors

**Manual Checks**:
- [ ] Visit `/` in browser
- [ ] Hero section looks clean (no broken styling)
- [ ] Gallery cards render correctly
- [ ] CTA buttons work
- [ ] Footer looks correct

## Dependencies
- Depends on: `01-replace-globals-css.md` (CSS classes removed)
- Depends on: `02-update-ui-components.md` (Card component updated)

## Validation Commands
```bash
# Build check
bun run build

# Visual test
bun run dev
# Navigate to http://localhost:3000 and inspect landing page
```

## Expected Visual Changes
- **Before**: Dramatic studio lighting, radial gradients, matte cards with shine
- **After**: Clean minimal design with subtle gradients, flat cards, solid colors
- **Color shift**: Blue-charcoal background → Gray background

## Rollback Checkpoint
After this task, thoroughly test landing page in browser. If visual regression is unacceptable, this is the rollback point.
