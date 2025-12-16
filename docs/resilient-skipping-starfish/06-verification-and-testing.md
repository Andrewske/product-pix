# Verification and Testing

## Automated Checks
```bash
bun tsc --noEmit
bun lint
bun test
```

## Visual Verification Checklist

### Light Mode
- [ ] Landing page hero renders correctly with Figtree font
- [ ] Buttons have pill shape (rounded-4xl)
- [ ] Cards have softer corners (rounded-2xl) with subtle ring
- [ ] Inputs have subtle background
- [ ] Dialogs have darker overlay and rounded corners
- [ ] All accent colors (green, teal) work correctly

### Dark Mode
- [ ] Borders use alpha transparency (subtle white)
- [ ] Text is readable against all backgrounds
- [ ] Components maintain visual hierarchy

### Key Pages to Check
1. **Landing Page** (`/`) - Hero, pricing cards, CTA buttons
2. **Dashboard** (`/dashboard`) - Card grid, badges, navigation
3. **Generate Page** (`/generate`) - Form inputs, selects, action buttons
4. **Auth Pages** (`/login`, `/signup`) - Form styling, dialog appearance

### Component-Specific Checks
- [ ] Button: All variants render (default, outline, ghost, accent, destructive)
- [ ] Button: New sizes work (xs, icon-xs)
- [ ] Input: Has bg-input/30 background
- [ ] Card: Size prop works (default, sm)
- [ ] Select: Trigger matches input styling
- [ ] Badge: Has pill shape
- [ ] Dialog: Overlay is 80% opacity
- [ ] Field: Error messages are deduplicated

### Regression Checks
- [ ] No TypeScript errors (`bun tsc --noEmit`)
- [ ] No ESLint errors (`bun lint`)
- [ ] Existing tests pass (`bun test`)
- [ ] No console errors in browser

## ProductPix Adjustments (if needed)
After verification, check if any ProductPix-specific adjustments are needed:
- [ ] `accent` button variant works for green CTAs
- [ ] `--teal` color works where used
- [ ] Any studio animations still needed?

## Acceptance Criteria
- [ ] All automated checks pass
- [ ] All visual verification items pass
- [ ] Both light and dark mode work correctly
- [ ] No console errors in browser

## Dependencies
- All previous tasks (01-05) must be completed
