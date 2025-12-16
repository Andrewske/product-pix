# ProductPix Design System

> Implementation reference for developers. For principles and rationale, see [Design Principles](./design-principles.md).

**Last updated:** 2025-12-16

---

## Quick Reference
## Design System Source

This project uses [shadcn/ui](https://ui.shadcn.com/) design system with:
- **Base color**: Gray (nearly neutral, low chroma)
- **Theme color**: Green (primary accent)
- **Structure**: @theme inline with radius utilities
- **Imports**: Requires `@import "shadcn/tailwind.css"`

---


### Source of Truth
Color tokens, typography, and effects are defined in [`src/app/globals.css`](../src/app/globals.css). This document references those values—always check globals.css for the actual implementation.

### Color Tokens

| Token | Purpose | Light Mode | Dark Mode |
|-------|---------|------------|-----------|
| `--background` | Page background | Near-white | Deep charcoal |
| `--card` | Standard cards | White | Charcoal |
| `--primary` | Primary actions (green) | Medium green | Softer green |
| `--destructive` | Errors/warnings | Red | Red |
| `--foreground` | Primary text | Dark | Near-white |
| `--muted-foreground` | Secondary text | Medium gray | Light gray |
| `--border` | Subtle borders | Light gray | White alpha (oklch(1 0 0 / 10%)) |

### Typography Classes

| Class | Font | Use For |
|-------|------|---------|
| `.font-display` | Figtree | Headings (h1-h6), hero text, card titles |
| `.font-body` | Geist | Body text, labels, descriptions (default) |
| `.font-mono` | Geist Mono | Tiny metadata only (prices, timestamps) |

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

### Border Radius System

Base radius: 0.625rem (10px)

| Class | Value | Use For |
|-------|-------|---------|
| `rounded-xl` | 0.75rem (12px) | Items, buttons, small components |
| `rounded-2xl` | 1rem (16px) | Containers, cards, larger elements |
| `rounded-4xl` | 2rem (32px) | Pills, badges, rounded elements |

---

## Component Status

| Component | Status | Variants | Notes |
|-----------|--------|----------|-------|
| Card | Stable | `default` | Clean card with rounded corners and subtle shadow |
| Button | Stable | `default`, `accent`, `outline`, `secondary`, `ghost`, `destructive` | 6 variants + 5 sizes |
| Badge | Stable | `default`, `secondary`, `destructive`, `outline` | 4 semantic variants |
| Input | Stable | — | With error state support |
| Label | Stable | — | Standard form labels |
| Dialog | Stable | — | Modal dialogs |
| Select | Stable | — | Dropdown selection |
| Textarea | Stable | — | Multiline input |

---

## Components

### Card System

Cards provide the foundation for content layout with semantic variants.

#### Usage Guidelines

Cards provide the foundation for content layout with consistent styling across the application.

#### Usage

```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
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
<Button variant="default">     {/* Primary actions */}
<Button variant="accent">      {/* Green CTAs - primary actions */}
<Button variant="outline">     {/* Secondary actions */}
<Button variant="secondary">   {/* Alternative actions */}
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

#### Usage Guidelines

```tsx
// Primary CTAs - use accent or default
<Button variant="accent" size="xl">Generate Photo</Button>

// Secondary actions - use outline or ghost
<Button variant="outline">Save Draft</Button>

// Destructive actions - use destructive variant
<Button variant="destructive">Delete</Button>
```

---

### Badge System

Badges provide visual status and categorization.

#### Variants

```tsx
<Badge variant="default">     {/* Primary (green) */}
<Badge variant="secondary">  {/* Secondary */}
<Badge variant="outline">    {/* Subtle */}
<Badge variant="destructive"> {/* Errors, warnings */}
```

#### Usage Guidelines

```tsx
// DO: Use default for positive states and primary information
<Badge variant="default">Completed</Badge>
<Badge variant="default">Verified</Badge>

// DO: Use secondary for neutral information
<Badge variant="secondary">Draft</Badge>
<Badge variant="secondary">Pending</Badge>

// DO: Use outline for subtle tags and categories
<Badge variant="outline">AI-Powered</Badge>
<Badge variant="outline">New</Badge>

// DO: Use destructive for warnings and errors
<Badge variant="destructive">Failed</Badge>
<Badge variant="destructive">Expired</Badge>
```
```

---

## Layout Patterns

### Two-Column Layout (Generate Page)

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Left Column - Controls */}
  <div className="space-y-6">
    <Card>
      {/* Upload form, settings, controls */}
    </Card>
  </div>

  {/* Right Column - Content */}
  <div className="space-y-6">
    <Card>
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
  <Card>
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
<div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 rounded-lg">
  <CheckCircle className="h-5 w-5 text-primary" />
  <div>
    <p className="font-medium text-primary">Success message</p>
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
