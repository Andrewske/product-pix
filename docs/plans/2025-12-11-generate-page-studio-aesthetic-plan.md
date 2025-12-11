# Generate Page Studio Aesthetic Update Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update the Generate page with a professional studio aesthetic using existing Phase 1 components for a cohesive design system.

**Architecture:** Replace basic layout with PageContainer wrapper, enhance upload zone with studio lighting effects, convert template cards to use StudioCard hover behavior, upgrade result display with shadow-2xl and refined borders, add subtle loading animations, and implement gradient text for success states.

**Tech Stack:** Next.js 16, React, Tailwind CSS, existing component library (PageContainer, StudioCard, etc.)

## Task 1: Wrap page content with PageContainer

**Files:**
- Modify: `src/app/generate/page.tsx:108-209`

**Step 1: Import PageContainer**

```typescript
import { PageContainer } from '@/components/layout/page-container';
```

**Step 2: Replace root div with PageContainer**

Replace:
```typescript
<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
```

With:
```typescript
<PageContainer>
```

And close with `</PageContainer>` instead of `</div>`.

**Step 3: Update title styling**

Change:
```typescript
<h1 className="text-2xl font-bold mb-8">Generate Product Photo</h1>
```

To:
```typescript
<h1 className="text-3xl font-bold mb-12 text-center">Generate Product Photo</h1>
```

**Step 4: Run visual test**

Run: `bun run dev`
Expected: Page loads with PageContainer styling (centered, proper spacing, studio spotlight effect)

## Task 2: Add studio lighting to upload zone

**Files:**
- Modify: `src/components/forms/upload-form.tsx:131-194`

**Step 1: Add studio lighting wrapper**

Replace the root div className with:
```typescript
className={`
  relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
  transition-all duration-300 bg-gradient-to-br from-background to-muted/20
  ${isDragging
    ? 'border-primary bg-primary/10 shadow-lg scale-105'
    : 'border-border hover:border-primary/50 hover:shadow-md'
  }
  ${uploading ? 'pointer-events-none opacity-50' : ''}
`}
```

**Step 2: Add studio lighting overlay**

After the input element, add:
```typescript
{/* Studio lighting effect */}
<div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent via-primary/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
```

**Step 3: Update icon styling**

Change the SVG className to:
```typescript
className="mx-auto h-16 w-16 text-primary/60 mb-4"
```

**Step 4: Test upload zone**

Run: `bun run dev`
Expected: Upload zone shows gradient background, hover effects with lighting overlay, larger icon

## Task 3: Convert template cards to use StudioCard hover

**Files:**
- Modify: `src/components/forms/template-selector.tsx:1-107`

**Step 1: Import StudioCard**

Add import:
```typescript
import { StudioCard } from '@/components/ui/studio-card';
```

**Step 2: Replace Card with StudioCard**

Replace:
```typescript
<Card
  key={template.slug}
  className={`p-4 cursor-pointer transition-all hover:border-primary ${
    value === template.slug
      ? 'border-primary bg-primary/5'
      : 'border-border'
  }`}
  onClick={() => !disabled && onChange(template.slug)}
>
```

With:
```typescript
<StudioCard
  key={template.slug}
  hover
  className={`p-6 cursor-pointer transition-all ${
    value === template.slug
      ? 'ring-2 ring-primary bg-primary/5'
      : ''
  } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
  onClick={() => !disabled && onChange(template.slug)}
>
```

**Step 3: Update card content styling**

Change the inner div to:
```typescript
<div className="flex items-start justify-between">
  <div className="flex-1">
    <h3 className="font-semibold text-base mb-2">{template.name}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">
      {template.description}
    </p>
  </div>
  {value === template.slug && (
    <Check className="h-5 w-5 text-primary flex-shrink-0 ml-3" />
  )}
</div>
```

**Step 4: Test template selector**

Run: `bun run dev`
Expected: Template cards show StudioCard hover effects, improved spacing and typography

## Task 4: Upgrade result display with shadow-2xl and refined borders

**Files:**
- Modify: `src/app/generate/page.tsx:179-198`

**Step 1: Update result card styling**

Replace:
```typescript
<Card className="p-4 min-h-[400px] flex items-center justify-center bg-muted/50">
```

With:
```typescript
<div className="shadow-2xl rounded-3xl border border-border/50 bg-gradient-to-br from-background to-muted/30 p-8 min-h-[500px] flex items-center justify-center backdrop-blur-sm">
```

**Step 2: Update placeholder text styling**

Change:
```typescript
<p className="text-muted-foreground">
  Generated image will appear here
</p>
```

To:
```typescript
<p className="text-muted-foreground text-center text-lg">
  Your studio-quality product photo will appear here
</p>
```

**Step 3: Test result display**

Run: `bun run dev`
Expected: Result area shows enhanced shadow, gradient background, refined borders, larger minimum height

## Task 5: Add subtle loading animations

**Files:**
- Modify: `src/components/generation-loading.tsx:16-25`

**Step 1: Add subtle pulse animation**

Replace the return statement with:
```typescript
return (
  <div className="flex flex-col items-center justify-center py-20 space-y-6">
    <div className="relative">
      <Spinner className="size-12" />
      <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
    </div>
    <div className="text-center space-y-2">
      <p className="text-muted-foreground font-medium">{message}</p>
      <div className="flex justify-center space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary/40 rounded-full animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);
```

**Step 2: Test loading animation**

Run: `bun run dev`, trigger a generation
Expected: Loading shows larger spinner with pulse effect, staggered dot animation

## Task 6: Implement gradient text for success states

**Files:**
- Modify: `src/app/generate/page.tsx:109-111`

**Step 1: Update page title with gradient**

Change:
```typescript
<h1 className="text-3xl font-bold mb-12 text-center">Generate Product Photo</h1>
```

To:
```typescript
<h1 className="text-3xl font-bold mb-12 text-center bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
  Generate Product Photo
</h1>
```

**Step 2: Add success message with gradient**

After the title, add:
```typescript
{result && (
  <p className="text-center mb-8 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-medium">
    ✨ Generation complete! Your studio-quality photo is ready.
  </p>
)}
```

**Step 3: Test gradient text**

Run: `bun run dev`, complete a generation
Expected: Title shows gradient text, success message appears with green gradient after generation

## Task 7: Final visual review and testing

**Files:**
- Test: Visual review of all changes

**Step 1: Run development server**

Run: `bun run dev`

**Step 2: Test all user flows**

1. Load page - check PageContainer, gradient title
2. Upload image - check studio lighting effects
3. Select template - check StudioCard hover
4. Generate image - check loading animations
5. View result - check shadow-2xl, refined borders, success gradient text

**Step 3: Run linting**

Run: `bun run lint`
Expected: No linting errors

**Step 4: Commit changes**

```bash
git add src/app/generate/page.tsx src/components/forms/upload-form.tsx src/components/forms/template-selector.tsx src/components/generation-loading.tsx
git commit -m "feat: update Generate page with studio aesthetic

- Wrap page with PageContainer for consistent layout
- Add studio lighting effects to upload zone
- Convert template cards to use StudioCard hover
- Upgrade result display with shadow-2xl and refined borders
- Add subtle loading animations with pulse effects
- Implement gradient text for title and success states"
```</content>
<parameter name="filePath">docs/plans/2025-12-11-generate-page-studio-aesthetic-plan.md