# ProductPix Design System

## Overview

This document defines the design principles, visual language, and implementation patterns from the ProductPix homepage redesign. Use this as the canonical reference when designing new pages or refactoring existing ones.

**Design Philosophy**: Studio Minimalist — Professional photography meets refined digital minimalism. The interface should feel like walking into a high-end photo studio: dark, focused, with intentional lighting that draws attention to what matters.

---

## Color System

### Theme: Studio Minimalist Dark

The entire design centers on a sophisticated dark theme with matte, non-reflective surfaces.

#### Core Palette

```css
/* Deep matte charcoal - rich and neutral */
--background: oklch(0.12 0.01 265);
--foreground: oklch(0.96 0 0);

/* Matte cards - slightly lighter than background */
--card: oklch(0.15 0.01 265);
--card-foreground: oklch(0.96 0 0);

/* Muted elements - subtle depth */
--muted: oklch(0.25 0.01 265);
--muted-foreground: oklch(0.6 0.01 265);
```

#### Accent Colors

**Primary Accent: Refined Mint/Green**
```css
--accent: oklch(0.75 0.15 145);
--accent-foreground: oklch(0.1 0.01 265);
```

**Secondary Accent: Soft Teal**
```css
--teal: oklch(0.7 0.12 190);
--teal-foreground: oklch(0.1 0.01 265);
```

#### Borders & Dividers

Borders are extremely subtle — barely visible separators that suggest structure without dominating:

```css
--border: oklch(0.2 0.01 265);
```

**Usage**: Borders should be almost imperceptible at first glance. Use opacity modifiers for even softer divisions:
- `border-border/40` for section dividers
- `border-border/50` for card edges
- `border-white/10` for glass-morphic overlays

---

## Typography

### Font Stack

- **Primary**: Geist (sans-serif)
- **Monospace**: Geist Mono

### Scale & Hierarchy

The design favors **large, bold headlines** with generous line-height and tight tracking:

```tsx
// Hero headline
className="text-6xl md:text-8xl font-bold tracking-tight leading-none"

// Section headline
className="text-4xl md:text-5xl font-bold tracking-tight"

// Subsection
className="text-2xl font-bold tracking-tight"

// Body large
className="text-xl text-muted-foreground leading-relaxed font-light"

// Body standard
className="text-base text-muted-foreground"

// Caption/metadata
className="text-sm text-muted-foreground"
```

### Text Treatments

**Gradient Text** (use sparingly for emphasis):
```tsx
<span className="gradient-text-studio">in Seconds</span>
```

Renders as white → gray → accent gradient (135deg).

**Soft Glow** (rare, for special moments):
```tsx
className="soft-glow-text"
```

---

## Layout Principles

### Container Widths

```tsx
// Standard content container
className="max-w-6xl mx-auto px-4"

// Narrow content (pricing, CTAs)
className="max-w-5xl mx-auto px-4"

// Very narrow (single column text)
className="max-w-2xl mx-auto"
```

### Vertical Spacing

Generous whitespace is critical to the studio aesthetic:

```tsx
// Section padding
className="py-32"

// Subsection spacing
className="space-y-8"

// Element groups
className="space-y-6"

// Tight groups
className="space-y-4"
```

### Grid Layouts

```tsx
// 3-column feature grid
className="grid md:grid-cols-3 gap-8"

// 2-column split (text + visual)
className="grid md:grid-cols-2 gap-16 items-center"
```

---

## Visual Effects

### Studio Lighting

**Soft Spotlight** — Simulates overhead studio lighting:

```tsx
<div className="absolute inset-0 studio-spotlight pointer-events-none" />
```

**Radial Glow** — Large blur creating ambient light:

```tsx
<div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
```

**Usage**: Place these effects as absolute positioned elements within relative containers. Always include `pointer-events-none`.

### Card Surfaces

**Matte Cards** — Non-reflective surfaces with subtle edge lighting:

