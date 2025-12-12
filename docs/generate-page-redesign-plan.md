# Generate Page Redesign Implementation Plan

## Overview

Apply the design system from `docs/design-system.md` to the generate page, matching the mock in `screenshot-2025-12-11_13-25-08.png`. This creates a cleaner, more polished UI with:
- Two-column layout with clear visual hierarchy
- Style cards with icons in a 2x2 grid
- Pill-style aspect ratio selector
- Dashed upload area with centered content
- Uppercase section labels
- Green primary CTA, teal info badge

## Architecture Decisions

- **Keep API-driven templates**: Templates continue to be fetched from `/api/templates`. Icon metadata is added to `template_data` JSONB (no migration needed).
- **Restyle existing component**: Transform `TemplateSelector` rather than creating a new component to maintain backward compatibility.
- **Reusable components**: Create `SectionLabel` and `AspectRatioSelector` as reusable primitives for site-wide consistency.
- **Icon format**: Use emoji strings stored in `template_data.icon` for simplicity. Can migrate to Lucide icon names later if needed.

## Implementation Tasks

### Phase 1: Foundation Components

- [ ] Create SectionLabel component
  - Files: `src/components/ui/section-label.tsx` (new)
  - Tests: Not required (trivial presentational component)
  - Acceptance: Renders uppercase, small, muted text with tracking-wide

```tsx
// src/components/ui/section-label.tsx
import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps): JSX.Element {
  return (
    <span className={cn(
      'text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3 block',
      className
    )}>
      {children}
    </span>
  );
}
```

- [ ] Create AspectRatioSelector component
  - Files: `src/components/forms/aspect-ratio-selector.tsx` (new)
  - Tests: `src/components/forms/__tests__/aspect-ratio-selector.test.tsx` (new)
  - Acceptance: Renders 6 pill buttons, selected state has green styling, calls onChange

```tsx
// src/components/forms/aspect-ratio-selector.tsx
'use client';

import { cn } from '@/lib/utils';

type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '3:2';

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
  disabled?: boolean;
}

const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2'];

export function AspectRatioSelector({ value, onChange, disabled }: AspectRatioSelectorProps): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {ASPECT_RATIOS.map((ratio) => (
        <button
          key={ratio}
          type="button"
          disabled={disabled}
          onClick={() => onChange(ratio)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
            value === ratio
              ? 'bg-primary/10 border-primary text-primary'
              : 'border-border hover:border-primary/50 text-foreground'
          )}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
}

export type { AspectRatio, AspectRatioSelectorProps };
```

- [ ] Export new components from barrel files
  - Files: `src/components/ui/index.ts` (modify), `src/components/forms/index.ts` (modify or create)
  - Acceptance: Components importable via `@/components/ui` and `@/components/forms`

### Phase 2: Template Icon Support

- [ ] Add icon field to template definitions
  - Files: `prompt-bench/templates/ecommerce-base.ts` (modify), other template files
  - Acceptance: Each template has `icon` string in its data object

Add to each template's data object:
```ts
// ecommerce-base.ts
export const ecommerceBase = {
  // ... existing fields
  name: 'Ecommerce Base',
  description: '...',
  icon: '📦',  // ADD THIS
};

// minimalist.ts
icon: '⚪',

// luxury.ts
icon: '✨',

// vibrant.ts
icon: '🎨',
```

- [ ] Update templates API to include icon
  - Files: `src/app/api/templates/route.ts` (modify)
  - Acceptance: API response includes `icon` field for each template

```ts
// In the map transformation, add:
icon: (templateData.icon as string) || '📷',
```

- [ ] Run `bun bench sync` to push template changes to database
  - Acceptance: Templates in DB have updated icon field

### Phase 3: Restyle TemplateSelector

- [ ] Transform TemplateSelector to 2x2 grid with icons
  - Files: `src/components/forms/template-selector.tsx` (modify)
  - Tests: Update existing tests if any
  - Acceptance: Renders 2-column grid, shows icons, green border on selected

```tsx
// Key changes to template-selector.tsx:

interface Template {
  slug: string;
  version: number;
  name: string;
  description: string;
  icon: string;  // ADD
}

// In the return JSX, replace the grid:
<div className="grid grid-cols-2 gap-3">
  {templates.map((template) => (
    <button
      key={template.slug}
      type="button"
      disabled={disabled}
      onClick={() => onChange(template.slug)}
      className={cn(
        'p-4 rounded-lg border text-left transition-all',
        value === template.slug
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      )}
    >
      <span className="text-2xl mb-2 block">{template.icon}</span>
      <span className="font-medium text-sm">{template.name}</span>
    </button>
  ))}
</div>
```

Remove the "Select Template" label (page will use SectionLabel instead).

### Phase 4: Update UploadForm Styling

- [ ] Restyle UploadForm to match mock
  - Files: `src/components/forms/upload-form.tsx` (modify)
  - Acceptance: Dashed border, centered icon, correct copy text

