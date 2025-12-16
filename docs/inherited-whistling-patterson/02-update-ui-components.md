# Update UI Components (Button, Badge, Card, PageContainer)

## Files to Modify
- `src/components/ui/button.tsx` (modify)
- `src/components/ui/badge.tsx` (modify)
- `src/components/ui/card.tsx` (modify - if custom variants exist)
- `src/components/layout/page-container.tsx` (modify)

## Implementation Details

### 2.1 Button Component (`src/components/ui/button.tsx`)

**Changes**:

1. **Remove `studio` variant entirely**:
   ```tsx
   // DELETE this line from buttonVariants.variant:
   studio: 'bg-foreground text-background hover:bg-foreground/90 shadow-xl hover:shadow-2xl hover:shadow-accent/20 button-studio',
   ```

2. **Update `accent` variant to use primary**:
   ```tsx
   // REPLACE:
   accent: 'bg-accent text-accent-foreground hover:bg-accent/90',

   // WITH:
   accent: 'bg-primary text-primary-foreground hover:bg-primary/80',
   ```

3. **Update other variants to match shadcn-template**:
   ```tsx
   destructive: 'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
   outline: 'border-border bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground',
   ghost: 'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
   ```

**Breaking Change**: `variant="studio"` will throw TypeScript error

---

### 2.2 Badge Component (`src/components/ui/badge.tsx`)

**Changes**:

1. **Remove `teal` variant**:
   ```tsx
   // DELETE this line from badgeVariants.variant:
   teal: 'border-transparent bg-teal text-teal-foreground [a&]:hover:bg-teal/90',
   ```

2. **Remove custom `success` and `info` variants** (if they exist)

3. **Keep only standard shadcn variants**:
   - `default`
   - `secondary`
   - `destructive`
   - `outline`

**Breaking Changes**:
- `variant="teal"` → Use `variant="outline"`
- `variant="success"` → Use `variant="default"` (green primary)
- `variant="info"` → Use `variant="secondary"`

---

### 2.3 Card Component (`src/components/ui/card.tsx`)

**Changes**:

1. **Check if custom variants exist** (`hero`, `control`, `studio`)
2. **If yes, remove them** - they use deleted tokens (`--card-hero`, `--card-control`)
3. **Ensure only single default variant** using `--card` token

---

### 2.4 PageContainer Component (`src/components/layout/page-container.tsx`)

**Changes**:

1. **Remove `spotlight` prop from TypeScript interface**:
   ```tsx
   // OLD:
   export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
     narrow?: boolean
     spotlight?: boolean  // DELETE THIS
   }

   // NEW:
   export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
     narrow?: boolean  // Keep this
   }
   ```

2. **Remove spotlight rendering logic**:
   ```tsx
   // DELETE this block (likely around lines 22-24):
   {spotlight && (
     <div className="absolute inset-0 studio-spotlight pointer-events-none" />
   )}
   ```

**Breaking Change**: `<PageContainer spotlight>` will throw TypeScript error

## Acceptance Criteria

**Button Component**:
- [ ] `studio` variant removed from type and implementation
- [ ] `accent` variant uses `--primary` token
- [ ] `destructive`, `outline`, `ghost` match shadcn-template styles
- [ ] TypeScript compiles without errors

**Badge Component**:
- [ ] `teal`, `success`, `info` variants removed
- [ ] Only standard variants remain (default, secondary, destructive, outline)
- [ ] TypeScript compiles without errors

**Card Component**:
- [ ] No custom variants (`hero`, `control`, `studio`)
- [ ] Single default variant using `--card` token

**PageContainer Component**:
- [ ] `spotlight` prop removed from interface
- [ ] Spotlight rendering logic removed
- [ ] TypeScript compiles without errors

**Overall**:
- [ ] `bun run build` succeeds
- [ ] Component tests may fail (expected - will fix in testing phase)

## Dependencies
- Depends on: `01-replace-globals-css.md` (requires new tokens)

## Validation Commands
```bash
# TypeScript check
bun run build

# Run component tests (expect failures)
bun test src/components/ui/__tests__/button.test.tsx
bun test src/components/ui/__tests__/badge.test.tsx
```

## Rollback Checkpoint
After this task, test build and key pages. If component errors occur, this is the rollback point.
