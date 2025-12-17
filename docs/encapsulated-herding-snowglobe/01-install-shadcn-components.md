# Install Missing shadcn/ui Components

## Files to Modify/Create
- `src/components/ui/separator.tsx` (new)
- `src/components/ui/navigation-menu.tsx` (new)
- `src/components/ui/sheet.tsx` (new)
- `src/components/ui/aspect-ratio.tsx` (new)
- `src/components/ui/hover-card.tsx` (new - optional)

## Implementation Details

Install the following shadcn/ui components that are required for the homepage refactoring:

### 1. Separator Component
Used for visual dividers in the footer and between sections.
```bash
npx shadcn@latest add separator
```

### 2. NavigationMenu Component
Used for the site header desktop navigation with proper ARIA support.
```bash
npx shadcn@latest add navigation-menu
```

### 3. Sheet Component
Used for the mobile navigation drawer in the site header.
```bash
npx shadcn@latest add sheet
```

### 4. AspectRatio Component
Used for consistent image containers in feature cards.
```bash
npx shadcn@latest add aspect-ratio
```

### 5. HoverCard Component (Optional)
Can be used for additional feature card details on hover.
```bash
npx shadcn@latest add hover-card
```

## Acceptance Criteria
- [ ] All five components are installed in `src/components/ui/`
- [ ] Components follow the project's shadcn/ui gray + green theme
- [ ] No TypeScript errors after installation
- [ ] Components can be imported from `@/components/ui/*`

## Dependencies
None - this is the foundation for all subsequent tasks.

## Notes
- Use `npx` (not `bun`) for shadcn CLI commands as specified in project conventions
- Verify each component installs correctly before proceeding to the next
- HoverCard is optional and can be skipped if not needed
