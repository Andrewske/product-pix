# ProductPix Design System

## Design Philosophy

ProductPix embodies a clean, minimal, inviting, and slightly playful brand identity. Our design language prioritizes clarity, approachability, and professional polish while maintaining a human touch that differentiates us from enterprise or developer-focused tools.

### What We Are
- **Clean & Minimal**: Purposeful use of whitespace, clear visual hierarchy, and restrained ornamentation
- **Inviting**: Warm color palette, soft edges, and approachable interactions
- **Slightly Playful**: Subtle animations, thoughtful micro-interactions, and a touch of personality
- **Professional**: Consistent patterns, high-quality typography, and attention to detail

### What We Are NOT
- **Terminal/Analytics Dashboard**: No monospace fonts for UI text, no data-dense layouts, no stark monochromatic schemes
- **Crypto/DeFi**: No harsh neon colors, no blockchain-inspired aesthetics, no aggressive marketing language
- **Enterprise SaaS**: No complex navigation hierarchies, no feature-heavy interfaces, no corporate color schemes

### Heuristic
"If it looks like a terminal or analytics dashboard, it's wrong." This guiding principle ensures our interface remains accessible to non-technical users while maintaining the sophistication expected in a premium product.

## Color System

ProductPix uses a carefully calibrated two-accent strategy that supports both light and dark modes while maintaining visual harmony and accessibility.

### Two-Accent Strategy

