# Create SectionHeader Component

## Files to Modify/Create
- src/components/section-header.tsx

## Implementation Details
Create a simple, reusable section header component for consistent styling across the site. The component should support:
- Required title prop
- Optional description prop
- Centered/non-centered alignment controlled by a centered boolean prop
- Appropriate spacing: mb-24 for centered, mb-12 for non-centered
- Description should have max-width constraint for readability
- Use proper TypeScript types
- Follow FP principles: pure component, no side effects
- Use Tailwind classes for styling
- Typography should follow design system (Figtree for display, Geist for body)

## Acceptance Criteria
- Component renders title with correct typography (h2 with appropriate size/weight)
- Optional description renders when provided with proper styling
- centered prop controls text alignment (text-center vs text-left) and spacing
- centered variant includes mb-24 spacing
- non-centered variant includes mb-12 spacing
- description has max-width constraint (prose or similar)
- TypeScript types are correct and explicit
- Component works consistently across sections
- No console logs or side effects
- Follows CLAUDE.md conventions

## Dependencies
- None