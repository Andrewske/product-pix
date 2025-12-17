# Add Tests for New Components

## Files to Modify/Create
- `src/components/__tests__/site-header.test.tsx` (new)
- `src/components/__tests__/feature-card.test.tsx` (new)
- `src/components/__tests__/process-step.test.tsx` (new)
- `src/components/__tests__/site-footer.test.tsx` (new)
- `src/components/__tests__/hero-section.test.tsx` (new)
- `src/components/__tests__/section-header.test.tsx` (new)

## Implementation Details

Create comprehensive tests for all new components following project testing conventions.

### Testing Framework Requirements
- **Framework**: Bun test (NOT Jest)
- **DOM**: happy-dom
- **Matchers**: Native Bun only (no custom matchers)
- **Structure**: `describe`, `it`, `expect`, `beforeEach`, `mock` from `'bun:test'`

### Test Patterns

#### Element Existence
```typescript
expect(element).not.toBeNull()
```

#### Attributes
```typescript
expect(element?.getAttribute('href')).toBe('/path')
```

#### Classes
```typescript
expect(element?.classList.contains('primary')).toBe(true)
```

#### Text Content
```typescript
expect(element?.textContent).toContain('Expected text')
```

### Example Test: FeatureCard

```typescript
// src/components/__tests__/feature-card.test.tsx
import { describe, it, expect } from 'bun:test'
import { render } from '@testing-library/react'
import { FeatureCard } from '../feature-card'

describe('FeatureCard', () => {
  it('renders title and description', () => {
    const { container } = render(
      <FeatureCard
        title="Test Product"
        description="Test description"
      />
    )

    const title = container.querySelector('h3')
    expect(title?.textContent).toBe('Test Product')

    const desc = container.querySelector('p')
    expect(desc?.textContent).toBe('Test description')
  })

  it('renders image when imageSrc is provided', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test"
        imageSrc="/test.jpg"
        imageAlt="Test image"
      />
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('alt')).toBe('Test image')
  })

  it('renders placeholder when no imageSrc', () => {
    const { container } = render(
      <FeatureCard title="Test" description="Test" />
    )

    const placeholder = container.querySelector('.bg-muted\\/20')
    expect(placeholder).not.toBeNull()
  })

  it('renders badge when provided', () => {
    const { container } = render(
      <FeatureCard
        title="Test"
        description="Test"
        badge="After"
      />
    )

    const badge = container.querySelector('[class*="badge"]')
    expect(badge?.textContent).toContain('After')
  })

  it('has hover states on card and title', () => {
    const { container } = render(
      <FeatureCard title="Test" description="Test" />
    )

    const card = container.querySelector('[class*="rounded-2xl"]')
    expect(card?.classList.contains('group')).toBe(true)

    const title = container.querySelector('h3')
    expect(title?.classList.contains('group-hover:text-primary')).toBe(true)
  })
})
```

### Test Coverage Requirements

Each component should test:
1. **Rendering**: Component mounts without errors
2. **Props**: All props render correctly
3. **Optional Props**: Optional props work when present/absent
4. **Conditional Rendering**: Elements show/hide based on props
5. **Styling**: Key CSS classes are applied
6. **Accessibility**: Basic ARIA attributes and semantic HTML

### Specific Test Cases

#### SiteHeader
- [ ] Renders logo and brand name
- [ ] Desktop nav shows on larger screens
- [ ] Mobile nav shows on smaller screens
- [ ] All navigation links render
- [ ] GetStartedButton integration works

#### FeatureCard
- [ ] Renders title and description
- [ ] Shows image when imageSrc provided
- [ ] Shows placeholder when no image
- [ ] Badge appears when provided
- [ ] Hover states apply correctly

#### ProcessStep
- [ ] Renders step number in badge
- [ ] Renders title and description
- [ ] Connector line shows when not last
- [ ] Connector hidden when isLast=true

#### SiteFooter
- [ ] Renders all footer sections
- [ ] Default sections work
- [ ] Custom sections override defaults
- [ ] Separator component renders
- [ ] Brand section displays
- [ ] Current year displays correctly

#### HeroSection
- [ ] Renders badge when provided
- [ ] Badge hidden when not provided
- [ ] Title and description render
- [ ] CTAs render correctly
- [ ] Image shows when imageSrc provided
- [ ] Image hidden when not provided

#### SectionHeader
- [ ] Renders title
- [ ] Renders description when provided
- [ ] Centered mode applies correct classes
- [ ] Non-centered mode applies correct classes

## Acceptance Criteria
- [ ] All 6 components have test files
- [ ] Each test file has 3+ test cases
- [ ] Tests use Bun test framework (NOT Jest)
- [ ] No custom matchers used
- [ ] All tests pass: `bun test`
- [ ] Coverage meets 70-80% target for new components
- [ ] No TypeScript errors in test files
- [ ] Tests follow project conventions (describe/it structure)

## Dependencies
- Task 08: Homepage refactor should be complete for integration testing

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/components/__tests__/feature-card.test.tsx

# Run with coverage
bun test --coverage
```

## Notes
- Use `happy-dom` for DOM environment (already configured)
- Import from `@testing-library/react` for render utilities only
- No `@testing-library/jest-dom` custom matchers
- Use native Bun assertions only
- Keep tests focused and fast
- Mock external dependencies if needed
- Test user-facing behavior, not implementation details
