# Testing and Validation

## Objective
Comprehensive testing to ensure migration succeeded without breaking functionality or creating visual regressions.

## Testing Phases

### Phase 1: Build Validation

**Command**:
```bash
bun run build
```

**Expected Result**: Build succeeds with no errors

**Check for**:
- [ ] No TypeScript errors
- [ ] No CSS errors or warnings
- [ ] No missing module errors
- [ ] Build completes successfully

**If build fails**:
- Review error messages
- Check if removed tokens are still referenced
- Verify all imports are correct
- Rollback to last checkpoint if critical

---

### Phase 2: Visual Testing (Manual)

#### Pages to Test:

1. **Landing Page (`/`)**
   - [ ] Hero section renders (no broken styling)
   - [ ] Background gradient subtle (not dramatic lighting)
   - [ ] "in Seconds" text uses green color
   - [ ] Gallery cards use standard Card component
   - [ ] CTA buttons work and use correct colors
   - [ ] Footer renders correctly
   - [ ] Dark/light mode toggle works

2. **Generate Page (`/generate`)**
   - [ ] Generate button uses theme green (not hardcoded)
   - [ ] Button disabled state works
   - [ ] Badge uses outline variant
   - [ ] Form elements render correctly
   - [ ] Image upload works
   - [ ] Credits display correctly
   - [ ] Dark/light mode works

3. **Dashboard (`/dashboard`)**
   - [ ] Batch lists render
   - [ ] Cards use correct styling
   - [ ] No broken studio effects
   - [ ] Navigation works
   - [ ] Dark/light mode works

4. **Auth Pages (`/auth/login`, `/auth/signup`)**
   - [ ] Forms render correctly
   - [ ] Input fields work
   - [ ] Submit buttons use correct variant
   - [ ] No spotlight effects
   - [ ] Validation errors display
   - [ ] Dark/light mode works

5. **Success Page (`/success`)**
   - [ ] Success message displays
   - [ ] Buttons work
   - [ ] Styling consistent
   - [ ] Dark/light mode works

#### Visual Checklist:

**Colors**:
- [ ] Background is gray (not blue-charcoal)
- [ ] Cards are lighter gray than background
- [ ] Primary buttons are green
- [ ] No teal colors visible
- [ ] Borders are subtle (10% white opacity in dark mode)

**Effects**:
- [ ] No dramatic lighting/spotlight effects
- [ ] No matte card gradients with shine
- [ ] No animated button shines
- [ ] Clean, flat design aesthetic
- [ ] Subtle hover states work

**Typography**:
- [ ] Headings use Figtree font
- [ ] Body text uses Geist font
- [ ] Code/monospace uses Geist Mono
- [ ] Font sizes and weights correct

**Dark Mode**:
- [ ] Toggle switches between light/dark correctly
- [ ] Colors update properly in both modes
- [ ] Contrast remains readable
- [ ] No flickering or transition issues

---

### Phase 3: Component Testing

#### Run Component Tests:

```bash
# Button component tests
bun test src/components/ui/__tests__/button.test.tsx

# Badge component tests
bun test src/components/ui/__tests__/badge.test.tsx

# PageContainer tests (if exist)
bun test src/components/layout/__tests__/page-container.test.tsx
```

#### Expected Failures:

Tests for removed variants will fail. **This is expected.**

**Update test expectations**:

1. **Button tests** - Remove `studio` variant tests:
   ```typescript
   // DELETE tests like:
   it('renders studio variant', () => {
     render(<Button variant="studio">Studio</Button>)
     // ...
   })
   ```

2. **Badge tests** - Remove `teal`, `success`, `info` variant tests:
   ```typescript
   // DELETE tests like:
   it('renders teal variant', () => {
     render(<Badge variant="teal">Teal</Badge>)
     // ...
   })
   ```

3. **PageContainer tests** - Remove `spotlight` prop tests:
   ```typescript
   // DELETE tests like:
   it('renders with spotlight', () => {
     render(<PageContainer spotlight>Content</PageContainer>)
     // ...
   })
   ```

#### After Fixes:

```bash
# Re-run tests
bun test src/components/ui/__tests__/button.test.tsx
bun test src/components/ui/__tests__/badge.test.tsx

# All tests should pass
```

**Acceptance**:
- [ ] All component tests pass
- [ ] No tests for removed variants
- [ ] Coverage remains similar (70-80%)