```tsx
<div className="matte-card rounded-2xl overflow-hidden">
  {/* content */}
</div>
```

**Interactive Matte Cards** (with hover lift):

```tsx
<div className="matte-card matte-card-hover rounded-2xl overflow-hidden">
  {/* content */}
</div>
```

**Glass-morphic Overlays** (for floating UI):

```tsx
className="bg-background/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
```

### Shadows

Use shadows to create depth hierarchy:

```tsx
// Subtle depth
className="shadow-lg"

// Strong elevation
className="shadow-2xl"

// Colored shadows (rare)
className="shadow-lg shadow-accent/20"
```

---

## Component Patterns

### Header

Sticky header with glassmorphic background:

```tsx
<header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
  <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
    {/* Logo + nav */}
  </div>
</header>
```

### Logo Treatment

```tsx
<div className="text-2xl font-bold tracking-tight flex items-center gap-2">
  <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/60 rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
    <Sparkles className="w-5 h-5 text-accent-foreground" />
  </div>
  ProductPix
</div>
```

### Buttons

**Primary CTA** (studio button with shine effect):

```tsx
<Button
  size="lg"
  className="bg-foreground text-background hover:bg-foreground/90 h-14 px-8 text-lg shadow-xl hover:shadow-2xl transition-all button-studio"
>
  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
</Button>
```

**Secondary Button**:

```tsx
<Button
  size="lg"
  variant="outline"
  className="h-14 px-8 text-lg border-border hover:bg-muted/50 transition-all"
>
  View Gallery
</Button>
```

**Inverted Button** (for dark-on-light contexts):

```tsx
className="bg-background text-foreground hover:bg-background/90"
```

### Badge/Pills

Small metadata badges:

```tsx
<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm font-medium text-muted-foreground shadow-sm">
  <Sparkles className="w-4 h-4 text-accent" />
  <span>AI-Powered Studio Photography</span>
</div>
```

### Numbered Steps

```tsx
<div className="flex gap-4 items-start">
  <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0 text-sm font-medium text-muted-foreground">
    {stepNumber}
  </div>
  <div>
    <h3 className="font-semibold text-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
</div>
```

### Pricing Cards

**Standard Card**:
```tsx
className="rounded-2xl p-8 bg-card border border-border/50 text-foreground hover:border-foreground/20"
```

**Featured Card** (inverted with scale):
```tsx
className="rounded-2xl p-8 bg-foreground text-background shadow-2xl scale-105 z-10"
```

### Image Containers

Product showcase with refined borders:

```tsx
<div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
  <Image
    src="/hero-image.jpg"
    alt="Product showcase"
    fill
    className="object-cover"
  />
</div>
```

Gallery items:

```tsx
<div className="matte-card rounded-2xl overflow-hidden aspect-[4/5] relative matte-card-hover">
  {/* Image content */}
</div>
```

---

## Animation & Interaction

### Transitions

All interactions should feel smooth but deliberate:

```tsx
// Standard transitions
className="transition-colors"          // For color changes
className="transition-all"             // For multi-property changes
className="transition-all duration-300" // Custom timing

// Hover states
className="hover:text-foreground transition-colors"
className="hover:bg-muted/50 transition-all"
```

### Transform Effects

**Lift on Hover**:
```tsx
className="hover:shadow-2xl transition-all"
className="transform hover:translateY(-2px)" // or use matte-card-hover
```

**Button Shine Animation**:

Automatic with `button-studio` class. Subtle shine sweeps across button every 3 seconds.

---

## Spacing System

Use Tailwind's spacing scale, but favor these specific values:

- **Gap between elements**: `gap-4`, `gap-6`, `gap-8`
- **Section padding**: `py-32` (vertical), `px-4` (horizontal)
- **Card padding**: `p-8`, `p-12`
- **Inline spacing**: `space-x-2`, `space-y-4`

---

## Border Radius