Key styling changes:
- Change border to `border-dashed border-2`
- Center the upload icon (Upload from lucide-react)
- Update text: "Click to upload or drag and drop" (bold)
- Subtext: "Your product photo will be transformed" (muted)
- Keep all upload logic unchanged

### Phase 5: Refactor Generate Page Layout

- [ ] Refactor generate page to new layout structure
  - Files: `src/app/generate/page.tsx` (modify)
  - Acceptance: Matches mock layout with two columns, section labels, proper spacing

```tsx
// src/app/generate/page.tsx structure:

return (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Header */}
    <div className="flex items-center gap-3 mb-8">
      <h1 className="text-2xl font-bold">Generate Product Photo</h1>
      <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
        AI studio for ecommerce sellers
      </Badge>
    </div>

    <div className="grid md:grid-cols-[1fr_1.2fr] gap-8">
      {/* Left Column: Controls */}
      <div className="space-y-6">
        {/* Upload Section */}
        <div>
          <SectionLabel>UPLOAD PRODUCT IMAGE</SectionLabel>
          <UploadForm onUploadComplete={handleUploadComplete} onError={setError} />
          {previewUrl && (
            <Button onClick={handleReset} variant="link" className="mt-2 text-sm text-destructive px-0">
              Remove image
            </Button>
          )}
        </div>

        {/* Style Section */}
        <div>
          <SectionLabel>CHOOSE STYLE</SectionLabel>
          <TemplateSelector value={templateSlug} onChange={setTemplateSlug} disabled={generating} />
        </div>

        {/* Aspect Ratio Section */}
        <div>
          <SectionLabel>ASPECT RATIO</SectionLabel>
          <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={generating} />
        </div>

        {/* Error Display */}
        {error && (
          <AlertBox variant="error">{error}</AlertBox>
        )}

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={generating || credits < 1} className="w-full" size="lg">
          {generating ? 'Generating...' : 'Generate (1 credit)'}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          You have <span className="font-semibold">{credits} credits</span> remaining
        </p>
      </div>

      {/* Right Column: Result */}
      <div>
        <SectionLabel>RESULT</SectionLabel>
        <Card className="min-h-[500px] flex items-center justify-center bg-muted/30">
          {generating ? (
            <GenerationLoading />
          ) : result ? (
            <GenerationResult imageUrl={result.imageUrl} onDownload={handleDownload} onRegenerate={handleRegenerate} />
          ) : (
            <div className="text-center text-muted-foreground">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary/50" />
              <p>Your studio-ready photo will appear here after you generate.</p>
            </div>
          )}
        </Card>
      </div>
    </div>

    {/* Credits Modal */}
    {showCreditsModal && (
      <InsufficientCreditsModal
        currentBalance={credits}
        requiredCredits={creditsNeeded}
        onClose={() => setShowCreditsModal(false)}
      />
    )}
  </div>
);
```

### Phase 6: Polish & Verification

- [ ] Verify dark mode appearance
  - Acceptance: All components render correctly in dark mode per design system

- [ ] Run linter and fix any issues
  - Command: `bun lint`
  - Acceptance: No lint errors

- [ ] Run TypeScript check
  - Command: `bun build` (uses tsconfig.build.json)
  - Acceptance: No type errors

- [ ] Manual visual QA against mock
  - Acceptance: UI matches `screenshot-2025-12-11_13-25-08.png`

## Acceptance Criteria

- [ ] All TypeScript errors resolved
- [ ] Lint passes (`bun lint`)
- [ ] Build succeeds (`bun build`)
- [ ] Generate page matches mock visually
- [ ] Style selection works with icons
- [ ] Aspect ratio selection works
- [ ] Upload functionality unchanged
- [ ] Generation flow works end-to-end
- [ ] Dark mode renders correctly

## Files to Create/Modify

### New Files
- `src/components/ui/section-label.tsx`
- `src/components/forms/aspect-ratio-selector.tsx`
- `src/components/forms/__tests__/aspect-ratio-selector.test.tsx`

### Modified Files
- `src/app/generate/page.tsx`
- `src/components/forms/template-selector.tsx`
- `src/components/forms/upload-form.tsx`
- `src/app/api/templates/route.ts`
- `prompt-bench/templates/ecommerce-base.ts`
- `prompt-bench/templates/minimalist.ts` (if exists)
- `prompt-bench/templates/luxury.ts` (if exists)
- `prompt-bench/templates/vibrant.ts` (if exists)
- `src/components/ui/index.ts` (barrel export)

## Dependencies

- Existing shadcn/ui components: `Button`, `Card`, `Badge`
- Lucide React icons: `Upload`, `Sparkles`
- Design system: `docs/design-system.md`
- Mock reference: `screenshot-2025-12-11_13-25-08.png`

## Notes

- The `prompt-bench` templates are TypeScript files that get synced to the database via `bun bench sync`. After modifying template files, run the sync command.
- The Badge component may need a `secondary` or `info` variant for the teal badge. Check existing variants and add if needed.
- Keep upload logic completely intact - only change styling/copy.