---

### Phase 4: Cross-Browser Testing

#### Browsers to Test:

1. **Chrome** (primary)
   - [ ] All pages render correctly
   - [ ] oklch colors display properly
   - [ ] Interactions work

2. **Firefox** (secondary)
   - [ ] Colors consistent with Chrome
   - [ ] No rendering issues
   - [ ] Focus states work

3. **Safari** (if available)
   - [ ] Mobile compatibility
   - [ ] Color rendering
   - [ ] Touch interactions

#### Focus Areas:

- **oklch color support**: Ensure colors render correctly (not fallback to gray)
- **Border radius**: Verify rounded corners using new radius utilities
- **Focus states**: Check keyboard navigation highlights properly
- **Transitions**: Smooth hover/focus transitions work

---

### Phase 5: Functionality Testing

#### Critical User Flows:

1. **Sign Up Flow**:
   - [ ] Navigate to signup
   - [ ] Fill form
   - [ ] Submit
   - [ ] Redirect works

2. **Login Flow**:
   - [ ] Navigate to login
   - [ ] Enter credentials
   - [ ] Submit
   - [ ] Redirect to dashboard

3. **Generation Flow**:
   - [ ] Upload image
   - [ ] Enter prompt
   - [ ] Click generate
   - [ ] Image generates
   - [ ] Credits deducted

4. **Batch Upload**:
   - [ ] CSV upload works
   - [ ] Batch processing initiates
   - [ ] Results display

5. **Settings/Billing**:
   - [ ] Settings page loads
   - [ ] Billing displays
   - [ ] Purchase flow works (if applicable)

---

### Phase 6: Grep Verification

**Run final searches** to ensure no removed classes remain:

```bash
# Should return 0 results:
grep -r "studio-spotlight" src/ || echo "✓ Clean"
grep -r "matte-card" src/ || echo "✓ Clean"
grep -r "gradient-text-studio" src/ || echo "✓ Clean"
grep -r "ambient-wash" src/ || echo "✓ Clean"
grep -r 'variant="studio"' src/ || echo "✓ Clean"
grep -r 'variant="teal"' src/ || echo "✓ Clean"
grep -r "bg-green-6" src/ || echo "✓ Clean"
```

**If any results found**:
- Review and update those files
- Re-run validation

---

## Final Acceptance Criteria

### Must Have:
- [ ] `bun run build` succeeds
- [ ] All pages render without errors
- [ ] Light and dark modes both work
- [ ] No hardcoded colors outside design tokens
- [ ] All interactive elements (buttons, forms, links) functional
- [ ] No references to removed CSS classes (grep verification passes)

### Should Have:
- [ ] Component tests pass with updated expectations
- [ ] Visual consistency across all pages
- [ ] Smooth transitions and hover states
- [ ] Proper focus indicators (accessibility)
- [ ] Cross-browser consistency

### Nice to Have:
- [ ] Performance metrics unchanged or improved
- [ ] No console warnings
- [ ] Screenshots updated in documentation

---

## Rollback Decision Tree

**If build fails**:
→ Review errors → Fix critical issues → If unfixable, rollback to checkpoint 2 (after components)

**If 1-2 pages have visual issues**:
→ Fix those specific pages → Re-test → Continue

**If 3+ pages have major issues**:
→ Rollback to checkpoint 3 (after landing page) → Review approach

**If core functionality broken** (auth, generation, payments):
→ **IMMEDIATE ROLLBACK** to previous working state → Review before retry

---

## Success Criteria Summary

**Visual**:
- Gray background (not blue-charcoal)
- Green primary color throughout
- Clean, minimal design
- No studio effects visible

**Technical**:
- Build succeeds
- Tests pass (after updates)
- No console errors
- No missing CSS classes

**Functional**:
- All user flows work
- Auth system functional
- Generation works
- Payments work (if applicable)

---

## Post-Testing Actions

**If all tests pass**:
1. Commit changes: `git commit -m "feat: migrate to shadcn-template design system"`
2. Create PR (if needed)
3. Deploy to staging
4. Final verification in staging environment

**If tests fail**:
1. Document failures
2. Fix issues or rollback as needed
3. Re-run validation
4. Iterate until passing

## Dependencies
- Depends on: All previous tasks (01-06)
- Final validation step before deployment

## Estimated Time
45-60 minutes for comprehensive testing
