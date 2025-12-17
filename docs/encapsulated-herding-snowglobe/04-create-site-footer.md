# Create SiteFooter Component

## Files to Modify/Create
- src/components/site-footer.tsx

## Implementation Details
Create a reusable site footer component with the following features:
- Configurable sections via props (with sensible defaults)
- Separator component for visual hierarchy between main content and bottom
- Brand section with logo and tagline
- Responsive grid layout (4 columns on md+ screens, stacked on mobile)
- Footer bottom with copyright and legal links
- All links should have hover states
- Current year should display dynamically
- TypeScript types should be correct
- Component should be reusable across pages

Follow CLAUDE.md functional programming and type-safety rules:
- Pure functions, immutability
- Explicit return types on exported functions
- No `any`, unguarded `unknown`, or `!` assertions
- Functions ≤20 lines, nesting ≤3 levels
- Centralized logging (no console.log)

## Acceptance Criteria
- Footer renders with all sections correctly
- Separator divides main content from bottom section
- Grid layout is responsive (4 columns md+, stacked mobile)
- All links have hover states
- Brand section displays logo and tagline
- Default sections can be overridden via props
- TypeScript types are correct
- Footer is reusable across pages
- Current year displays dynamically in copyright

## Dependencies
- shadcn/ui components (Separator)
- Next.js Image component for logo
- Tailwind CSS for styling