Consistent rounding creates visual cohesion:

- **Small elements** (badges, pills): `rounded-full` or `rounded-lg`
- **Cards**: `rounded-2xl`
- **Buttons**: `rounded-md` (default from shadcn)
- **Images/media**: `rounded-2xl`

---

## Iconography

Use **Lucide React** icons with these sizing conventions:

```tsx
// Small (inline with text)
<Icon className="w-4 h-4" />

// Medium (standalone)
<Icon className="w-5 h-5" />

// Large (feature icons)
<Icon className="w-12 h-12" />
```

**Color treatments**:
- Muted: `text-muted-foreground`
- Accent: `text-accent`
- Standard: `text-foreground`

---

## Responsive Patterns

### Mobile-First Breakpoints

```tsx
// Mobile: base styles
// Tablet: md: prefix (768px+)
// Desktop: lg: prefix (1024px+)

// Example:
className="text-5xl md:text-6xl lg:text-8xl"
className="grid md:grid-cols-2 lg:grid-cols-3"
className="flex-col sm:flex-row"
```

### Stack on Mobile

Content that's side-by-side on desktop should stack vertically on mobile:

```tsx
className="flex flex-col md:flex-row gap-4"
className="grid grid-cols-1 md:grid-cols-2 gap-8"
```

---

## Accessibility

### Semantic HTML

Use proper heading hierarchy:
- `<h1>` once per page (hero headline)
- `<h2>` for section titles
- `<h3>` for subsections

### Focus States

The design system includes focus ring styles via Tailwind v4:

```css
outline-ring/50  /* Applied globally via base layer */
```

### Color Contrast

All text meets WCAG AA standards:
- Foreground on background: High contrast
- Muted-foreground on background: Sufficient for body text
- Accent on dark backgrounds: Verified for readability

---

## Anti-Patterns (What NOT to Do)

### ❌ Avoid These

1. **Bright, saturated colors** — This is a matte studio, not a neon arcade
2. **Heavy drop shadows** — Use box-shadow sparingly, prefer subtle elevation
3. **Busy backgrounds** — Backgrounds should recede, not compete
4. **Over-animation** — Animations should be subtle and purposeful
5. **Tight spacing** — Embrace whitespace generously
6. **Small text everywhere** — Headlines should be bold and large
7. **Rainbow gradients** — Stick to the accent palette (mint/teal)
8. **Glossy/reflective surfaces** — Everything is matte

### ✅ Do This Instead

1. Use refined, desaturated accent colors (mint, teal)
2. Create depth with subtle gradients and soft shadows
3. Let the background fade into darkness
4. Animate only state changes and CTAs
5. Use `py-32` for section padding
6. Make headlines 4xl–8xl in size
7. Limit gradients to text effects and subtle lighting
8. Embrace the `matte-card` aesthetic

---

## Implementation Checklist

When creating a new page or component:

- [ ] Use dark theme colors (`bg-background`, `text-foreground`)
- [ ] Apply generous vertical spacing (`py-32` for sections)
- [ ] Use max-width containers (`max-w-6xl mx-auto px-4`)
- [ ] Add studio lighting effects for hero sections
- [ ] Use `matte-card` for elevated surfaces
- [ ] Apply proper typography scale (4xl+ for headlines)
- [ ] Include hover states with `transition-all`
- [ ] Test responsive breakpoints (mobile, tablet, desktop)
- [ ] Verify color contrast for accessibility
- [ ] Use semantic HTML (proper heading hierarchy)

---

## File References

**Color definitions**: `/home/kevin/coding/landing-page/src/app/globals.css:49-106`
**Custom effects**: `/home/kevin/coding/landing-page/src/app/globals.css:166-307`
**Homepage implementation**: `/home/kevin/coding/landing-page/src/app/page.tsx`

---

## Version History

- **v1.0** (2025-12-10): Initial design system documentation based on homepage redesign
