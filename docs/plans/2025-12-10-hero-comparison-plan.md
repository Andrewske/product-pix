# Hero Comparison Redesign Implementation Plan

## Overview

Redesign the `HeroComparison` component to match the goal image aesthetic:
- **Desktop**: Diagonal split (top-left to bottom-right) with particle network effect along dividing line
- **Mobile**: Interactive horizontal slider with touch/keyboard support
- **Theme**: Emerald/green (`#10b981`) matching current accent color
- **Particles**: Static SVG network (no animation initially)

## Architecture Decisions

- **Responsive Strategy**: CSS media queries (`hidden md:block`) instead of JS detection to avoid hydration issues
- **Particle Network**: Static SVG with hardcoded positions (upgradeable to animated later)
- **Diagonal Implementation**: CSS `clip-path: polygon()` for GPU-accelerated rendering
- **Mobile Slider**: Reuse proven BeforeAfterSlider pattern with mouse/touch/keyboard handlers
- **Component Structure**: Extract Badge component for DRY principle (reused 4x)

## Implementation Tasks

### Phase 1: Component Structure Refactor

- [ ] **Refactor HeroComparison to use CSS-based responsive rendering**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - Remove current single-view implementation
    - Add desktop view container with `className="hidden md:block"`
    - Add mobile view container with `className="md:hidden"`
    - Keep existing `<figure role="img">` wrapper for accessibility
  - Acceptance: Component renders different views at different breakpoints without hydration warnings

- [ ] **Extract Badge component for reuse**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    ```tsx
    function Badge({
      icon: Icon,
      label
    }: {
      icon: React.ComponentType<{ className?: string }>;
      label: string;
    }) {
      return (
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white bg-black/70 backdrop-blur">
          <Icon className="h-4 w-4 text-emerald-300" />
          {label}
        </span>
      );
    }
    ```
  - Acceptance: Badge component renders with icon and label, used in both desktop and mobile views

### Phase 2: Desktop Diagonal View

- [ ] **Update diagonal clip-path angle**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - Change from `polygon(50% 0, 100% 0, 100% 100%, 35% 100%)`
    - To `polygon(0 0, 100% 0, 100% 100%, 30% 100%)`
    - Creates diagonal from top-left (0,0) to bottom-right with 30% offset
  - Acceptance: After image clips diagonally from top-left corner

- [ ] **Update z-index layering and overlays**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - Before image: `z-0` with `bg-black/20` overlay (darkening)
    - After image: `z-10` with `bg-white/5` overlay (brightening)
    - Particle network: `z-20`
    - Badges: `z-30`
  - Acceptance: Layers stack correctly, overlays provide subtle contrast

### Phase 3: Particle Network Implementation

- [ ] **Create ParticleNetwork component with static SVG**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - Define 15 particle positions along diagonal from (0,0) to (100,100)
    - Particle data: `{ x: number, y: number, r: number }[]`
    - Calculate connections between particles within 15 unit threshold
    - Render SVG with:
      - `<defs>` with glow filter (`feGaussianBlur`)
      - Connection lines group (`opacity="0.4"`)
      - Particles group with circles
      - Main diagonal divider line
    - Colors: `stroke="#10b981"`, `fill="#10b981"`
    - Add `data-testid="particle-network"`
  - Tests: `src/components/landing/__tests__/hero-comparison.test.tsx`
  - Acceptance:
    - SVG renders with ~15 particles along diagonal
    - Particles connected with lines when close together
    - Emerald glow effect applied
    - Main diagonal line visible

- [ ] **Add particle network to desktop view**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - Insert `<ParticleNetwork className="z-20" />` in desktop container
    - Position absolutely over diagonal split
    - Ensure `pointer-events-none` to avoid blocking interactions
  - Acceptance: Particle network overlays diagonal split on desktop only

### Phase 4: Mobile Interactive Slider

