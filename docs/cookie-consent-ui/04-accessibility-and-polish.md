# Accessibility and Polish

## Files to Modify/Create
- `src/components/cookie-consent/cookie-consent-banner.tsx` (modify if needed)
- `src/components/settings/privacy-tab.tsx` (modify if needed)

## Implementation Details

### Accessibility Enhancements

**Banner Accessibility:**
1. **Focus management**: Consider adding focus trap so keyboard users can navigate within banner
2. **Keyboard navigation**: Tab between buttons, Enter to activate
3. **Screen reader**: Ensure announcement on mount (role="dialog" already present)
4. **Color contrast**: Verify text contrast >= 4.5:1 in both light and dark modes

**Optional focus trap implementation:**
```typescript
// If focus trap is needed, use a library or simple implementation
// For MVP, the existing role="dialog" and ARIA attributes may suffice
```

**Privacy Tab Accessibility:**
1. **Switch labels**: Ensure switches have proper accessible names
2. **Section headings**: Card titles serve as section headings
3. **Focus indicators**: Verify visible focus rings on interactive elements

### Dark Mode Styling

Verify in dark mode:
- Banner background (`bg-card`) is distinct from page background
- Text (`text-muted-foreground`) is readable
- Border (`border-border`) is visible
- Button variants look correct

If adjustments needed, use Tailwind dark: variants.

### Mobile Responsiveness

**Banner (320px+ screens):**
- Buttons stack vertically on mobile (`flex-col sm:flex-row` already implemented)
- Max width respects viewport (`max-width: calc(100vw - 2rem)`)
- Padding and text size appropriate for mobile

**Privacy Tab:**
- Cards stack properly (default behavior)
- Switch labels wrap correctly on narrow screens
- Card titles with switches don't overlap

### Browser Testing Checklist

**Desktop:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

**Mobile simulation (Chrome DevTools):**
- [ ] iPhone SE (375px)
- [ ] iPhone 12 Pro (390px)
- [ ] Pixel 5 (393px)
- [ ] Galaxy S8 (360px)

**Theme modes:**
- [ ] Dark mode (default)
- [ ] Light mode (if supported)

## Acceptance Criteria
- [ ] WCAG AA color contrast compliance (4.5:1 minimum)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announces banner correctly
- [ ] Dark mode styling looks correct
- [ ] Light mode styling looks correct (if supported)
- [ ] Mobile responsive on 320px+ screens
- [ ] No visual overflow or text truncation issues
- [ ] Buttons don't overlap on any viewport size

## Dependencies
- Tasks 01-03 must be complete before polish

## Testing Tools
- **Contrast checker**: Chrome DevTools, WebAIM Contrast Checker
- **Keyboard testing**: Unplug mouse, navigate with keyboard only
- **Screen reader**: VoiceOver (Mac), NVDA (Windows), or browser extensions
- **Mobile**: Chrome DevTools device simulation