- **Green (#22c55e)**: Primary accent for CTAs, main actions, selected options, and the "Generate" button
- **Teal (#14b8a6)**: Secondary accent for badges, info highlights, and helper text

### Light Mode Palette

```css
/* Backgrounds */
--background: 0 0% 100%;          /* Pure white */
--muted: 210 40% 96%;             /* Soft gray */
--card: 0 0% 100%;                /* White cards */

/* Accents */
--primary: 142 76% 36%;           /* Green */
--secondary: 178 84% 41%;         /* Teal */

/* Semantic */
--success: 142 76% 36%;           /* Green */
--info: 178 84% 41%;              /* Teal */
--destructive: 0 84% 60%;         /* Red */

/* Text */
--foreground: 222 84% 5%;         /* Dark gray */
--muted-foreground: 215 16% 47%;  /* Medium gray */
```

### Dark Mode Palette

```css
/* Backgrounds */
--background: 222 84% 5%;         /* Dark gray */
--muted: 217 33% 17%;             /* Charcoal */
--card: 222 84% 5%;               /* Dark gray */
--card-hero: 217 33% 17%;         /* Lighter charcoal for elevated cards */
--card-control: 210 40% 3%;       /* Darker charcoal for recessed cards */

/* Accents */
--primary: 142 76% 36%;           /* Green (same as light) */
--secondary: 178 84% 41%;         /* Teal (same as light) */

/* Semantic */
--success: 142 76% 36%;           /* Green */
--info: 178 84% 41%;              /* Teal */
--destructive: 0 84% 60%;         /* Red */

/* Text */
--foreground: 210 40% 98%;        /* Off-white */
--muted-foreground: 215 20% 65%;  /* Light gray */
```

### Card Hierarchy in Dark Mode

Dark mode uses layered charcoal backgrounds to create visual depth:

- **Background (#05070b)**: Page background
- **Card Hero (#0b1018)**: Elevated cards for results and galleries
- **Card Control (#111827)**: Recessed cards for forms and settings

### Color Usage Rules

1. **Product Photos**: Always displayed on clear, defined surfaces with subtle borders in dark mode
2. **Primary Actions**: Green buttons for main CTAs ("Generate", "Upload", "Save")
3. **Secondary Elements**: Teal for badges, status indicators, and informational highlights
4. **Semantic States**: Green for success, red for errors, teal for neutral information

### Badge Variants

- **Teal**: Status badges, feature tags, category labels
- **Info**: Informational badges (visually identical to teal for semantic flexibility)
- **Success**: Positive states, confirmations
- **Destructive**: Errors, warnings, deletions

## Typography

ProductPix uses a carefully selected typeface system that balances personality with readability across all contexts.

### Font Families

- **Display**: Space Grotesk - Used for headings, hero text, and prominent UI elements
- **Body**: Inter - Used for all body text, labels, and secondary information

### Typography Scale

```css
/* Headings */
--text-4xl: 2.25rem;    /* 36px - Hero headings */
--text-3xl: 1.875rem;   /* 30px - Section headings */
--text-2xl: 1.5rem;     /* 24px - Card titles */
--text-xl: 1.25rem;     /* 20px - Large labels */
--text-lg: 1.125rem;    /* 18px - Body emphasis */

/* Body */
--text-base: 1rem;      /* 16px - Primary body text */
--text-sm: 0.875rem;    /* 14px - Secondary text, captions */
--text-xs: 0.75rem;     /* 12px - Metadata, timestamps */
```

### Usage Guidelines

1. **Display Font (.font-display)**: Reserved for headings and hero content only
2. **Body Font**: Default for all other text content
3. **Mono Font**: Only for tiny meta information (prices, timestamps) - never for UI text
4. **Heading Defaults**: All headings use display font by default

## Component Patterns

ProductPix components follow consistent patterns that support our design philosophy while providing flexibility for different use cases.

### Card System

Cards provide the foundation for content layout with semantic variants that serve different purposes.

#### Variants

```typescript
<Card variant="default">   // Standard card
<Card variant="hero">      // Result panels, galleries (lighter in dark mode)
<Card variant="control">   // Forms, settings (recessed in dark mode)
<Card variant="studio">    // Matte effect with optional hover animation
```

#### Usage Rules

1. **Generate Page**:
   - Left column: `Card variant="control"` for upload forms and settings
   - Right column: `Card variant="hero"` for result images and previews

2. **Dashboard**:
   - Gallery items: `Card variant="studio"` with hover effects
   - Settings panels: `Card variant="control"`

3. **Studio Variant Status**: **NOT deprecated** - Actively used in 14 places with dedicated tests

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

### Button System

Buttons provide clear action hierarchy with variants for different contexts.

#### Variants

```typescript
<Button variant="accent">     // Green CTAs (primary actions)
<Button variant="studio">     // Inverted with shine effect (NOT deprecated)
<Button variant="outline">    // Secondary actions
<Button variant="ghost">      // Minimal actions
```

#### Sizes

```typescript
<Button size="sm">           // Small buttons
<Button size="default">      // Standard buttons
<Button size="lg">          // Large buttons
<Button size="xl">          // Hero CTAs (h-14, already exists)
```

#### Usage Rules

1. **Primary Actions**: `variant="accent"` for main CTAs ("Generate", "Upload")
2. **Secondary Actions**: `variant="outline"` or `variant="ghost"`
3. **Hero CTAs**: `size="xl"` for prominent actions
4. **Studio Variant**: Provides unique inverted aesthetic with shine animation

### Badge System

Badges provide visual status and categorization with semantic variants.

#### Variants

```typescript
<Badge variant="teal">        // Status badges, feature tags
<Badge variant="info">        // Informational badges
<Badge variant="success">     // Positive states
<Badge variant="destructive"> // Errors, warnings
```

#### Usage Rules

1. **Teal Badges**: Status indicators, category labels, feature tags
2. **Info Badges**: General information (visually identical to teal for semantic flexibility)
3. **Success/Destructive**: State indicators only

## Layout Patterns

ProductPix uses consistent layout patterns that create familiar user experiences across different pages.

### Two-Column Layout (Generate Page Pattern)

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

### Centered Content (Contact Page Pattern)

```tsx
<div className="container max-w-2xl mx-auto py-12">
  <div className="text-center space-y-8">
    {/* Centered content */}
  </div>
</div>
```

### Gallery Grid (Dashboard Pattern)

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Gallery items */}
  <Card variant="studio" hover>
    {/* Gallery item content */}
  </Card>
</div>
```

## Motion & Interaction

ProductPix uses restrained, purposeful motion that enhances usability without being distracting.

### Transition Timing

- **Standard**: 150-250ms transitions for state changes
- **Fast**: 100-150ms for hover states and micro-interactions
- **Slow**: 300-500ms for page transitions and major state changes

### Animation Philosophy

- **Restrained**: No decorative animations or excessive motion
- **Purposeful**: Motion serves user understanding and feedback
- **Subtle**: Effects enhance rather than dominate the experience

### Studio Effects

- **Spotlight**: Subtle lighting effect on interactive elements
- **Matte Card Hover**: Soft elevation change on studio variant cards
- **Button Studio Shine**: Animated highlight effect on studio buttons

## Accessibility

ProductPix maintains WCAG AA compliance across all interactive elements and content.

### Color Contrast

- All text combinations meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Interactive elements maintain sufficient contrast in both light and dark modes

### Form Validation

```tsx
<Input
  aria-invalid={hasError}
  aria-describedby={hasError ? "error-message" : undefined}
/>
{hasError && (
  <p id="error-message" className="text-destructive text-sm">
    Error message
  </p>
)}
```

### Focus States

- Visible focus indicators using `focus-visible` pseudo-class
- Consistent focus ring styling across all interactive elements
- Keyboard navigation support for all functionality

## Usage Guidelines

### Component Selection Decision Tree

1. **For content containers**:
   - Results/galleries → `Card variant="hero"`
   - Forms/settings → `Card variant="control"`
   - Interactive galleries → `Card variant="studio"`

2. **For buttons**:
   - Primary actions → `Button variant="accent"`
   - Special aesthetic → `Button variant="studio"`
   - Secondary actions → `Button variant="outline"`

3. **For status indicators**:
   - Categories/features → `Badge variant="teal"`
   - General info → `Badge variant="info"`
   - States → `Badge variant="success"` or `variant="destructive"`

### Common Patterns

#### Hero Section

```tsx
<section className="text-center py-12 space-y-6">
  <h1 className="text-4xl font-display">Hero Heading</h1>
  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
    Description text
  </p>
  <Button size="xl" variant="accent">Call to Action</Button>
</section>
```

#### Form Field Pattern

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Label</Label>
  <Input id="field" />
  <p className="text-sm text-muted-foreground">
    Helper text
  </p>
</div>
```

#### Success Message Pattern

```tsx
<div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-lg">
  <CheckCircle className="h-5 w-5 text-success" />
  <div>
    <p className="font-medium">Success message</p>
    <p className="text-sm text-muted-foreground">Additional details</p>
  </div>
</div>
```

### Testing Components

Components should be tested at 70-80% coverage across branches, functions, lines, and statements:

- **Snapshot Tests**: Visual regression prevention
- **Interaction Tests**: User behavior verification
- **Accessibility Tests**: Screen reader and keyboard navigation
- **Integration Tests**: Component composition and data flow

### Development Workflow

1. **Check existing patterns** before creating new components
2. **Use design system components** instead of custom styling
3. **Test in both light and dark modes** before committing
4. **Verify accessibility** with automated tools and manual testing
5. **Document new patterns** in this guide when established