- [ ] **Implement InteractiveSlider component**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - State: `sliderPosition` (default 50), `isDragging` (default false)
    - Ref: `containerRef` for position calculations
    - Handler: `updatePosition(clientX: number)` - calculates percentage
    - Mouse handlers: `onMouseDown`, `onMouseUp`, `onMouseLeave`, `onMouseMove`
    - Touch handlers: `onTouchStart`, `onTouchEnd`, `onTouchMove`
    - Keyboard handler: `onKeyDown` - ArrowLeft/Right adjust ±5%
    - Accessibility: `role="slider"`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-valuenow`, `tabIndex={0}`
    - Before image clipped: `clipPath: inset(0 ${100 - sliderPosition}% 0 0)`
    - Slider handle at `left: ${sliderPosition}%` with grip icon
  - Tests: `src/components/landing/__tests__/hero-comparison.test.tsx`
  - Acceptance:
    - Slider responds to mouse drag
    - Slider responds to touch drag
    - Keyboard arrows adjust position
    - ARIA attributes present and correct
    - Before image reveals as slider moves

- [ ] **Add slider handle UI with visual feedback**
  - Files: `src/components/landing/hero-comparison.tsx` (modify)
  - Implementation:
    - Vertical line: `w-1 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]`
    - Circular grip: `w-10 h-10 rounded-full bg-emerald-400 border-4 border-white`
    - SVG arrows icon inside grip
    - Cursor: `cursor-ew-resize` on container
  - Acceptance: Handle visible, styled with emerald theme, cursor indicates draggable

### Phase 5: Testing

- [ ] **Update existing tests for dual rendering**
  - Files: `src/components/landing/__tests__/hero-comparison.test.tsx` (modify)
  - Implementation:
    - Test: Renders before/after comparison
    - Test: Particle network renders on desktop (using `mockViewport`)
    - Test: Interactive slider renders on mobile (using `mockViewport`)
    - Test: Diagonal clip-path updated to `polygon(0 0, 100% 0, 100% 100%, 30% 100%)`
    - Test: Slider has correct ARIA attributes
  - Acceptance: All tests pass, coverage ≥75%

- [ ] **Add accessibility tests**
  - Files: `src/components/landing/__tests__/hero-comparison.test.tsx` (modify)
  - Implementation:
    - Test keyboard navigation on slider (ArrowLeft/Right)
    - Test color contrast on badges (using `testColorContrast`)
    - Test ARIA labels and roles
  - Acceptance: Accessibility tests pass

### Phase 6: Polish & Integration

- [ ] **Verify responsive behavior**
  - Files: `src/components/landing/hero-comparison.tsx` (verify)
  - Manual Testing:
    - Desktop (≥768px): Diagonal split with particles visible
    - Mobile (<768px): Interactive slider visible
    - Tablet (768px): Smooth transition between modes
  - Acceptance: No layout shifts, smooth transitions

- [ ] **Update main page integration**
  - Files: `src/app/page.tsx` (verify - no changes expected)
  - Implementation:
    - Confirm `<HeroComparison />` renders correctly in hero section
    - Verify no conflicts with surrounding sections
  - Acceptance: Component integrates seamlessly with existing page

## Acceptance Criteria

- [ ] All TypeScript compilation passes with no errors
- [ ] All tests pass (`bun test`)
- [ ] Test coverage ≥75%
- [ ] Desktop shows diagonal split with particle network
- [ ] Mobile shows interactive slider
- [ ] Slider responds to mouse, touch, and keyboard
- [ ] ARIA attributes correct on all interactive elements
- [ ] No hydration warnings in browser console
- [ ] No layout shift between mobile/desktop
- [ ] Visual matches goal image aesthetic

## Files to Create/Modify

### Modified Files
1. `src/components/landing/hero-comparison.tsx`
   - Add Badge component
   - Add ParticleNetwork component
   - Add InteractiveSlider component
   - Refactor HeroComparison to dual rendering
   - Update clip-path angle
   - Update z-index layering

2. `src/components/landing/__tests__/hero-comparison.test.tsx`
   - Update tests for dual rendering
   - Add particle network tests
   - Add slider interaction tests
   - Add accessibility tests

### No Changes Required
- `src/hooks/use-mobile.ts` (reference only)
- `src/components/before-after-slider.tsx` (reference pattern)
- `src/app/page.tsx` (verify integration)
- `src/app/globals.css` (no new styles needed)

## Dependencies

### External Dependencies
- None (all functionality uses existing dependencies)

### Internal Dependencies
- `next/image` - Image optimization
- `lucide-react` - Icons (Camera, Sparkles)
- React hooks: `useState`, `useRef`
- Tailwind CSS v4 - Styling

### Pattern References
- BeforeAfterSlider component pattern for slider implementation
- Existing test utilities (`mockViewport`, `testColorContrast`)

## Implementation Notes

### Particle Network Positions
Hardcoded positions distribute particles along y=x diagonal with slight variation:
```tsx
const particles = [
  { x: 5, y: 3, r: 2 },
  { x: 12, y: 10, r: 3 },
  { x: 18, y: 15, r: 2.5 },
  { x: 25, y: 22, r: 3 },
  { x: 32, y: 28, r: 2 },
  { x: 38, y: 35, r: 2.5 },
  { x: 45, y: 42, r: 3 },
  { x: 52, y: 48, r: 2 },
  { x: 58, y: 55, r: 2.5 },
  { x: 65, y: 62, r: 3 },
  { x: 72, y: 68, r: 2 },
  { x: 78, y: 75, r: 2.5 },
  { x: 85, y: 82, r: 3 },
  { x: 92, y: 88, r: 2 },
  { x: 97, y: 95, r: 2.5 },
];
```

### Connection Algorithm
```tsx
for (let i = 0; i < particles.length; i++) {
  for (let j = i + 1; j < particles.length; j++) {
    const dx = particles[j].x - particles[i].x;
    const dy = particles[j].y - particles[i].y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 15) connections.push([i, j]);
  }
}
```

### Future Enhancements (Out of Scope)
- Animate particles with subtle float/drift
- Add particle glow pulsing
- Interactive particles (mouse/scroll response)
- Desktop slider mode toggle
- Multiple image pair carousel
