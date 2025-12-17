# Create SectionHeader Component

## Files to Modify/Create
- `src/components/section-header.tsx` (new)

## Implementation Details

Create a simple, reusable section header component for consistent styling across the site.

### Component Implementation

```typescript
// src/components/section-header.tsx
interface SectionHeaderProps {
  title: string
  description?: string
  centered?: boolean
}

export function SectionHeader({
  title,
  description,
  centered = true
}: SectionHeaderProps) {
  return (
    <div className={centered ? "text-center mb-24" : "mb-12"}>
      <h2 className="text-4xl font-bold mb-6 tracking-tight font-display">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
```

## Acceptance Criteria
- [ ] Component renders title with correct typography
- [ ] Optional description renders when provided
- [ ] `centered` prop controls text alignment and spacing
- [ ] Centered variant includes `mb-24` spacing
- [ ] Non-centered variant includes `mb-12` spacing
- [ ] Description has max-width constraint for readability
- [ ] TypeScript types are correct (no `any` or unguarded `unknown`)
- [ ] Works consistently across different sections

## Dependencies
None

## Notes
- Uses `font-display` for consistency with hero (assumes Figtree)
- `max-w-2xl` prevents description from becoming too wide
- `mx-auto` centers description in centered mode
- Default is centered (most common use case)
- Minimal component but ensures consistency

## Usage Examples

```typescript
// Centered (default)
<SectionHeader
  title="Immaculate Results"
  description="From raw phone photos to commercial-grade assets instantly."
/>

// Left-aligned
<SectionHeader
  title="Feature Overview"
  description="Everything you need to know."
  centered={false}
/>

// Title only
<SectionHeader title="Our Process" />
```
