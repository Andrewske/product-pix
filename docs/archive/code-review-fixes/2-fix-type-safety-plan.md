# Fix Type Safety Violations - Admin Dashboard

## Overview
Add explicit return type annotations to all functions per project TypeScript standards. Current code violates the "explicit return types" requirement in CLAUDE.md.

## Architecture Decisions
- **Consistency**: All functions must have explicit return types for maintainability
- **Standards Compliance**: Follows project-wide TypeScript strict mode requirements

## Implementation Tasks

### Phase 1: Middleware and Layout Components
- [ ] Add return type to middleware function
  - Files: `src/middleware.ts` (modify - line 4)
  - Change: `export async function middleware(request: NextRequest): Promise<NextResponse>`
  - Tests: `bun test src/__tests__/middleware.test.ts`
  - Acceptance: TypeScript compiles without implicit return type warnings

- [ ] Add return type to AdminLayout
  - Files: `src/app/admin/layout.tsx` (modify - line 3)
  - Change: `export default function AdminLayout({ children }: { children: React.ReactNode }): JSX.Element`
  - Tests: Build verification
  - Acceptance: TypeScript compiles without warnings

- [ ] Add return type to AdminRefundsPage
  - Files: `src/app/admin/refunds/page.tsx` (modify - line 7)
  - Change: `export default async function AdminRefundsPage(): Promise<JSX.Element>`
  - Tests: Build verification
  - Acceptance: TypeScript compiles without warnings

### Phase 2: Navigation Component
- [ ] Add return type to AdminNav
  - Files: `src/components/admin/admin-nav.tsx` (modify - line 29)
  - Change: `export function AdminNav(): JSX.Element`
  - Tests: Build verification
  - Acceptance: TypeScript compiles without warnings

### Phase 3: Refund Approval Queue Component
- [ ] Add return type to fetchPendingRequests
  - Files: `src/components/admin/refund-approval-queue.tsx` (modify - line 22)
  - Change: `const fetchPendingRequests = async (): Promise<void> => {`
  - Tests: `bun test src/components/admin/__tests__/refund-approval-queue.test.tsx`
  - Acceptance: TypeScript compiles without warnings

- [ ] Add return type to handleApprove
  - Files: `src/components/admin/refund-approval-queue.tsx` (modify - line 43)
  - Change: `const handleApprove = async (refundId: string): Promise<void> => {`
  - Tests: Component tests pass
  - Acceptance: TypeScript compiles without warnings

- [ ] Add return type to formatTimestamp
  - Files: `src/components/admin/refund-approval-queue.tsx` (modify - line 78)
  - Change: `const formatTimestamp = (timestamp: string): string => {`
  - Tests: Component tests pass
  - Acceptance: TypeScript compiles without warnings

- [ ] Add return type to getReasonLabel
  - Files: `src/components/admin/refund-approval-queue.tsx` (modify - line 82)
  - Change: `const getReasonLabel = (reason: string): string => {`
  - Tests: Component tests pass
  - Acceptance: TypeScript compiles without warnings

## Acceptance Criteria
- [ ] All functions have explicit return type annotations
- [ ] `bun run build` completes without TypeScript errors or warnings
- [ ] All existing tests pass: `bun test`
- [ ] No implicit `any` types introduced
- [ ] Code follows project TypeScript standards from CLAUDE.md

## Files to Create/Modify

### Modified Files (5)
- `src/middleware.ts` - Add return type (1 function)
- `src/app/admin/layout.tsx` - Add return type (1 function)
- `src/app/admin/refunds/page.tsx` - Add return type (1 function)
- `src/components/admin/admin-nav.tsx` - Add return type (1 function)
- `src/components/admin/refund-approval-queue.tsx` - Add return types (4 functions)

## Dependencies
- None - these are independent type annotations

## Testing Strategy
1. **Type Checking**:
   ```bash
   bun run build
   ```
   Verify no TypeScript errors about implicit return types

2. **Unit Tests**:
   ```bash
   bun test src/__tests__/middleware.test.ts
   bun test src/components/admin/__tests__/refund-approval-queue.test.tsx
   ```
   All tests should pass

3. **Full Test Suite**:
   ```bash
   bun test
   ```
   Ensure no regressions

## Notes
- These are non-breaking changes (pure type annotations)
- Safe to implement in any order
- Low risk - only adds compile-time type checking
- High value - prevents future type-related bugs
