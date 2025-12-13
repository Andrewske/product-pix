# Fix Critical Issues - Admin Dashboard

## Overview
Address critical runtime and accessibility bugs that prevent the admin dashboard from functioning correctly in production.

## Architecture Decisions
- **Client Component Boundary**: AdminNav must be a client component due to usePathname() hook requirement
- **Disabled Navigation Pattern**: Remove Link wrapper for disabled items to prevent keyboard navigation

## Implementation Tasks

### Phase 1: Fix Runtime Error
- [ ] Add 'use client' directive to AdminNav component
  - Files: `src/components/admin/admin-nav.tsx` (modify - line 1)
  - Change: Add `'use client';` as first line of file
  - Tests: Verify component renders without errors
  - Acceptance: Component renders correctly in Next.js 16 App Router without server/client boundary errors

### Phase 2: Fix Accessibility Issue
- [ ] Fix disabled link navigation in AdminNav
  - Files: `src/components/admin/admin-nav.tsx` (modify - lines 37-51)
  - Change: Conditionally render Link wrapper based on `item.active` flag
  - Implementation:
    ```typescript
    {navItems.map((item) => (
      item.active ? (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start',
              pathname === item.href && 'bg-primary text-primary-foreground'
            )}
          >
            {item.label}
          </Button>
        </Link>
      ) : (
        <Button
          key={item.href}
          variant="ghost"
          className="w-full justify-start opacity-50 cursor-not-allowed"
          disabled
        >
          {item.label}
        </Button>
      )
    ))}
    ```
  - Tests: Manual keyboard navigation test - Tab + Enter should not navigate on disabled items
  - Acceptance: Disabled navigation items cannot be navigated via keyboard or mouse

## Acceptance Criteria
- [ ] AdminNav component renders without Next.js server/client errors
- [ ] Disabled navigation items are not wrapped in Link components
- [ ] Keyboard navigation (Tab + Enter) does not navigate to disabled routes
- [ ] Visual styling remains consistent for disabled items
- [ ] No TypeScript errors
- [ ] Existing tests pass

## Files to Create/Modify

### Modified Files (1)
- `src/components/admin/admin-nav.tsx` - Add 'use client', fix disabled link navigation

## Dependencies
- None - standalone fixes

## Testing Strategy
1. **Manual Testing**:
   - Navigate to /admin/refunds
   - Use Tab key to focus on "Analytics" button
   - Press Enter - should NOT navigate
   - Click "Analytics" button - should NOT navigate

2. **Build Verification**:
   ```bash
   bun run build
   ```
   Should complete without errors about usePathname in server component

## Notes
- These are blocking issues that will cause runtime failures in production
- Must be fixed before any other improvements
- Changes are isolated to one file with minimal risk
