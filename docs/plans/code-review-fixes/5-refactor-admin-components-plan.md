# Refactor Admin Components for Maintainability

## Overview
Extract reusable components and utility functions from the 165-line RefundApprovalQueue component to follow project standards (functions ≤20 lines, ≤3 nesting levels).

## Architecture Decisions
- **Component Extraction**: Separate RefundCard into its own component for reusability
- **Utility Functions**: Extract formatting and mapping functions to shared utilities
- **File Organization**: Follow project structure with utils in `@/lib/utils/refunds`
- **Maintainability**: Smaller, focused components are easier to test and modify

## Implementation Tasks

### Phase 1: Create Utility Functions
- [ ] Create refund utility functions module
  - Files: `src/lib/utils/refunds.ts` (new)
  - Implementation:
    ```typescript
    export const formatTimestamp = (timestamp: string): string => {
      return new Date(timestamp).toLocaleString();
    };

    export const getReasonLabel = (reason: string): string => {
      const labels: Record<string, string> = {
        poor_quality: 'Poor Quality',
        wrong_style: 'Wrong Style',
        technical_issue: 'Technical Issue',
        other: 'Other',
      };
      return labels[reason] || reason;
    };
    ```
  - Tests: `src/lib/utils/__tests__/refunds.test.ts` (new)
  - Acceptance: Utility functions exported and tested

- [ ] Create utility function tests
  - Files: `src/lib/utils/__tests__/refunds.test.ts` (new)
  - Tests:
    ```typescript
    import { describe, it, expect } from 'bun:test';
    import { formatTimestamp, getReasonLabel } from '../refunds';

    describe('refunds utilities', () => {
      describe('formatTimestamp', () => {
        it('formats ISO timestamp to locale string', () => {
          const result = formatTimestamp('2024-01-01T10:00:00Z');
          expect(result).toContain('1/1/2024');
        });
      });

      describe('getReasonLabel', () => {
        it('returns label for poor_quality', () => {
          expect(getReasonLabel('poor_quality')).toBe('Poor Quality');
        });

        it('returns label for wrong_style', () => {
          expect(getReasonLabel('wrong_style')).toBe('Wrong Style');
        });

        it('returns label for technical_issue', () => {
          expect(getReasonLabel('technical_issue')).toBe('Technical Issue');
        });

        it('returns label for other', () => {
          expect(getReasonLabel('other')).toBe('Other');
        });

        it('returns original reason for unknown values', () => {
          expect(getReasonLabel('unknown')).toBe('unknown');
        });
      });
    });
    ```
  - Acceptance: All utility functions tested with edge cases

### Phase 2: Extract RefundCard Component
- [ ] Create RefundCard component
  - Files: `src/components/admin/refund-card.tsx` (new)
  - Implementation:
    ```typescript
    'use client';

    import Image from 'next/image';
    import { Card } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Badge } from '@/components/ui/badge';
    import type { PendingRefundWithDetails } from '@/types';
    import { formatTimestamp, getReasonLabel } from '@/lib/utils/refunds';

    interface RefundCardProps {
      request: PendingRefundWithDetails;
      isProcessing: boolean;
      onApprove: (id: string) => Promise<void>;
    }

    export function RefundCard({
      request,
      isProcessing,
      onApprove
    }: RefundCardProps): JSX.Element {
      return (
        <Card className="p-6">
          <div className="flex gap-4">
            {/* Image Preview */}
            <div className="flex-shrink-0">
              <Image
                src={request.generated_images.public_url}
                alt={request.generated_images.title || 'Refund request image'}
                width={128}
                height={128}
                className="rounded object-cover"
              />
            </div>

            {/* Request Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-sm">
                    {request.users.display_name || request.users.email}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {request.users.email}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-2">
                  {getReasonLabel(request.reason)}
                </Badge>
              </div>

              {request.feedback && (
                <p className="text-sm text-muted-foreground mb-2">
                  &ldquo;{request.feedback}&rdquo;
                </p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Requested {formatTimestamp(request.requested_at)}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove(request.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Approving...' : 'Approve Refund'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }
    ```
  - Tests: `src/components/admin/__tests__/refund-card.test.tsx` (new)
  - Acceptance: Component renders correctly with all props

