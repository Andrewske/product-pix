# ProductPix Design System

> Implementation reference for developers. For principles and rationale, see [Design Principles](./design-principles.md).

**Last updated:** 2025-12-12

---

## Quick Reference

### Source of Truth
Color tokens, typography, and effects are defined in [`src/app/globals.css`](../src/app/globals.css). This document references those values—always check globals.css for the actual implementation.

### Color Tokens

| Token | Purpose | Light Mode | Dark Mode |
|-------|---------|------------|-----------|
| `--background` | Page background | Near-white | Deep charcoal |
| `--card` | Standard cards | White | Charcoal |
| `--card-hero` | Result panels | White | Lighter charcoal |
| `--card-control` | Form panels | White | Standard charcoal |
| `--accent` | Primary actions (green) | Medium green | Softer green |
| `--teal` | Secondary info | Medium teal | Softer teal |
| `--destructive` | Errors/warnings | Red | Red |
| `--foreground` | Primary text | Dark | Near-white |
| `--muted-foreground` | Secondary text | Medium gray | Light gray |

### Typography Classes

| Class | Font | Use For |
|-------|------|---------|
| `.font-display` | Space Grotesk | Headings (h1-h6), hero text, card titles |
| `.font-body` | Inter | Body text, labels, descriptions (default) |
| `font-mono` | System mono | Tiny metadata only (prices, timestamps) |

### Typography Scale

| Size | Value | Use For |
|------|-------|---------|
| `text-4xl` | 2.25rem (36px) | Hero headings |
| `text-3xl` | 1.875rem (30px) | Section headings |
| `text-2xl` | 1.5rem (24px) | Card titles |
| `text-xl` | 1.25rem (20px) | Large labels |
| `text-lg` | 1.125rem (18px) | Body emphasis |
| `text-base` | 1rem (16px) | Primary body text |
| `text-sm` | 0.875rem (14px) | Secondary text, captions |
| `text-xs` | 0.75rem (12px) | Metadata, timestamps |

---

## Component Status

| Component | Status | Variants | Notes |
|-----------|--------|----------|-------|
| Card | Stable | `default`, `hero`, `control`, `studio` | 4 variants with distinct purposes |
| Button | Stable | `accent`, `studio`, `outline`, `ghost`, `destructive` | 5 variants + 4 sizes |
| Badge | Stable | `teal`, `info`, `success`, `destructive` | 4 semantic variants |
| Input | Stable | — | With error state support |
| Label | Stable | — | Standard form labels |
| Dialog | Stable | — | Modal dialogs |
| Select | Stable | — | Dropdown selection |
| Textarea | Stable | — | Multiline input |

---

## Components

### Card System

Cards provide the foundation for content layout with semantic variants.

#### Variants

```tsx
<Card variant="default">   {/* Standard card */}
<Card variant="hero">      {/* Result panels, galleries - lighter in dark mode */}
<Card variant="control">   {/* Forms, settings - standard dark */}
<Card variant="studio">    {/* Matte effect with hover animation */}
```

#### Usage Rules

| Context | Variant | Example |
|---------|---------|---------|
| Generate page (left) | `control` | Upload forms, settings |
| Generate page (right) | `hero` | Result images, previews |
| Dashboard gallery | `studio` | Interactive image cards |
| Settings panels | `control` | Account, preferences |

#### DO / DON'T

```tsx
// DO: Use hero variant for primary content
<Card variant="hero">
  <CardContent>
    <img src={generatedImage} alt="Result" />
  </CardContent>
</Card>

// DON'T: Use default for result panels (lacks visual hierarchy)
<Card>
  <CardContent>
    <img src={generatedImage} alt="Result" />
  </CardContent>
</Card>

// DO: Use control variant for form sections
<Card variant="control">
  <CardHeader>
    <CardTitle>Upload Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <form>...</form>
  </CardContent>
</Card>

// DON'T: Mix card types inconsistently on the same page
```

#### Anatomy

```tsx
<Card variant="hero">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

---

### Button System

Buttons provide clear action hierarchy with variants for different contexts.

#### Variants

```tsx
<Button variant="accent">      {/* Green CTAs - primary actions */}
<Button variant="studio">      {/* Inverted with shine effect */}
<Button variant="outline">     {/* Secondary actions */}
<Button variant="ghost">       {/* Minimal/tertiary actions */}
<Button variant="destructive"> {/* Delete, cancel actions */}
```

#### Sizes

```tsx
<Button size="sm">       {/* Small - inline actions */}
<Button size="default">  {/* Standard */}
<Button size="lg">       {/* Large - prominent actions */}
<Button size="xl">       {/* Hero CTAs - main page actions */}
```

#### DO / DON'T

```tsx
// DO: Use accent for primary CTAs
<Button variant="accent" size="xl">Generate Photo</Button>