- [ ] Create RefundCard component tests
  - Files: `src/components/admin/__tests__/refund-card.test.tsx` (new)
  - Tests:
    ```typescript
    import { describe, it, expect, mock } from 'bun:test';
    import { render, screen } from '@testing-library/react';
    import userEvent from '@testing-library/user-event';
    import { RefundCard } from '../refund-card';
    import type { PendingRefundWithDetails } from '@/types';

    describe('RefundCard', () => {
      const mockRequest: PendingRefundWithDetails = {
        id: 'refund-1',
        reason: 'poor_quality',
        feedback: 'Image is blurry',
        requested_at: '2024-01-01T10:00:00Z',
        credits_refunded: 50,
        user_id: 'user-1',
        image_id: 'image-1',
        status: 'pending_admin',
        users: {
          email: 'user@example.com',
          display_name: 'John Doe',
        },
        generated_images: {
          public_url: 'https://example.com/image.jpg',
          title: 'Product Image',
        },
      };

      it('renders user information', () => {
        const mockOnApprove = mock(async () => {});
        render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

        expect(screen.getByText('John Doe')).toBeDefined();
        expect(screen.getByText('user@example.com')).toBeDefined();
      });

      it('renders reason badge', () => {
        const mockOnApprove = mock(async () => {});
        render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

        expect(screen.getByText('Poor Quality')).toBeDefined();
      });

      it('renders feedback if provided', () => {
        const mockOnApprove = mock(async () => {});
        render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

        expect(screen.getByText(/Image is blurry/)).toBeDefined();
      });

      it('calls onApprove when button clicked', async () => {
        const user = userEvent.setup();
        const mockOnApprove = mock(async () => {});
        render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

        const button = screen.getByRole('button', { name: 'Approve Refund' });
        await user.click(button);

        expect(mockOnApprove).toHaveBeenCalledWith('refund-1');
      });

      it('disables button when processing', () => {
        const mockOnApprove = mock(async () => {});
        render(<RefundCard request={mockRequest} isProcessing={true} onApprove={mockOnApprove} />);

        const button = screen.getByRole('button', { name: 'Approving...' });
        expect(button.hasAttribute('disabled')).toBe(true);
      });

      it('renders image with correct alt text', () => {
        const mockOnApprove = mock(async () => {});
        const { container } = render(<RefundCard request={mockRequest} isProcessing={false} onApprove={mockOnApprove} />);

        const img = container.querySelector('img');
        expect(img?.getAttribute('alt')).toBe('Product Image');
      });
    });
    ```
  - Acceptance: Component fully tested with edge cases

### Phase 3: Update RefundApprovalQueue
- [ ] Refactor RefundApprovalQueue to use extracted components
  - Files: `src/components/admin/refund-approval-queue.tsx` (modify)
  - Changes:
    - Remove formatTimestamp and getReasonLabel functions (lines 78-90)
    - Import utilities: `import { formatTimestamp, getReasonLabel } from '@/lib/utils/refunds';`
    - Replace Card rendering (lines 123-174) with:
    ```typescript
    return (
      <div className="space-y-4">
        {requests.map((request) => (
          <RefundCard
            key={request.id}
            request={request}
            isProcessing={processingIds.has(request.id)}
            onApprove={handleApprove}
          />
        ))}
      </div>
    );
    ```
  - Tests: `bun test src/components/admin/__tests__/refund-approval-queue.test.tsx`
  - Acceptance: Component still functions correctly with extracted code

- [ ] Update RefundApprovalQueue tests
  - Files: `src/components/admin/__tests__/refund-approval-queue.test.tsx` (modify)
  - Changes: Update imports to include new utilities
  - Tests: All existing tests should still pass
  - Acceptance: No test failures, maintains coverage

## Acceptance Criteria
- [ ] Utility functions extracted to `@/lib/utils/refunds`
- [ ] RefundCard component created and independently tested
- [ ] RefundApprovalQueue reduced from 165 lines to ~60 lines
- [ ] All functions ≤20 lines
- [ ] All components have explicit return types
- [ ] Test coverage maintained at ≥70%
- [ ] All tests pass: `bun test`
- [ ] TypeScript compiles without errors
- [ ] Visual appearance unchanged (no UI regressions)

## Files to Create/Modify

### New Files (4)
- `src/lib/utils/refunds.ts` - Utility functions
- `src/lib/utils/__tests__/refunds.test.ts` - Utility tests
- `src/components/admin/refund-card.tsx` - Extracted component
- `src/components/admin/__tests__/refund-card.test.tsx` - Component tests

### Modified Files (2)
- `src/components/admin/refund-approval-queue.tsx` - Use extracted utilities and component
- `src/components/admin/__tests__/refund-approval-queue.test.tsx` - Update imports

## Dependencies
- Depends on: Centralized logging (for consistent error handling)
- Depends on: Type safety fixes (for consistent return types)

## Testing Strategy
1. **Unit Tests**:
   ```bash
   bun test src/lib/utils/__tests__/refunds.test.ts
   bun test src/components/admin/__tests__/refund-card.test.tsx
   ```

2. **Integration Tests**:
   ```bash
   bun test src/components/admin/__tests__/refund-approval-queue.test.tsx
   ```

3. **Visual Regression**:
   - Navigate to /admin/refunds
   - Verify cards render identically
   - Test approve button functionality
   - Check loading and empty states

4. **Coverage Check**:
   ```bash
   bun test --coverage
   ```
   Ensure ≥70% coverage maintained

## Notes
- This refactoring improves maintainability without changing functionality
- Extracted components can be reused in future admin features
- Utility functions can be used across refund-related components
- Component is now easier to test and modify