// DON'T: Use accent for secondary actions
<Button variant="accent">Cancel</Button>  // Should be outline or ghost

// DO: Use outline for secondary actions
<Button variant="outline">Save Draft</Button>

// DON'T: Use multiple accent buttons in the same area
<div>
  <Button variant="accent">Save</Button>
  <Button variant="accent">Generate</Button>  // One should be outline
</div>

// DO: Use size="xl" for hero sections
<section className="text-center py-12">
  <Button size="xl" variant="accent">Get Started</Button>
</section>
```

---

### Badge System

Badges provide visual status and categorization.

#### Variants

```tsx
<Badge variant="teal">        {/* Status, feature tags */}
<Badge variant="info">        {/* Informational (same as teal visually) */}
<Badge variant="success">     {/* Positive states */}
<Badge variant="destructive"> {/* Errors, warnings */}
```

#### DO / DON'T

```tsx
// DO: Use teal for feature tags and categories
<Badge variant="teal">AI-Powered</Badge>
<Badge variant="teal">New</Badge>

// DON'T: Use success for non-state information
<Badge variant="success">Premium Feature</Badge>  // Should be teal

// DO: Use success for confirmed states
<Badge variant="success">Completed</Badge>
<Badge variant="success">Verified</Badge>

// DO: Use destructive for warnings and errors
<Badge variant="destructive">Failed</Badge>
<Badge variant="destructive">Expired</Badge>
```

---

## Layout Patterns

### Two-Column Layout (Generate Page)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Left Column - Controls */}
  <div className="space-y-6">
    <Card variant="control">
      {/* Upload form, settings, controls */}
    </Card>
  </div>

  {/* Right Column - Content */}
  <div className="space-y-6">
    <Card variant="hero">
      {/* Results, previews, generated content */}
    </Card>
  </div>
</div>
```

### Centered Content (Contact/Legal Pages)

```tsx
<div className="container max-w-2xl mx-auto py-12">
  <div className="text-center space-y-8">
    {/* Centered content */}
  </div>
</div>
```

### Gallery Grid (Dashboard)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card variant="studio" hover>
    {/* Gallery item */}
  </Card>
</div>
```

---

## Common Patterns

### Hero Section

```tsx
<section className="text-center py-12 space-y-6">
  <h1 className="text-4xl font-display">Hero Heading</h1>
  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
    Description text
  </p>
  <Button size="xl" variant="accent">Call to Action</Button>
</section>
```

### Form Field

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" />
  <p className="text-sm text-muted-foreground">
    Helper text
  </p>
</div>
```

### Form Field with Error

```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <p id="email-error" className="text-destructive text-sm">
      Please enter a valid email address
    </p>
  )}
</div>
```

### Success Message

```tsx
<div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
  <CheckCircle className="h-5 w-5 text-success" />
  <div>
    <p className="font-medium">Success message</p>
    <p className="text-sm text-muted-foreground">Additional details</p>
  </div>
</div>
```

---

## Motion & Interaction

### Transition Timing

| Speed | Duration | Use For |
|-------|----------|---------|
| Fast | 100-150ms | Hover states, micro-interactions |
| Standard | 150-250ms | State changes, toggles |
| Slow | 300-500ms | Page transitions, major changes |

### Studio Effects (from globals.css)

| Class | Effect |
|-------|--------|
| `.studio-spotlight` | Radial gradient spotlight |
| `.matte-card` | Deep card with subtle shine |
| `.matte-card-hover` | Hover elevation with accent glow |
| `.button-studio` | Button with shine animation |
| `.hover-lift` | 4px elevation on hover |

---

## Accessibility

### Color Contrast
- All text meets WCAG AA (4.5:1 normal, 3:1 large)
- Interactive elements maintain contrast in both modes

### Focus States
- Visible focus indicators via `focus-visible`
- Consistent focus ring (`--ring` token)
- Full keyboard navigation support

### Form Validation Pattern

```tsx
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-id" : undefined}
/>
{hasError && (
  <p id="error-id" className="text-destructive text-sm">
    Error message
  </p>
)}
```

---

## Development Workflow

1. **Check existing patterns** before creating new components
2. **Use design system components** instead of custom styling
3. **Test in both light and dark modes** before committing
4. **Verify accessibility** with automated tools and manual testing
5. **Target 70-80% test coverage** for new components

---

## Related Documents

- [Design Principles](./design-principles.md) — The "why" (brand, philosophy, sanity checks)
- [`src/app/globals.css`](../src/app/globals.css) — Token definitions (source of truth)
- [`src/components/ui/`](../src/components/ui/) — Component implementations
